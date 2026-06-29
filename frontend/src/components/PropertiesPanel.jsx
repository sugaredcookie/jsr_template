import React from 'react';

const PropertiesPanel = ({ selectedComponent, csvHeaders, onUpdateComponent, onDeleteComponent }) => {
  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400">
          <span className="text-5xl mb-4">📐</span>
          <h3 className="text-base font-medium text-gray-500 mb-1">No component selected</h3>
          <p className="text-sm text-gray-400">Click on a component to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleChange = (key, value) => {
    onUpdateComponent(selectedComponent.id, { [key]: value });
  };

  const handleColumnToggle = (column) => {
    const currentColumns = selectedComponent.props.columns || [];
    const updatedColumns = currentColumns.includes(column)
      ? currentColumns.filter(c => c !== column)
      : [...currentColumns, column];
    handleChange('columns', updatedColumns);
  };

  const renderProperties = () => {
    switch (selectedComponent.type) {
      case 'text':
        return (
          <div className="p-5 overflow-y-auto flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Text</label>
              <input
                type="text"
                value={selectedComponent.props.value || ''}
                onChange={(e) => handleChange('value', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Size</label>
              <input
                type="number"
                min="8"
                max="72"
                value={selectedComponent.props.fontSize || 16}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value) || 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedComponent.props.bold || false}
                  onChange={(e) => handleChange('bold', e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">Bold</span>
              </label>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="p-5 overflow-y-auto flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Columns</label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
                {csvHeaders && csvHeaders.length > 0 ? (
                  csvHeaders.map((header) => (
                    <label key={header} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(selectedComponent.props.columns || []).includes(header)}
                        onChange={() => handleColumnToggle(header)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{header}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 py-2">No CSV columns available</p>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Selected Columns</label>
              <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded min-h-[40px]">
                {(selectedComponent.props.columns || []).length > 0 ? (
                  (selectedComponent.props.columns || []).map((col, index) => (
                    <span key={index} className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700">
                      {col}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No columns selected</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <p className="p-5 text-gray-500">Unknown component type</p>;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Properties</h3>
        <button 
          className="px-3 py-1 rounded bg-red-50 text-red-500 text-sm hover:bg-red-500 hover:text-white transition-all"
          onClick={() => {
            if (window.confirm(`Delete ${selectedComponent.type} component #${selectedComponent.id}?`)) {
              onDeleteComponent(selectedComponent.id);
            }
          }}
        >
          🗑️ Delete
        </button>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
          {selectedComponent.type === 'text' ? '📝 Text' : '📊 Table'}
        </span>
        <span className="text-xs text-gray-400">#{selectedComponent.id}</span>
      </div>
      {renderProperties()}
    </div>
  );
};

export default PropertiesPanel;