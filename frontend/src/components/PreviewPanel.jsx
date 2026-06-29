import React, { useState } from 'react';

const PreviewPanel = ({ html, onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex-1 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'p-4'}`}>
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-700">
              📄 Report Preview
            </h3>
            <span className="text-sm text-gray-500">
              HTML Preview Mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              {isFullscreen ? '🔍 Exit Fullscreen' : '🔍 Fullscreen'}
            </button>
            <button
              onClick={onBack}
              className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              ✏️ Back to Design
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 bg-gray-100 overflow-auto">
          <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '1000px' }}>
            <iframe
              srcDoc={html}
              title="Report Preview"
              className="w-full"
              style={{ 
                height: isFullscreen ? 'calc(100vh - 80px)' : '800px',
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