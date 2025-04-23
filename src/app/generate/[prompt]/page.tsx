'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSetAtom, useAtom } from 'jotai';
import { fileStructureAtom, selectedFileAtom, generationStatusAtom, generationErrorAtom, FileSystemNode } from '@/store/atoms';
import FileExplorer from '@/components/FileExplorer';
import CodeEditor from '@/components/CodeEditor';
import { Loader2 } from 'lucide-react';

interface Step {
  type: 'CreateFile' | 'UpdateFile' | 'Shell';
  path?: string;
  code?: string;
  command?: string;
  status: 'pending' | 'completed';
}

// Helper function to find a file in the file structure
function findFile(node: FileSystemNode | null, path: string): FileSystemNode | null {
  if (!node) return null;
  if (node.path === path) return node;
  if (node.type === 'folder' && node.children) {
    for (const child of node.children) {
      const found = findFile(child, path);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to parse XML into steps
function parseXml(xml: string): Step[] {
  const steps: Step[] = [];
  
  // First, try to match each boltAction tag
  const actionRegex = /<boltAction\s+([^>]*)>([\s\S]*?)<\/boltAction>/g;
  let actionMatch;

  while ((actionMatch = actionRegex.exec(xml)) !== null) {
    const [_, attributes, content] = actionMatch;
    
    // Then parse the attributes
    const typeMatch = attributes.match(/type="([^"]*)"/);
    const filePathMatch = attributes.match(/filePath="([^"]*)"/);
    
    const type = typeMatch ? typeMatch[1] : null;
    const filePath = filePathMatch ? filePathMatch[1] : null;

    console.log("Parsed attributes:", { type, filePath, content: content.trim() });

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
    }
  }

  return steps;
}

export default function GeneratorPage() {
  const params = useParams();
  const prompt = params.prompt ? decodeURIComponent(params.prompt as string) : '';
  
  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [fileStructure, setFileStructure] = useAtom(fileStructureAtom);
  const [selectedFile, setSelectedFile] = useAtom(selectedFileAtom);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  useEffect(() => {
    let updateHappened = false;
    
    steps.filter(({status}) => status === "pending").forEach(step => {
      updateHappened = true;
      if (step?.type === 'CreateFile' && step.path) {
        console.log('Processing file:', step.path);
        const root: FileSystemNode = fileStructure || {
          id: 'root',
          name: 'root',
          type: 'folder',
          path: '/',
          children: []
        };

        let parsedPath = step.path.split("/").filter(Boolean);
        console.log('Parsed path:', parsedPath);
        let currentNode = root;
        let currentPath = '';

        // Create folder structure
        for (let i = 0; i < parsedPath.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parsedPath[i]}` : parsedPath[i];
          console.log('Creating folder:', currentPath);
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
        console.log('Adding file:', filePath);
        
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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-100">Code Generator</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-[calc(100vh-5rem)] grid grid-cols-4 gap-6 p-6">
          <div className="col-span-1 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Steps</h2>
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
                       step.type === 'UpdateFile' ? 'Update File' : 'Run Command'}
                    </div>
                    <div className="text-sm opacity-80">
                      {step.type === 'CreateFile' ? step.path : step.type === 'UpdateFile' ? step.path : step.command}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!(loading || !templateSet) && (
              <div className="bg-gray-800 rounded-lg p-4">
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
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded"
                  disabled={loading || !userPrompt.trim()}
                >
                  Send
                </button>
              </div>
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
                <div className="w-full h-full bg-white rounded">
                  {/* Preview iframe would go here */}
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