import React from 'react';
import { componentRegistry } from '../registry/componentRegistry';

const Canvas = ({ 
  components, 
  csvData, 
  csvHeaders, 
  onSelectComponent, 
  selectedComponent,
  onTextEdit,
  onDeleteComponent
}) => {
  const handleDoubleClick = (e, component) => {
    e.stopPropagation();
    if (component.type === 'text') {
      const newValue = prompt('Edit text:', component.props.value);
      if (newValue !== null) {
        onTextEdit(component.id, newValue);
      }
    }
  };

  const handleDelete = (e, component) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${component.type} component #${component.id}?`)) {
      onDeleteComponent(component.id);
    }
  };

  const renderComponent = (component) => {
    const Renderer = componentRegistry[component.type];
    if (!Renderer) return null;

    return (
      <div
        key={component.id}
        className={`relative mb-4 p-3 rounded border-2 transition-all cursor-pointer ${
          selectedComponent?.id === component.id 
            ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100' 
            : 'border-transparent hover:border-blue-200 hover:bg-gray-50'
        }`}
        onClick={() => onSelectComponent(component)}
        onDoubleClick={(e) => handleDoubleClick(e, component)}
      >
        <div className="absolute -top-2.5 -right-2.5 hidden group-hover:block hover:block z-10">
          <button 
            className="w-6 h-6 rounded-full border-none bg-red-500 text-white text-base flex items-center justify-center hover:bg-red-400 hover:scale-110 transition-all shadow-md shadow-red-300"
            onClick={(e) => handleDelete(e, component)}
            title="Delete component"
          >
            ×
          </button>
        </div>
        <Renderer 
          {...component.props} 
          csvData={csvData}
          csvHeaders={csvHeaders}
        />
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 bg-gray-200 overflow-auto flex justify-center items-start">
      <div className="w-full max-w-6xl flex justify-center">
        <div className="w-[794px] min-h-[1123px] bg-white shadow-lg p-10 rounded-sm">
          {components && components.length > 0 ? (
            components.map(renderComponent)
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center text-gray-400">
                <span className="text-5xl block mb-4">📄</span>
                <h3 className="text-lg font-medium text-gray-500 mb-1">No components added</h3>
                <p className="text-sm text-gray-400">Upload a CSV and start adding components</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas;