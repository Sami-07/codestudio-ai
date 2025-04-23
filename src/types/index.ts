// Types for the file structure
export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileSystemNode[];
}

// Types for steps
export interface Step {
  type: 'CreateFile' | 'UpdateFile' | 'Shell' | 'Designs';
  path?: string;
  code?: string;
  command?: string;
  components?: ComponentDesign[];
  status: 'pending' | 'completed';
}

// Types for design components
export interface ComponentDesign {
  name: string;
  path: string;
  variations: string[];
}

// Types for messages
export interface Message {
  role: "user" | "assistant";
  content: string;
} 