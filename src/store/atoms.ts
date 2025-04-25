import { atom } from 'jotai';
import { FileSystemNode } from '@/types';
import { WebContainer } from '@webcontainer/api';

// Atom to hold the root of the file structure
export const fileStructureAtom = atom<FileSystemNode | null>(null);

// Atom to hold the path of the currently selected file
export const selectedFileAtom = atom<string | null>(null);

// Atom to track the generation status (e.g., loading, streaming, complete, error)
export const generationStatusAtom = atom<'idle' | 'loading' | 'streaming' | 'complete' | 'error'>('idle');

// Atom to store any error message during generation
export const generationErrorAtom = atom<string | null>(null);

// Atom derived from selectedFileAtom and fileStructureAtom to get the content of the selected file
export const selectedFileContentAtom = atom<string | undefined>((get) => {
  const selectedPath = get(selectedFileAtom);
  const structure = get(fileStructureAtom);

  if (!selectedPath || !structure) {
    return undefined;
  }

  // Helper function to find a file node by path
  const findFileNode = (node: FileSystemNode, path: string): FileSystemNode | null => {
    if (node.path === path && node.type === 'file') {
      return node;
    }
    if (node.type === 'folder' && node.children) {
      for (const child of node.children) {
        const found = findFileNode(child, path);
        if (found) return found;
      }
    }
    return null;
  };

  const fileNode = findFileNode(structure, selectedPath);
  return fileNode?.content;
}); 

export const webContainerAtom=atom<WebContainer | null>(null);
