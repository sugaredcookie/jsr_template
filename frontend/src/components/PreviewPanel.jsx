import React from 'react';

const PreviewPanel = ({ html }) => {
  return (
    <div className="flex-1 overflow-auto bg-slate-100 p-4">
      <div className="max-w-5xl mx-auto">
        <iframe
          id="report-preview-iframe"
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-[calc(100vh-80px)] bg-white rounded-xl shadow-lg border border-slate-200"
          title="Report Preview"
        />
      </div>
    </div>
  );
};

export default PreviewPanel;