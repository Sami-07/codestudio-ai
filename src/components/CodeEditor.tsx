'use client';

import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import Editor from '@monaco-editor/react';
import { selectedFileAtom, selectedFileContentAtom, fileStructureAtom } from '@/store/atoms';
import { FileSystemNode } from '@/types';
// Helper function to determine the language based on file extension
const getLanguageFromPath = (path: string | null): string => {
  if (!path) return 'plaintext';

  const extension = path.split('.').pop()?.toLowerCase();
  if (!extension) return 'plaintext';

  switch (extension) {
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'c':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'rs':
      return 'rust';
    case 'sh':
      return 'shell';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'swift':
      return 'swift';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'xml':
      return 'xml';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
};

// Helper function to update a node's content in the file structure tree
const updateNodeContent = (
  node: FileSystemNode,
  targetPath: string,
  newContent: string
): FileSystemNode => {
  if (node.path === targetPath && node.type === 'file') {
    return { ...node, content: newContent };
  }

  if (node.type === 'folder' && node.children) {
    return {
      ...node,
      children: node.children.map((child: any) => updateNodeContent(child, targetPath, newContent))
    };
  }

  return node;
};

const CodeEditor: React.FC = () => {
  const [selectedFile] = useAtom(selectedFileAtom);
  const [fileContent] = useAtom(selectedFileContentAtom);
  const [fileStructure, setFileStructure] = useAtom(fileStructureAtom);
  const [localContent, setLocalContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Update local content when selected file changes
  useEffect(() => {
    if (fileContent !== undefined) {
      setLocalContent(fileContent || '');
    }
  }, [fileContent, selectedFile]);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setLocalContent(value);
      // Auto-save after a debounce
      updateFileContent(value);
    }
  };

  const updateFileContent = (newContent: string) => {
    if (!selectedFile || !fileStructure) return;

    // Update the file structure with the new content
    const updatedStructure = updateNodeContent(fileStructure, selectedFile, newContent);
    //@ts-ignore
    setFileStructure(updatedStructure);
  };

  if (!selectedFile) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 p-8">
        <p>Select a file to view or edit its content.</p>
      </div>
    );
  }

  const language = getLanguageFromPath(selectedFile);
  console.log("language", language);
  const fileName = selectedFile.split('/').pop() || '';

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-2 flex items-center">
        <span className="font-medium truncate text-blue-600 text-sm">{fileName}</span>
        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
          {language}
        </span>
      </div>
      <div className="flex-1 min-h-0">
      <Editor
      height="100%"
      language={language}
      defaultLanguage="typescript"
      theme="vs-dark"
      value={localContent || ''}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
      }}
    />
      </div>
    </div>
  );
};

export default CodeEditor; 