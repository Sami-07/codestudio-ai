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
import { WebContainer } from '@webcontainer/api';
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
  const webcontainer=useWebContainer();

  function convertToWebContainerFormat(rootNode) {
    const files = {};
  
    // Helper function to recursively process nodes
    function processNode(node) {
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
        const directoryContents = {};
        // Process children if they exist
        if (node.children) {
          for (const child of node.children) {
            // Recursively process each child and add it to the directoryContents
            // using the child's name as the key.
            directoryContents[child.name] = processNode(child);
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
        files[child.name] = processNode(child);
      }
    }
  
    return files;
  }
  
  async function FileHandlerWC() {
    const localwcfs=convertToWebContainerFormat(fileStructure);
    await webcontainer?.mount(localwcfs);
    console.log("Files mounted...");
    const listProcess = await webcontainer?.spawn('ls', ['.']);
       listProcess?.output.pipeTo(new WritableStream({
         write(data) {
           console.log(data);
         }
       }));
       const listExitCode = await listProcess?.exit;
       if (listExitCode !== 0) {
         throw new Error(`npm install failed with exit code ${listExitCode}`);
       }
  
      console.log("Installing dependencies...");
      const installProcess = await webcontainer?.spawn('npm', ['i']);
  
      installProcess?.output.pipeTo(new WritableStream({
        write(data) {
          console.log(data);
        }
      }));
       // Wait for the installation process to complete
       const installExitCode = await installProcess?.exit;
       if (installExitCode !== 0) {
         throw new Error(`npm install failed with exit code ${installExitCode}`);
       }
   
       console.log("Starting development server...");
       const devProcess = await webcontainer?.spawn('npm', ['run', 'dev']);
   
       devProcess?.output.pipeTo(new WritableStream({
         write(data) {
           console.log(data);
         }
       }));
   
       webcontainer?.on('server-ready', (port, url) => {
         console.log(`Server is ready at ${url}`);
         setUrl(url);
       });
  }
  
  
  useEffect(() => {
    let updateHappened = false;
    
    steps.filter(({status}) => status === "pending").forEach(step => {
      updateHappened = true;
      if (step?.type === 'CreateFile' && step.path) {
        
        const root: FileSystemNode = fileStructure || {
          id: 'root',
          name: 'root',
          type: 'folder',
          path: '/',
          children: []
        };

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
            currentNode.children?.push(folder);
          }
          
          currentNode = folder;
        }

        // Add the file
        const fileName = parsedPath[parsedPath.length - 1];
        const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
    
        
        const existingFile = currentNode.children?.find(
          child => child.type === 'file' && child.path === filePath
        );

        if (existingFile) {
          existingFile.content = step.code;
          step.type = 'UpdateFile';
        } else {
          currentNode.children?.push({
            id: `file-${filePath}`,
            name: fileName,
            type: 'file',
            path: filePath,
            content: step.code
          });
        }

        console.log('Updated file structure:', root);
        setFileStructure(root);
      }
    });

    if (updateHappened) {
      setSteps(steps => steps.map(s => ({
        ...s,
        status: "completed" as const
      })));
    }
   
  }, [steps, fileStructure, setFileStructure]);

  async function init() {
    try {
      setLoading(true);
      const templateResponse = await fetch('/api/ai/template?' + new URLSearchParams({ prompt }));
      if (!templateResponse.ok) {
        throw new Error('Failed to determine project type');
      }
      
      const { prompts, uiPrompts, projectType } = await templateResponse.json();
    //   const promptMessages = prompts.map((content: string) => ({
    //     role: "user",
    //     content
    //   }))
      setTemplateSet(true);

      setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
        ...x,
        status: "pending"
      })));

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
      
      setSteps(s => [
        ...s,
        ...parseXml(response).map(x => ({
          ...x,
          status: "pending" as const
        }))
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (prompt) {
      init();
    }
  }, [prompt]);

  useEffect(() => {
    console.log("steps", steps);
    
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
  //   // Extract design components from steps
  //   const designsStep = steps.find(step => step.type === 'Designs');
  //   if (designsStep && designsStep.components) {
  //     setDesignComponents(designsStep.components);
  //   }
  // }, [steps]);

  // useEffect(()=>{
  //   async function init() {
  //     const updatedWcfs=convertToWebContainerFormat(fileStructure);
  //     setWcfs(updatedWcfs);
  //     await webcontainer?.mount(updatedWcfs);
  //   }
  //   init();
  // },[fileStructure])

  useEffect(()=>{
    if(webcontainer)
    FileHandlerWC();
  },[fileStructure,webcontainer])

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-100">Code Generator</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-[calc(100vh-5rem)] grid grid-cols-4 gap-6 p-6">
          <div className="col-span-1 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loading || !templateSet ? (
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
                    <button 
                      onClick={() => setViewMode(viewMode === 'steps' ? 'designs' : 'steps')}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Switch to {viewMode === 'steps' ? 'Designs' : 'Steps'}
                    </button>
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
            </div>
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