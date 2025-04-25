'use client';

import React, { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { fileStructureAtom, selectedFileAtom,  } from '@/store/atoms';
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import { FileSystemNode } from '@/types';
interface FileNodeProps {
  node: FileSystemNode;
  onSelect: (path: string) => void;
  selectedPath: string | null;
  level: number;
  isExpanded?: boolean;
}

const FileNode: React.FC<FileNodeProps> = ({ 
  node, 
  onSelect, 
  selectedPath, 
  level,
  isExpanded: initialExpanded
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded ?? true);

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    if (node.type === 'file') {

      onSelect(node.path);
    } else if (node.type === 'folder') {
   
      setIsExpanded(!isExpanded);
    }
  };

  const isSelected = selectedPath === node.path;


  return (
    <div className="select-none" style={{ paddingLeft: `${level * 16}px` }}>
      <div
        className={`flex text-white items-center py-1 px-2 rounded ${
          isSelected ? 'bg-blue-400 text-blue-950' : 'hover:bg-gray-700'
        } cursor-pointer`}
        onClick={handleSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleSelect(e as any);
          }
        }}
      >
        {node.type === 'folder' ? (
          <span className="flex items-center">
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 text-gray-500 mr-1" /> : 
              <ChevronRight className="h-4 w-4 text-gray-500 mr-1" />
            }
            <Folder className="h-4 w-4 text-blue-400 mr-2" />
            {node.name}
          </span>
        ) : (
          <span className="flex items-center">
            <File className="h-4 w-4 text-gray-400 mr-2 ml-5" />
            {node.name}
          </span>
        )}
      </div>

      {node.type === 'folder' && isExpanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <FileNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedPath={selectedPath}
              level={level + 1}
              isExpanded={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer: React.FC = () => {
  const [fileStructure] = useAtom(fileStructureAtom);
  const [selectedFile, setSelectedFile] = useAtom(selectedFileAtom);

  const handleSelect = useCallback((path: string) => {
   
    setSelectedFile(path);
  }, [setSelectedFile]);

  if (!fileStructure) {
    console.log('No file structure available');
    return (
      <div className="p-4 text-gray-500">
        <p>No files generated yet.</p>
      </div>
    );
  }

  console.log('Current file structure:', fileStructure);

  return (
    <div className="h-full overflow-auto font-mono text-sm">
      {fileStructure.children && fileStructure.children.length > 0 ? (
        <div className="p-2">
          {fileStructure.children.map((node) => {
       
            return (
              <FileNode
                key={node.id}
                node={node}
                onSelect={handleSelect}
                selectedPath={selectedFile}
                level={0}
                isExpanded={true}
              />
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-gray-500">
          <p>No files or folders found.</p>
        </div>
      )}
    </div>
  );
};

export default FileExplorer; 