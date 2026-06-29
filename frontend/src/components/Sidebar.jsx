import React from 'react';

const Sidebar = ({ csvHeaders, components, onAddComponent }) => {
  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          📋 Available CSV Fields
        </h3>
        <div className="max-h-48 overflow-y-auto">
          {csvHeaders && csvHeaders.length > 0 ? (
            csvHeaders.map((header, index) => (
              <div key={index} className="flex justify-between items-center px-3 py-2 mb-1 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">{header}</span>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">string</span>
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-gray-400">
              <p className="text-sm">No CSV loaded</p>
              <p className="text-xs mt-1 text-gray-300">Upload a CSV file to get started</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-gray-100 flex-1">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          📐 Components
        </h3>
        <div className="max-h-48 overflow-y-auto">
          {components && components.length > 0 ? (
            components.map((comp) => (
              <div key={comp.id} className="flex items-center px-3 py-2 mb-1 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="mr-2">{comp.type === 'text' ? '📝' : '📊'}</span>
                <span className="text-sm text-gray-700">
                  {comp.type === 'text' ? 'Text' : 'Table'} #{comp.id}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-gray-400">
              <p className="text-sm">No components added</p>
              <p className="text-xs mt-1 text-gray-300">Add components from the top bar</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 mt-auto border-t border-gray-100">
        <button 
          className="w-full px-4 py-2.5 mb-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAddComponent('text')}
          disabled={!csvHeaders || csvHeaders.length === 0}
        >
          ➕ Add Text
        </button>
        <button 
          className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-700 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAddComponent('table')}
          disabled={!csvHeaders || csvHeaders.length === 0}
        >
          📊 Add Table
        </button>
      </div>
    </div>
  );
};

export default Sidebar;