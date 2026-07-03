import React from 'react';

const Topbar = ({ 
  onFileUpload,
  onAddComponent,
  onGeneratePreview,
  onExitPreview,
  onDownloadHtml,
  isGenerating,
  isPreviewMode,
  componentsCount,
  currentTheme,
  onThemeChange
}) => {

  const componentButtons = [
    { type: 'text', label: 'Text', icon: 'fa-font', color: 'text-blue-500' },
    { type: 'table', label: 'Table', icon: 'fa-table-columns', color: 'text-emerald-500' },
    { type: 'grid-row', label: 'Infographic Grid', icon: 'fa-chart-pie', color: 'text-violet-500' },
    { type: 'chart', label: 'Analytics Chart', icon: 'fa-chart-simple', color: 'text-indigo-500' },
    { type: 'spacer', label: 'Spacer', icon: 'fa-arrows-left-right-to-line', color: 'text-amber-500' },
    { type: 'page-break', label: 'Page Break', icon: 'fa-scissors', color: 'text-rose-500' }
  ];

  const themes = [
    { id: 'silicon', label: 'Minimalist', icon: 'fa-square' },
    { id: 'corporate', label: 'Corporate', icon: 'fa-building-columns' },
    { id: 'editorial', label: 'Editorial', icon: 'fa-signature' }
  ];

  return (
    <div className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-50 select-none">
      
      {/* Silicon Minimalist Branding & Theme Control Selection Group */}
      <div className="flex items-center gap-6 cursor-default">
        <div className="flex items-center gap-2 group">
          <i className="fa-solid fa-square-poll-vertical text-slate-700 text-sm transition-transform duration-300 group-hover:scale-105"></i>
          <div className="flex items-center font-sans tracking-tight">
            <span className="text-[13px] font-bold text-slate-900">Report</span>
            <span className="text-[13px] font-normal text-slate-500 ml-1">Designer</span>
          </div>
        </div>

        {/* Global Pipeline Theme Selector Controller Switch */}
        {!isPreviewMode && (
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40 shadow-inner items-center animate-fade-in">
            {themes.map((t) => {
              const isActive = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-white text-slate-900 shadow-3xs border border-slate-200/60 font-extrabold' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <i className={`fa-solid ${t.icon} text-[9px] ${isActive ? 'text-indigo-500' : 'opacity-60'}`}></i>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Center Tool Area: Conditionally hide when preview mode is active */}
      {!isPreviewMode ? (
        <div className="flex items-center gap-2 bg-slate-200/40 p-1.5 rounded-2xl border border-slate-300/20 backdrop-blur-xs animate-fade-in">
          {/* Upload CSV */}
          <label className="cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl shadow-3xs hover:bg-slate-50 text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200">
            <i className="fa-solid fa-cloud-arrow-up text-indigo-500 text-xs"></i>
            <span>Upload CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={onFileUpload} />
          </label>

          <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

          {/* Component Grid Blocks */}
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
      ) : (
        /* Empty center placeholder channel to preserve clean symmetric margins */
        <div className="flex-1" />
      )}

      {/* Far Right Action Zone */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPreviewMode ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <button
              onClick={onDownloadHtml}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-3xs transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
            >
              <i className="fa-solid fa-arrow-down-to-line text-slate-400 text-xs"></i>
              <span>Download Report</span>
            </button>
            
            <button
              onClick={onExitPreview}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200 shadow-md shadow-slate-950/10"
            >
              <i className="fa-solid fa-arrow-left-long text-xs opacity-80"></i>
              <span>Back to Canvas</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onGeneratePreview}
            disabled={isGenerating || componentsCount === 0}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:opacity-95 shadow-md shadow-indigo-600/10 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isGenerating ? (
              <i className="fa-solid fa-circle-notch animate-spin text-xs"></i>
            ) : (
              <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
            )}
            <span>Generate Preview</span>
          </button>
        )}
      </div>
      
    </div>
  );
};

export default Topbar;