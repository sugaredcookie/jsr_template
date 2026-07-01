import React from 'react';

const PreviewPanel = ({ html, onBack }) => {
  return (
    <div className="flex-1 p-4">
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-gray-700">📄 Report Preview</h3>
            <span className="text-xs text-gray-500">HTML Preview Mode</span>
          </div>
        </div>
        <div className="flex-1 p-4 bg-gray-100 overflow-auto">
          <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '1000px' }}>
            <iframe
              srcDoc={html}
              title="Report Preview"
              className="w-full"
              style={{ 
                height: '800px',
                border: 'none',
                backgroundColor: 'white'
              }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;