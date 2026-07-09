import React, { useState, useEffect, useRef } from 'react';

const Topbar = ({ 
  onFileUpload,
  onAddComponent,
  onGeneratePreview,
  onExitPreview,
  onDownloadHtml,
  onDownloadPdf, 
  onDownloadXlsx, 
  onDownloadDocx,
  isGenerating,
  isPreviewMode,
  componentsCount,
  currentTheme,
  onThemeChange,
  onSaveTemplate,
  templateName,
  onTemplateNameChange,
  hasProject,
  projectName,
  templates = [],
  onLoadTemplate,
  onNewTemplate,
  onBackToProjects,
  currentTemplateId
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const templateDropdownRef = useRef(null);

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

  // Auto-collapse menus on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target)) {
        setIsTemplateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-50 select-none">
      
      {/* Left Section - Branding & Navigation */}
      <div className="flex items-center gap-6 cursor-default">
        <div className="flex items-center gap-2 group">
          <i className="fa-solid fa-square-poll-vertical text-slate-700 text-sm transition-transform duration-300 group-hover:scale-105"></i>
          <div className="flex items-center font-sans tracking-tight">
            <span className="text-[13px] font-bold text-slate-900">Report</span>
            <span className="text-[13px] font-normal text-slate-500 ml-1">Designer</span>
          </div>
        </div>

        {/* Back Button */}
        {hasProject && (
          <button
            onClick={onBackToProjects}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i>
            <span>Back</span>
          </button>
        )}

        {/* Project Name */}
        {hasProject && projectName && (
          <div className="flex items-center gap-2">
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-indigo-600">{projectName}</span>
          </div>
        )}

        {/* Theme Selector */}
        {!isPreviewMode && (
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40 shadow-inner items-center">
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

      {/* Center Tool Area */}
      {!isPreviewMode ? (
        <div className="flex items-center gap-2 bg-slate-200/40 p-1.5 rounded-2xl border border-slate-300/20 backdrop-blur-xs">
          {/* Upload CSV */}
          <label className="cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl shadow-3xs hover:bg-slate-50 text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200">
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

          <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

          {/* Templates Dropdown */}
          {hasProject && (
            <div className="relative" ref={templateDropdownRef}>
              <button
                onClick={() => setIsTemplateDropdownOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
              >
                <i className="fa-solid fa-folder-open text-amber-500 text-xs"></i>
                <span>Templates</span>
                <i className={`fa-solid fa-chevron-down text-[9px] text-slate-400 transition-transform duration-200 ${isTemplateDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isTemplateDropdownOpen && (
                <div className="absolute left-0 top-11 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-fade-in max-h-60 overflow-y-auto">
                  {/* New Template Option */}
                  <button
                    onClick={() => { onNewTemplate(); setIsTemplateDropdownOpen(false); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors w-full border-b border-slate-100"
                  >
                    <i className="fa-solid fa-plus-circle text-indigo-500 w-4 text-center"></i>
                    <span>New Template</span>
                  </button>

                  {templates.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-slate-400 text-center">
                      No saved templates
                    </div>
                  ) : (
                    templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => { onLoadTemplate(template); setIsTemplateDropdownOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors w-full ${
                          currentTemplateId === template.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
                        }`}
                      >
                        <i className={`fa-solid fa-file-lines ${currentTemplateId === template.id ? 'text-indigo-500' : 'text-slate-400'} w-4 text-center`}></i>
                        <span className="truncate">{template.name}</span>
                        {currentTemplateId === template.id && (
                          <span className="ml-auto text-[10px] text-indigo-500 font-bold">✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Template Name Input */}
          {hasProject && (
            <input
              type="text"
              value={templateName || ''}
              onChange={(e) => onTemplateNameChange && onTemplateNameChange(e.target.value)}
              placeholder="Template name..."
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32 transition-all duration-200"
            />
          )}

          {/* Save Template Button */}
          {hasProject && (
            <button
              onClick={onSaveTemplate}
              disabled={isGenerating || !templateName}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200 shadow-md shadow-emerald-500/20"
            >
              <i className="fa-solid fa-floppy-disk text-xs"></i>
              <span>Save</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right Section */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPreviewMode ? (
          <div className="flex items-center gap-2 animate-fade-in relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-3xs transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
            >
              <i className="fa-solid fa-arrow-down-to-line text-slate-400 text-xs"></i>
              <span>Export Report</span>
              <i className={`fa-solid fa-chevron-down text-[9px] text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-fade-in flex flex-col">
                <button
                  onClick={() => { onDownloadPdf(); setIsDropdownOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <i className="fa-solid fa-file-pdf text-red-500 w-4 text-center"></i>
                  <span>Export to PDF (.pdf)</span>
                </button>
                <button
                  onClick={() => { onDownloadDocx(); setIsDropdownOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <i className="fa-solid fa-file-word text-blue-500 w-4 text-center"></i>
                  <span>Export to Word (.doc)</span>
                </button>
                <button
                  onClick={() => { onDownloadXlsx(); setIsDropdownOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <i className="fa-solid fa-file-excel text-emerald-500 w-4 text-center"></i>
                  <span>Export Dataset (.xls)</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => { onDownloadHtml(); setIsDropdownOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <i className="fa-solid fa-code text-indigo-500 w-4 text-center"></i>
                  <span>Source Template (.html)</span>
                </button>
              </div>
            )}
            
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