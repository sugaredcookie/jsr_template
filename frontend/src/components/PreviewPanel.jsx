import React from 'react';

const PreviewPanel = ({ html }) => {
  return (
    <div className="flex-1 bg-slate-900/[0.02] overflow-auto p-10 flex justify-center items-start animate-fade-in">
      {/* High-fidelity Vector Report Frame */}
      <div className="w-full max-w-5xl border border-slate-200/60 bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-indigo-500/[0.02]">
        <iframe
          id="report-preview-iframe" // ADDED: Explicit target ID selector anchor
          srcDoc={html}
          title="Report Schema Sandbox View"
          className="w-full min-h-[1150px]"
          style={{ 
            border: 'none',
            backgroundColor: '#ffffff'
          }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default PreviewPanel;