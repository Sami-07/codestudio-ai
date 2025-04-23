import { XMLParser } from 'fast-xml-parser';
import { FileSystemNode } from '@/store/atoms';

// Helper function to ensure structure is treated as an array
const ensureArray = (obj: any) => (Array.isArray(obj) ? obj : obj ? [obj] : []);

// Function to clean text content that may have whitespace or newlines
const cleanContent = (content: string): string => {
  if (!content) return '';
  return content.replace(/^\s*\n+|\n+\s*$/g, ''); // Remove leading/trailing newlines
};

// Function to build the nested file structure from flat paths
function buildTree(actions: any[]): FileSystemNode {
  const root: FileSystemNode = {
    id: 'root',
    name: 'Project Root',
    type: 'folder',
    path: '/',
    children: [],
  };

  actions.forEach((action) => {
    // Handle both attribute formats: '@_type' and 'type'
    const actionType = action['@_type'] || action.type;
    const filePath = (action['@_filePath'] || action.filePath || '').trim();
    
    if (actionType !== 'file' || !filePath) {
      // Log non-file actions or missing paths
      console.log(`Skipping action: type=${actionType}, path=${filePath || 'none'}`);
      return;
    }

    // Extract content - handle both formats
    let content = '';
    if (action['#text']) {
      content = cleanContent(action['#text']);
    } else if (typeof action === 'object' && Object.keys(action).length > 0) {
      // For complex content, combine all non-attribute fields
      content = Object.entries(action)
        .filter(([key]) => !key.startsWith('@'))
        .map(([_, val]) => String(val))
        .join('\n');
      content = cleanContent(content);
    }

    const pathParts = filePath.split(/[/\\]/).filter((part: string) => part !== ''); // Split by / or \
    let currentLevel = root.children!;
    let currentPath = '';

    // Build the folder structure and add the file
    pathParts.forEach((part: string, index: number) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = index === pathParts.length - 1;

      let existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        if (existingNode.type === 'file' && !isLastPart) {
          console.error(`Path conflict: Trying to create folder '${part}' where file already exists.`);
          return; // Skip this problematic path part
        }
        if (existingNode.type === 'folder' && isLastPart) {
          console.error(`Path conflict: Trying to create file '${part}' where folder already exists.`);
          return; // Skip this problematic path part
        }
        
        // Navigate deeper if it's a folder
        if (existingNode.type === 'folder') {
          currentLevel = existingNode.children!;
        } 
        // Update content if it's the last part and existing node is a file
        else if (isLastPart && existingNode.type === 'file') {
          existingNode.content = content; // Update the file content
        }
      } else {
        // Node doesn't exist, create it
        const newNode: FileSystemNode = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: isLastPart ? 'file' : 'folder',
          ...(isLastPart ? { content } : { children: [] }),
        };
        currentLevel.push(newNode);
        if (!isLastPart) {
          currentLevel = newNode.children!;
        }
      }
    });
  });

  return root;
}

/**
 * Parses the studio XML string and converts it into a FileSystemNode structure.
 * Handles potential XML parsing errors and different XML formats.
 */
export function parsestudioXml(xmlString: string): FileSystemNode {
  // If the XML doesn't start with an XML declaration, add a wrapper
  let xmlToParse = xmlString;
  if (!xmlString.trim().startsWith('<?xml') && !xmlString.trim().startsWith('<studioArtifact')) {
    xmlToParse = `<studioArtifact>${xmlString}</studioArtifact>`;
  }

  const parser = new XMLParser({
    ignoreAttributes: false, // Keep attributes like filePath and type
    allowBooleanAttributes: true,
    preserveOrder: false,
    trimValues: true,
    parseTagValue: true,
    parseAttributeValue: true,
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      // Ensure studioAction is always treated as an array
      return name === 'studioAction';
    },
  });

  try {
    const jsonObj = parser.parse(xmlToParse);

    // Navigate to the studioAction array
    let studioArtifact = jsonObj.studioArtifact;
    
    // Handle case where XML might be wrapped in another tag
    if (!studioArtifact && jsonObj.root && jsonObj.root.studioArtifact) {
      studioArtifact = jsonObj.root.studioArtifact;
    }
    
    if (!studioArtifact) {
      console.warn('No <studioArtifact> found in XML. Trying to parse directly...');
      
      // Try to find any studioAction elements regardless of structure
      let actions = [];
      if (jsonObj.studioAction) {
        actions = ensureArray(jsonObj.studioAction);
      } else {
        // Last resort: search for any object with filePath attribute
        const findFileActions = (obj: any): any[] => {
          if (!obj || typeof obj !== 'object') return [];
          
          let result: any[] = [];
          if ((obj['@_filePath'] || obj.filePath) && (obj['@_type'] === 'file' || obj.type === 'file')) {
            result.push(obj);
          }
          
          Object.values(obj).forEach(value => {
            if (typeof value === 'object') {
              result = result.concat(findFileActions(value));
            }
          });
          
          return result;
        };
        
        actions = findFileActions(jsonObj);
      }
      
      if (actions.length === 0) {
        throw new Error('Could not find any file actions in the XML.');
      }
      
      return buildTree(actions);
    }

    // Handle case where there might be one or multiple studioAction tags
    const actions = ensureArray(studioArtifact.studioAction);

    if (!actions || actions.length === 0) {
      console.warn('No <studioAction> tags found within <studioArtifact>.');
      // Return a default empty root structure
      return { id: 'root', name: 'Empty Project', type: 'folder', path: '/', children: [] };
    }

    // Build the file tree structure
    return buildTree(actions);

  } catch (error) {
    console.error("Error parsing studio XML:", error);
    // You might want to return a default structure or re-throw
    throw new Error(`Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// TODO: Implement progressive/chunk-based parsing if needed for large streams.
// This current implementation parses the complete XML string at once.
// Progressive parsing is more complex and requires handling incomplete tags. 