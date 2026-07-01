import React from 'react';
import { useState } from 'react';

const Topbar = ({ 
  csvFileName,
  onFileUpload,
  onAddComponent,
  onGeneratePreview,
  onExitPreview,
  onDownloadHtml,
  isGenerating,
  isPreviewMode,
  csvHeaders,
  componentsCount
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  }

  const componentButtons = [
    { type: 'text', label: 'Text', icon: 'fa-font', color: 'text-blue-500' },
    { type: 'table', label: 'Table', icon: 'fa-table-columns', color: 'text-emerald-500' },
    { type: 'grid-row', label: 'Infographic Grid', icon: 'fa-chart-pie', color: 'text-violet-500' },
    { type: 'spacer', label: 'Spacer', icon: 'fa-arrows-left-right-to-line', color: 'text-amber-500' },
    { type: 'page-break', label: 'Page Break', icon: 'fa-scissors', color: 'text-rose-500' }
  ];

  return (
    <div className="h-16 bg-white/75 backdrop-blur-md border-b border-white/60 flex items-center px-6 gap-6 shadow-xs sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0 group cursor-default transition-all duration-300 hover:opacity-90">
        <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Report Designer
        </h1>
      </div>

      {/* Toolbar Buttons */}
      <div className="flex items-center gap-2 mx-auto bg-slate-200/40 p-1.5 rounded-2xl border border-slate-300/20 backdrop-blur-xs">
        {/* Upload CSV */}
        <label className="cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl shadow-3xs hover:bg-slate-50 hover:border-slate-300/80 text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200">
          <i className="fa-solid fa-cloud-arrow-up text-indigo-500 text-xs"></i>
          <span>Upload CSV</span>
          <input type="file" accept=".csv" className="hidden" onChange={onFileUpload} />
        </label>

        <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

        {/* Component Buttons */}
        {componentButtons.map((btn) => (
          <button 
            key={btn.type}
            onClick={() => onAddComponent(btn.type)} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className={`fa-solid ${btn.icon} ${btn.color} text-xs`}></i>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Full Screen Button */}
      {/* <div className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 bg-slate-800 hover:bg-slate-950 shadow-md">
        <button
          onClick={toggleFullscreen}
          className=""
        >
          {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
        </button>
      </div> */} 
      {/* On hold */}

      {/* Download Button */}
      <button
        onClick={onDownloadHtml}
        className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 bg-slate-800 hover:bg-slate-950 shadow-md"
      >
        <i className="fa-solid fa-download text-xs"></i>
        <span>Download</span>
      </button>

      {/* Generate/Exit Preview Button */}
      <button
        onClick={isPreviewMode ? onExitPreview : onGeneratePreview}
        disabled={isGenerating}
        className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 ${
          isPreviewMode 
            ? 'bg-slate-800 hover:bg-slate-950 shadow-md' 
            : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:opacity-95 shadow-md shadow-indigo-600/10'
        }`}
      >
        {isGenerating ? (
          <i className="fa-solid fa-circle-notch animate-spin text-xs"></i>
        ) : isPreviewMode ? (
          <i className="fa-solid fa-circle-chevron-left text-xs"></i>
        ) : (
          <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
        )}
        <span>{isPreviewMode ? 'Back to Designer' : 'Generate Preview'}</span>
      </button>
    </div>
  );
};

export default Topbar;