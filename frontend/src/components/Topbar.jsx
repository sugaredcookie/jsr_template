import React, { useRef } from 'react';

const Topbar = ({ 
  onFileUpload, 
  onAddText, 
  onAddTable, 
  onGeneratePreview,
  onBackToDesign,
  csvHeaders, 
  isGenerating,
  generationProgress,
  componentsCount,
  isPreviewMode,
  hasPreview
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="flex flex-wrap justify-between items-center px-6 py-3 bg-white border-b border-gray-200 shadow-sm min-h-16 flex-shrink-0">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-900">📊 Report Designer</h2>
        {isPreviewMode && (
          <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Preview Mode
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 items-center">
        {!isPreviewMode ? (
          <>
            <button 
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-all hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={handleUploadClick}
            >
              📁 Upload CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button 
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-all hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={onAddText}
              disabled={!csvHeaders || csvHeaders.length === 0}
            >
              ➕ Add Text
            </button>
            
            <button 
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md font-medium transition-all hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={onAddTable}
              disabled={!csvHeaders || csvHeaders.length === 0}
            >
              📋 Add Table
            </button>

            <button 
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                isGenerating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white hover:shadow-md'
              }`}
              onClick={onGeneratePreview}
              disabled={isGenerating || !csvHeaders || csvHeaders.length === 0 || componentsCount === 0}
            >
              {isGenerating ? '⏳ Generating...' : '👁️ Generate Preview'}
            </button>
          </>
        ) : (
          <button 
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-all hover:shadow-md"
            onClick={onBackToDesign}
          >
            ✏️ Back to Design
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {csvHeaders && csvHeaders.length > 0 && (
          <span className="px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-600">
            {csvHeaders.length} columns
          </span>
        )}
        {componentsCount > 0 && !isPreviewMode && (
          <span className="px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-600">
            {componentsCount} components
          </span>
        )}
        {generationProgress && (
          <span className={`px-3 py-1.5 rounded text-sm ${
            generationProgress.status === 'success' ? 'bg-green-100 text-green-700' :
            generationProgress.status === 'error' ? 'bg-red-100 text-red-700' :
            generationProgress.status === 'loading' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {generationProgress.message}
          </span>
        )}
      </div>
    </div>
  );
};

export default Topbar;