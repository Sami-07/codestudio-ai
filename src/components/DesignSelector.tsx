import React, { useState } from 'react';
import { ComponentDesign } from '@/types';

interface DesignSelectorProps {
  components: ComponentDesign[];
  onSelectDesign: (componentPath: string, designPath: string) => void;
}

const DesignSelector: React.FC<DesignSelectorProps> = ({ components, onSelectDesign }) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const handleComponentSelect = (componentPath: string) => {
    setSelectedComponent(componentPath === selectedComponent ? null : componentPath);
  };

  const getDesignName = (path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1].replace(/\.[^/.]+$/, ""); // Remove file extension
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Component Designs</h2>
      <div className="space-y-3">
        {components.map((component) => (
          <div key={component.path} className="border border-gray-700 rounded-lg overflow-hidden">
            <div 
              className="flex justify-between items-center p-3 bg-gray-700 cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => handleComponentSelect(component.path)}
            >
              <span className="font-medium text-gray-100">{component.name}</span>
              <svg 
                className={`w-5 h-5 text-gray-300 transform transition-transform ${selectedComponent === component.path ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {selectedComponent === component.path && (
              <div className="p-3 space-y-2 bg-gray-750">
                {component.variations.map((variation) => (
                  <div 
                    key={variation}
                    className="p-2 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => onSelectDesign(component.path, variation)}
                  >
                    <span className="text-gray-100">{getDesignName(variation)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DesignSelector; 