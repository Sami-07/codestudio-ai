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

// Add scrollbar-hide utility class
const scrollbarHideClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

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
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Code Generator</h1>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl truncate">{prompt}</p>
          </div>
          {deployUrl && (
            <a 
              href={deployUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg flex items-center gap-2"
            >
              <span>View Deployed Site</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          )}
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-[calc(100vh-5rem)] grid grid-cols-4 gap-4 p-4">
          <div className={`col-span-1 space-y-4 overflow-y-auto ${scrollbarHideClass}`}>
            {(loading && !templateSet) || (loading && steps.length === 0) ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                  <p className="text-gray-400 text-sm font-medium">Generating your code...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 shadow-lg">
                  <div className="flex items-center mb-4">
                    <h2 className="text-lg font-bold text-white flex-1">
                      {viewMode === 'steps' ? 'Steps' : 'Component Designs'}
                    </h2>
                    {/* <button 
                      onClick={() => setViewMode(viewMode === 'steps' ? 'designs' : 'steps')}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                      Switch to {viewMode === 'steps' ? 'Designs' : 'Steps'}
                    </button> */}
                  </div>
                  
                  {viewMode === 'steps' ? (
                    <div className="space-y-2">
                      {steps.map((step, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-md border ${
                            step.status === 'completed'
                              ? 'bg-green-950/50 border-green-800 text-green-400'
                              : 'bg-gray-800 border-gray-700 text-gray-300'
                          } transition-all hover:translate-y-[-1px]`}
                        >
                          <div className="font-medium flex items-center gap-2">
                            {step.status === 'completed' && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                            {step.type === 'CreateFile' ? 'Create File' : 
                             step.type === 'UpdateFile' ? 'Update File' : 
                             step.type === 'Designs' ? 'Component Designs' : 'Run Command'}
                          </div>
                          <div className="text-sm opacity-80 mt-1">
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

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 shadow-lg">
                  <h2 className="text-lg font-bold text-white mb-3">Chat</h2>
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="w-full bg-gray-800 text-gray-100 rounded-md p-3 mb-3 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="Enter your message..."
                    rows={4}
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-md transition-colors font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    disabled={loading || !userPrompt.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        Send
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div className={`col-span-1 bg-gray-900 rounded-lg p-4 border border-gray-800 shadow-lg overflow-y-auto ${scrollbarHideClass}`}>
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-bold text-white flex-1">Files</h2>
              {fileStructure && (
                <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-md">
                  {fileStructure.children?.length || 0} items
                </span>
              )}
            </div>
            <div className={`h-[calc(100%-3rem)] overflow-auto font-mono text-sm ${scrollbarHideClass}`}>
              <FileExplorer />
            </div>
          </div>

          <div className="col-span-2 bg-gray-900 rounded-lg border border-gray-800 shadow-lg overflow-hidden">
            <div className="flex items-center p-3 border-b border-gray-800 bg-gray-900">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === 'code'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                    Code
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    Preview
                  </div>
                </button>
              </div>
              
              <button
                onClick={handleDeploy}
                disabled={deploying || !fileStructure}
                className={`px-4 py-2 rounded-md ml-auto text-sm font-medium transition-colors ${
                  deploying || !fileStructure
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {deploying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                    Deploy
                  </span>
                )}
              </button>
            </div>
            
            {deployUrl && (
              <div className="mx-3 my-2 p-3 bg-green-950 border border-green-700 text-green-300 rounded-md flex items-center justify-between shadow-inner">
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Deployed successfully!
                </span>
                <a 
                  href={deployUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white bg-green-700 hover:bg-green-800 px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Visit Site
                </a>
              </div>
            )}
            
            <div className="h-[calc(100%-5rem)]">
              {activeTab === 'code' ? (
                selectedFile ? (
                  <div className="h-full flex flex-col">
                    <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center">
                      <span className="text-gray-300 font-medium">
                        <span className="text-gray-500 mr-1">{selectedFile.split('/').slice(0, -1).join('/')}/</span>
                        {selectedFile.split('/').pop()}
                      </span>
                    </div>
                    <div className={`flex-1 overflow-y-auto ${scrollbarHideClass}`}>
                      <CodeEditor />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 flex-col p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-gray-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <p className="text-center">Select a file from the explorer to view or edit its content.</p>
                  </div>
                )
              ) : ( 
                <div className='w-full h-full flex items-center justify-center bg-white'>
                  {url ? 
                    <iframe className='w-full h-full border-0' src={url}/> : 
                    <div className="flex flex-col items-center justify-center text-gray-500 h-full w-full bg-gray-950">
                      <Loader2 className="h-8 w-8 animate-spin mb-4" />
                      <p>Loading preview...</p>
                    </div>
                  }
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {(loading || !templateSet) && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 shadow-2xl border border-gray-800 max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 bg-indigo-600 rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {!templateSet ? 'Analyzing Your Prompt' : 'Generating Code'}
              </h3>
              <p className="text-gray-400 max-w-xs">
                {!templateSet 
                  ? 'Determining the best project structure based on your requirements...' 
                  : 'Creating files and setting up your project. This may take a moment...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 