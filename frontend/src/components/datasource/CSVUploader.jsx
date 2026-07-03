import React, { useRef, useState } from 'react';

const CSVUploader = ({ onUpload, loading, currentHeaders }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();

  const handleFileSelect = (file) => {
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      onUpload(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragOver ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !loading && fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".csv"
          className="hidden"
          disabled={loading}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">📤</div>
          <div className="font-medium text-slate-700">
            {loading ? 'Uploading...' : 'Drop your CSV here or click to browse'}
          </div>
          <div className="text-sm text-slate-400">Supports .csv files only</div>
        </div>
      </div>

      {selectedFile && !loading && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <span className="text-green-600 text-xl">✅</span>
          <div className="flex-1">
            <div className="font-medium text-green-700">{selectedFile.name}</div>
            <div className="text-sm text-green-600">
              {(selectedFile.size / 1024).toFixed(1)} KB • Ready to use
            </div>
          </div>
        </div>
      )}

      {currentHeaders && currentHeaders.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-700">Detected Columns:</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {currentHeaders.map((header, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                {header}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVUploader;