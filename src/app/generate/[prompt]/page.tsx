'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSetAtom, useAtom } from 'jotai';
import { fileStructureAtom, selectedFileAtom, generationStatusAtom, generationErrorAtom, webContainerAtom } from '@/store/atoms';
import { FileSystemNode, Step, Message, ComponentDesign } from '@/types';
import FileExplorer from '@/components/FileExplorer';
import CodeEditor from '@/components/CodeEditor';
import DesignSelector from '@/components/DesignSelector';
import { Loader2 } from 'lucide-react';
import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { useWebContainer } from '@/hooks/useWebContainer';

// Helper function to parse XML into steps
function parseXml(xml: string): Step[] {
  const steps: Step[] = [];
  
  // First, try to match each studioAction tag
  const actionRegex = /<studioAction\s+([^>]*)>([\s\S]*?)<\/studioAction>/g;
  let actionMatch;

  while ((actionMatch = actionRegex.exec(xml)) !== null) {
    const [_, attributes, content] = actionMatch;
    
    // Then parse the attributes
    const typeMatch = attributes.match(/type="([^"]*)"/);
    const filePathMatch = attributes.match(/filePath="([^"]*)"/);
    
    const type = typeMatch ? typeMatch[1] : null;
    const filePath = filePathMatch ? filePathMatch[1] : null;



    if (type === 'file' && filePath) {
      steps.push({
        type: 'CreateFile',
        path: filePath,
        code: content.trim(),
        status: 'pending'
      });
    } else if (type === 'shell') {
      steps.push({
        type: 'Shell',
        command: content.trim(),
        status: 'pending'
      });
    } else if (type === 'designs') {
      try {
        const designsData = JSON.parse(content.trim());
        steps.push({
          type: 'Designs',
          components: designsData.components || [],
          status: 'pending'
        });
      } catch (error) {
        console.error('Failed to parse designs JSON:', error);
      }
    }
  }

  return steps;
}

// Define the structure expected by WebContainer's mount method
// interface WebContainerFiles {
//   [key: string]: {
//     file?: {
//       contents: string | Uint8Array;
//     };
//     directory?: WebContainerFiles;
//   };
// }

export default function GeneratorPage() {
  const params = useParams();
  const prompt = params.prompt ? decodeURIComponent(params.prompt as string) : '';
  
  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [fileStructure, setFileStructure] = useAtom(fileStructureAtom);
  const [selectedFile, setSelectedFile] = useAtom(selectedFileAtom);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [viewMode, setViewMode] = useState<'steps' | 'designs'>('steps');
  const [designComponents, setDesignComponents] = useState<ComponentDesign[]>([]);
  const [url, setUrl]=useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const webcontainer=useWebContainer();

  function convertToWebContainerFormat(rootNode: FileSystemNode | null): FileSystemTree {
    const files: FileSystemTree = {};
  
    // Helper function to recursively process nodes
    function processNode(node: FileSystemNode): FileSystemTree[string] | null {
      // For a file node from the input
      if (node.type === 'file') {
        // Return the structure { file: { contents: ... } }
        return {
          file: {
            // Use empty string if content is missing or null
            contents: node.content || ''
          }
        };
      }
      // For a folder node from the input
      else if (node.type === 'folder') {
        const directoryContents: FileSystemTree = {};
        // Process children if they exist
        if (node.children) {
          for (const child of node.children) {
            // Recursively process each child and add it to the directoryContents
            // using the child's name as the key.
            const processedChild = processNode(child);
            if(processedChild) {
              directoryContents[child.name] = processedChild;
            }
          }
        }
       
        // Return the structure { directory: { ...contents... } }
        return {
          directory: directoryContents
        };
      }
      // Handle potential unexpected node types if necessary
      return null;
    }
  
    // Start processing from the children of the root node
    // The root node itself (e.g., "todo-app") is usually not represented
    // as a top-level key in the WebContainer format, only its contents are.
    if (rootNode && rootNode.children) {
      for (const child of rootNode.children) {
        // The name of the child node becomes the key in the final 'files' object
        const processedChild = processNode(child);
        if (processedChild) {
            files[child.name] = processedChild;
        }
      }
    }
  
    return files;
  }
  
  async function FileHandlerWC() {
    if (!webcontainer) return;
    console.log("Preparing WebContainer files...");
    const localwcfs=convertToWebContainerFormat(fileStructure);
    
    // Check if the file structure is empty before mounting
    if (Object.keys(localwcfs).length === 0) {
      console.log("File structure is empty, skipping mount.");
      return;
    }

    try {
      console.log("Mounting files to WebContainer:", localwcfs);
      await webcontainer.mount(localwcfs);
      console.log("Files mounted successfully.");

      // Optional: Verify files mounted
      // const listProcess = await webcontainer.spawn('ls', ['.']);
      // listProcess?.output.pipeTo(new WritableStream({
      //   write(data) {
      //     console.log('ls output:', data);
      //   }
      // }));
      // const listExitCode = await listProcess?.exit;
      // if (listExitCode !== 0) {
      //   console.error(`ls command failed with exit code ${listExitCode}`);
      // }
  
      console.log("Installing dependencies...");
      const installProcess = await webcontainer.spawn('npm', ['install']); // Changed from 'i' to 'install' for clarity
  
      installProcess?.output.pipeTo(new WritableStream({
        write(data) {
          console.log('npm install:', data);
        }
      }));
       // Wait for the installation process to complete
       const installExitCode = await installProcess?.exit;
       if (installExitCode !== 0) {
         throw new Error(`npm install failed with exit code ${installExitCode}`);
       }
       console.log("Dependencies installed successfully.");
   
       console.log("Starting development server...");
       const devProcess = await webcontainer.spawn('npm', ['run', 'dev']);
   
       devProcess?.output.pipeTo(new WritableStream({
         write(data) {
           console.log('npm run dev:', data);
         }
       }));
   
       webcontainer.on('server-ready', (port, url) => {
         console.log(`Server is ready on port ${port} at ${url}`);
         setUrl(url);
       });

       webcontainer.on('error', (error) => {
        console.error("WebContainer error:", error);
        // Potentially update UI state to show error
       });

      // Handle process exit for dev server (optional, good practice)
      devProcess.exit.then((code) => {
        console.log(`Dev server process exited with code ${code}`);
        // Maybe reset URL or show a message if it exits unexpectedly
        if (code !== 0) {
          setUrl(''); // Reset URL if server stops
        }
      });

      // Note: We don't wait for devProcess.exit here as it's a long-running process.
    } catch (error) {
      console.error("Error in FileHandlerWC:", error);
      // Handle errors, maybe set an error state in UI
    }
  }
  
  
  useEffect(() => {
    let updateHappened = false;
    
    const pendingSteps = steps.filter(({ status }) => status === "pending");
    
    if (pendingSteps.length > 0) {
      let root: FileSystemNode = fileStructure || {
        id: 'root',
        name: 'root',
        type: 'folder',
        path: '/',
        children: []
      };
      let structureChanged = false;

      pendingSteps.forEach(step => {
        if (step?.type === 'CreateFile' || step?.type === 'UpdateFile') {
          if (step.path) {
            let parsedPath = step.path.split("/").filter(Boolean);
            let currentNode = root;
            let currentPath = '';

            // Create folder structure
            for (let i = 0; i < parsedPath.length - 1; i++) {
              currentPath = currentPath ? `${currentPath}/${parsedPath[i]}` : parsedPath[i];
        
              let folder = currentNode.children?.find(
                child => child.type === 'folder' && child.name === parsedPath[i]
              );
    
              if (!folder) {
                folder = {
                  id: `folder-${currentPath}`,
                  name: parsedPath[i],
                  type: 'folder',
                  path: currentPath,
                  children: []
                };
                currentNode.children = currentNode.children || []; // Ensure children array exists
                currentNode.children.push(folder);
                structureChanged = true;
              }
              
              currentNode = folder;
            }

            // Add or update the file
            const fileName = parsedPath[parsedPath.length - 1];
            const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
        
            const fileIndex = currentNode.children?.findIndex(
              child => child.type === 'file' && child.name === fileName // Match by name within the current node
            );

            if (fileIndex !== undefined && fileIndex !== -1) {
              // Update existing file
              if (currentNode.children?.[fileIndex].content !== step.code) {
                currentNode.children![fileIndex].content = step.code;
                step.type = 'UpdateFile'; // Ensure type reflects update
                structureChanged = true;
              }
            } else {
              // Add new file
              const newFile: FileSystemNode = {
                id: `file-${filePath}`,
                name: fileName,
                type: 'file',
                path: filePath,
                content: step.code
              };
              currentNode.children = currentNode.children || []; // Ensure children array exists
              currentNode.children?.push(newFile);
              step.type = 'CreateFile'; // Ensure type reflects create
              structureChanged = true;
            }
          }
        } else if (step?.type === 'Designs') {
            // Handle Designs step - currently just logging, could update state
            console.log("Processing Designs step:", step.components);
            if (step.components) {
              setDesignComponents(step.components);
            }
        } else if (step?.type === 'Shell') {
            // Handle Shell step - currently just logging
            // Actual execution should happen within WebContainer, perhaps triggered differently
            console.log("Processing Shell step:", step.command);
        }
      });

      if (structureChanged) {
        console.log('Updated file structure:', root);
        setFileStructure(root);
      }

      // Mark processed steps as completed
      setSteps(currentSteps => currentSteps.map(s => 
        pendingSteps.includes(s) ? { ...s, status: "completed" as const } : s
      ));
    }
   
  }, [steps, fileStructure, setFileStructure]);

  async function init() {
    try {
      setLoading(true);
      setTemplateSet(false); // Reset template set flag
      setUrl(''); // Reset URL
      setFileStructure(null); // Reset file structure
      setSteps([]); // Reset steps
      setLlmMessages([]); // Reset messages

      const templateResponse = await fetch('/api/ai/template?' + new URLSearchParams({ prompt }));
      if (!templateResponse.ok) {
        throw new Error('Failed to determine project type');
      }
      
      const { prompts, uiPrompts, projectType } = await templateResponse.json();

      setTemplateSet(true);

      const initialSteps = parseXml(uiPrompts[0]).map((x: Step) => ({
        ...x,
        status: "pending" as const
      }));
      setSteps(initialSteps);

      const chatResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...prompts, prompt].map(content => ({
            role: "user",
            content
          }))
        
        })
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to generate code');
      }

      const { response } = await chatResponse.json();
      
      const followupSteps = parseXml(response).map(x => ({
        ...x,
        status: "pending" as const
      }));

      setSteps(s => [
        ...s,
        ...followupSteps
      ]);

      setLlmMessages([
        ...[...prompts, prompt].map(content => ({
          role: "user" as const,
          content
        })),
        { role: "assistant" as const, content: response }
      ]);

    } catch (error) {
      console.error('Initialization failed:', error);
      // Set an error state to show in the UI
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (prompt) {
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]); // Intentionally run only when prompt changes

  // Effect to run WebContainer tasks after initial loading and when webcontainer is ready
  useEffect(() => {
    // Only run if not loading, webcontainer exists, and there's a file structure
    if (!loading && webcontainer && fileStructure && Object.keys(fileStructure).length > 0) {
      console.log("Triggering FileHandlerWC...");
      FileHandlerWC();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, webcontainer, fileStructure]); // Rerun when loading finishes, webcontainer is ready, or fileStructure is set

  useEffect(() => {
    console.log("Current steps:", steps);
  }, [steps]);
 
  // const handleDesignSelect = async (componentPath: string, designPath: string) => {
  //   // Get the default file path by replacing the selected design path's filename with 'default'
  //   const pathParts = designPath.split('/');
  //   const fileName = pathParts[pathParts.length - 1];
  //   const fileExt = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
  //   const defaultPath = designPath.replace(fileName, `default${fileExt}`);
    
  //   try {
  //     // This is where we would read the selected design file and update the default file
  //     // For now, we're just going to update the fileStructure
      
  //     // Find the design file in our file structure
  //     const root: FileSystemNode = fileStructure || {
  //       id: 'root',
  //       name: 'root',
  //       type: 'folder',
  //       path: '/',
  //       children: []
  //     };
      
  //     // Helper function to find a file node by path
  //     const findFileNode = (node: FileSystemNode, path: string): FileSystemNode | null => {
  //       if (node.path === path && node.type === 'file') {
  //         return node;
  //       }
  //       if (node.type === 'folder' && node.children) {
  //         for (const child of node.children) {
  //           const found = findFileNode(child, path);
  //           if (found) return found;
  //         }
  //       }
  //       return null;
  //     };
      
  //     const designFileNode = findFileNode(root, designPath);
  //     const defaultFileNode = findFileNode(root, defaultPath);
      
  //     if (designFileNode && defaultFileNode) {
  //       // Update the default file with the content from the design file
  //       defaultFileNode.content = designFileNode.content;
  //       setFileStructure({...root});
        
  //       // Open the default file in the editor
  //       setSelectedFile(defaultPath);
  //     }
  //   } catch (error) {
  //     console.error('Failed to update design:', error);
  //   }
  // };

  // useEffect(() => {
    // Extract design components from steps
    // const designsStep = steps.find(step => step.type === 'Designs');
    // if (designsStep && designsStep.components) {
    //   setDesignComponents(designsStep.components);
    // }
  // }, [steps]);

  // Removed useEffect that called FileHandlerWC on fileStructure changes directly
  // useEffect(()=>{
  //   if(webcontainer)
  //   FileHandlerWC();
  // },[fileStructure,webcontainer])

  const handleDeploy = async () => {
    if (!fileStructure) return;
    
    try {
      setDeploying(true);
      
      const response = await fetch('/api/ai/build-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileStructure: fileStructure
        }),
      });
      
      if (!response.ok) {
        throw new Error('Deployment failed');
      }
      
      const data = await response.json();
      setDeployUrl(data.url);
    } catch (error) {
      console.error('Deployment error:', error);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-100">Code Generator</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-[calc(100vh-5rem)] grid grid-cols-4 gap-6 p-6">
          <div className="col-span-1 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {(loading && !templateSet) || (loading && steps.length === 0) ? ( // Show loader during initial setup or full loading
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-100 flex-1">
                      {viewMode === 'steps' ? 'Steps' : 'Component Designs'}
                    </h2>
                    {/* Only show switch button if designs are available */} 
                    {/* {designComponents.length > 0 && ( */}
                      <button 
                        onClick={() => setViewMode(viewMode === 'steps' ? 'designs' : 'steps')}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded text-sm transition-colors"
                      >
                        Switch to {viewMode === 'steps' ? 'Designs' : 'Steps'}
                      </button>
                    {/* )} */}
                  </div>
                  
                  {viewMode === 'steps' ? (
                    <div className="space-y-2">
                      {steps.map((step, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded ${
                            step.status === 'completed'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          <div className="font-medium">
                            {step.type === 'CreateFile' ? 'Create File' : 
                             step.type === 'UpdateFile' ? 'Update File' : 
                             step.type === 'Designs' ? 'Component Designs' : 'Run Command'}
                          </div>
                          <div className="text-sm opacity-80">
                            {step.type === 'CreateFile' || step.type === 'UpdateFile' ? step.path : 
                             step.type === 'Shell' ? step.command :
                             step.type === 'Designs' ? `${step.components?.length || 0} components` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (<p>HELLO</p>
                    // <DesignSelector 
                    //   components={designComponents} 
                    //   onSelectDesign={handleDesignSelect} 
                    // />
                  )}
                </div>

                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full bg-gray-700 text-gray-100 rounded p-2 mb-2"
                  placeholder="Enter your message..."
                />
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const response = await fetch('/api/ai', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          messages: [
                            ...llmMessages,
                            { role: "user", content: userPrompt }
                          ]
                        

                          //asdf
                        })
                      });

                      if (!response.ok) {
                        throw new Error('Failed to send message');
                      }

                      const { response: aiResponse } = await response.json();
                      
                      setLlmMessages(messages => [
                        ...messages,
                        { role: "user", content: userPrompt },
                        { role: "assistant", content: aiResponse }
                      ]);

                      setSteps(s => [
                        ...s,
                        ...parseXml(aiResponse).map(x => ({
                          ...x,
                          status: "pending" as const
                        }))
                      ]);

                      setUserPrompt('');
                    } catch (error) {
                      console.error('Failed to send message:', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition-colors"
                  disabled={loading || !userPrompt.trim()}
                >
                  Send
                </button>
              </>
            )}
          </div>

          <div className="col-span-1 bg-gray-800 rounded-lg p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Files</h2>
            <div className="h-full overflow-auto font-mono text-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <FileExplorer />
            </div>
          </div>

          <div className="col-span-2 bg-gray-800 rounded-lg p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'code'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'preview'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Preview
              </button>
              <button
                onClick={handleDeploy}
                disabled={deploying || !fileStructure}
                className={`px-4 py-2 rounded ml-auto ${
                  deploying
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {deploying ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deploying...
                  </span>
                ) : (
                  'Deploy'
                )}
              </button>
            </div>
            
            {deployUrl && (
              <div className="mb-4 p-3 bg-green-500/20 text-green-300 rounded-md flex items-center justify-between">
                <span>Deployed successfully!</span>
                <a 
                  href={deployUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                >
                  Visit Site
                </a>
              </div>
            )}
            
            <div className="h-[calc(100%-4rem)]">
              {activeTab === 'code' ? (
                selectedFile ? (
                  <div className="h-full flex flex-col">
                    <div className="border-b border-gray-700 p-2">
                      <span className="text-gray-300">{selectedFile}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <CodeEditor />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Select a file to view or edit its content.
                  </div>
                )
              ) : (
                <div>
                  {url?<iframe className='w-full h-full border' src={url}/>:<p className='text-white w-full h-full border '>loading.....</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(loading || !templateSet) && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 flex items-center space-x-4">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            <span className="text-gray-100">
              {!templateSet ? 'Determining project type...' : 'Generating code...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 