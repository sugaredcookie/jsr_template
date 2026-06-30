import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';

const DesignerPage = () => {
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [components, setComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [nextId, setNextId] = useState(1);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;

  // Handle CSV Upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    setPreviewHtml(null);
    setIsPreviewMode(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          setCsvData(results.data);

          setComponents(prev => prev.map(comp =>
            comp.type === 'table'
              ? { ...comp, props: { columns: headers } }
              : comp
          ));
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  }, []);

  // Add Component Factory Function
  const addComponent = useCallback((type) => {
    const currentId = nextId;
    let props = {};

    if (type === 'text') {
      props = { 
        value: 'Double click to edit me', 
        fontSize: 16, 
        bold: false,
        align: 'left',
        color: '#1e293b',
        fontFamily: 'Arial'
      };
    } else if (type === 'table') {
      props = { columns: csvHeaders.length > 0 ? csvHeaders : ['Column 1', 'Column 2', 'Column 3'] };
    } else if (type === 'spacer') {
      props = { height: 24, variant: 'line' }; // variant: 'line' (visible divider) or 'space' (blank gap)
    } else if (type === 'page-break') {
      props = {}; // Pure marker node, structural parameters only
    }

    const newComponent = { id: currentId, type, props };

    setComponents(prev => [...prev, newComponent]);
    setNextId(prev => prev + 1);
    setSelectedComponentId(currentId);
    setPreviewHtml(null);
    setIsPreviewMode(false);
  }, [nextId, csvHeaders]);

  const updateComponent = useCallback((id, newProps) => {
    setComponents(prev => prev.map(comp =>
      comp.id === id ? { ...comp, props: { ...comp.props, ...newProps } } : comp
    ));
  }, []);

  const deleteComponent = useCallback((id) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    if (selectedComponentId === id) setSelectedComponentId(null);
    if (editingId === id) setEditingId(null);
  }, [selectedComponentId, editingId]);

  const handleTextEdit = useCallback((id, newValue) => {
    setComponents(prev => prev.map(comp =>
      comp.id === id && comp.type === 'text'
        ? { ...comp, props: { ...comp.props, value: newValue } }
        : comp
    ));
  }, []);

  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const updatedList = [...components];
    const itemToMove = updatedList[draggedIdx];
    updatedList.splice(draggedIdx, 1);
    updatedList.splice(idx, 0, itemToMove);

    setDraggedIdx(idx);
    setComponents(updatedList);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Compile Canvas Layout State array into raw production HTML blocks
  const handleGeneratePreview = useCallback(async () => {
    if (!csvData.length) {
      alert('Please upload a CSV file first.');
      return;
    }
    setIsGenerating(true);

    let compiledHtml = `<div style="padding: 40px; max-width: 800px; margin: 0 auto;">`;
    components.forEach(comp => {
      if (comp.type === 'text') {
        const styles = [
          `font-size: ${comp.props.fontSize || 16}px`,
          `font-weight: ${comp.props.bold ? 'bold' : 'normal'}`,
          `text-align: ${comp.props.align || 'left'}`,
          `color: ${comp.props.color || '#1e293b'}`,
          `font-family: ${comp.props.fontFamily || 'Arial'}, sans-serif`,
          `margin-bottom: 15px`,
          `white-space: pre-wrap`,
          `word-break: break-word`
        ].join('; ');
        compiledHtml += `<p style="${styles}">${comp.props.value}</p>`;
      } else if (comp.type === 'table') {
        compiledHtml += `<table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-family: sans-serif; font-size: 13px;"><thead><tr style="background:#f8fafc;">`;
        comp.props.columns.forEach(col => {
          compiledHtml += `<th style="border:1px solid #e2e8f0; padding:10px; text-align:left; color:#475569; font-weight:600;">${col}</th>`;
        });
        compiledHtml += `</tr></thead><tbody>`;

        csvData.slice(0, 5).forEach(row => {
          compiledHtml += `<tr>`;
          comp.props.columns.forEach(col => {
            compiledHtml += `<td style="border:1px solid #e2e8f0; padding:10px; color:#334155;">${row[col] || ''}</td>`;
          });
          compiledHtml += `</tr>`;
        });
        compiledHtml += `</tbody></table>`;
      } else if (comp.type === 'spacer') {
        if (comp.props.variant === 'line') {
          compiledHtml += `<div style="margin: ${parseInt(comp.props.height || 24) / 2}px 0; border-top: 1px solid #e2e8f0; width: 100%;"></div>`;
        } else {
          compiledHtml += `<div style="height: ${comp.props.height || 24}px; width: 100%;"></div>`;
        }
      } else if (comp.type === 'page-break') {
        compiledHtml += `<div style="page-break-before: always; height: 0; margin: 0; border: none;"></div>`;
      }
    });
    compiledHtml += `</div>`;

    setTimeout(() => {
      setPreviewHtml(compiledHtml);
      setIsPreviewMode(true);
      setIsGenerating(false);
    }, 800);
  }, [csvData, components]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans antialiased select-none">
      {/* Top Toolbar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-6 shadow-sm z-10">
        <div className="flex items-center gap-2.5 flex-shrink-0 group cursor-default">
          <i className="fa-solid fa-file-signature text-xl text-indigo-600 group-hover:rotate-6 transition-transform duration-200"></i>
          <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Report Designer
          </h1>
        </div>

        <div className="flex items-center gap-2 mx-auto">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-xs hover:bg-indigo-700 hover:shadow-md active:scale-98 text-xs font-medium transition-all duration-200 mr-2">
            <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
            <span>Upload CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          <button 
            onClick={() => addComponent('text')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-3xs transition-all text-xs font-medium"
          >
            <i className="fa-solid fa-font text-blue-500 text-xs"></i>
            <span>Text</span>
          </button>

          <button 
            onClick={() => addComponent('table')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-3xs transition-all text-xs font-medium"
          >
            <i className="fa-solid fa-table-columns text-emerald-500 text-xs"></i>
            <span>Table</span>
          </button>

          <button 
            onClick={() => addComponent('spacer')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-3xs transition-all text-xs font-medium"
          >
            <i className="fa-solid fa-arrows-left-right-to-line text-amber-500 text-xs rotate-90"></i>
            <span>Spacer / Line</span>
          </button>

          <button 
            onClick={() => addComponent('page-break')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-3xs transition-all text-xs font-medium"
          >
            <i className="fa-solid fa-scissors text-purple-500 text-xs"></i>
            <span>Page Break</span>
          </button>
        </div>

        <button
          onClick={isPreviewMode ? () => setIsPreviewMode(false) : handleGeneratePreview}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-medium shadow-xs transition-all duration-300 active:scale-98 ${
            isPreviewMode 
              ? 'bg-slate-800 hover:bg-slate-950' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 hover:shadow-sm'
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

      {isPreviewMode && previewHtml ? (
        <div className="flex-1 bg-slate-100 overflow-auto p-8 flex justify-center items-start animate-fade-in">
          <div className="w-full max-w-3xl border border-slate-200/60 bg-white shadow-xl p-12 rounded-2xl transition-transform duration-300">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h2 className="uppercase text-[10px] tracking-wider text-slate-400 font-bold mb-2.5 flex items-center gap-1.5">
                <i className="fa-solid fa-file-csv text-slate-400"></i> Active Document
              </h2>
              {csvFileName ? (
                <div className="text-xs font-medium text-emerald-700 truncate bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 animate-slide-in">
                  <i className="fa-solid fa-circle-check text-emerald-500 text-xs"></i>
                  <span className="truncate">{csvFileName}</span>
                </div>
              ) : (
                <div className="text-slate-400 text-[11px] py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <i className="fa-solid fa-inbox block text-md mb-1 opacity-60"></i>
                  No active spreadsheet loaded
                </div>
              )}
            </div>

            <div className="p-4 border-b border-slate-100 flex-1 overflow-auto">
              <h2 className="uppercase text-[10px] tracking-wider text-slate-400 font-bold mb-2.5 flex items-center gap-1.5">
                <i className="fa-solid fa-database text-slate-400"></i> Parser Tokens
              </h2>
              {csvHeaders.length > 0 ? (
                <div className="text-sm space-y-1.5 pb-4">
                  {csvHeaders.map((h, i) => (
                    <div key={i} className="px-3 py-2 bg-slate-50/80 rounded-xl text-slate-600 border border-slate-100 text-xs font-mono flex items-center gap-2 shadow-3xs hover:bg-slate-100 transition-colors">
                      <i className="fa-solid fa-cube text-slate-300 text-[10px]"></i>
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-[11px] py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  Upload CSV payload to fetch variables
                </div>
              )}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-8 flex items-start justify-center overflow-auto bg-slate-50/40">
            <div className="bg-white w-full max-w-2xl min-h-[720px] shadow-xs border border-slate-200/80 rounded-2xl p-8 transition-all duration-300">
              {components.length === 0 ? (
                <div className="h-[520px] flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30 p-6">
                  <div className="w-12 h-12 bg-slate-100 border border-slate-200/60 rounded-xl flex items-center justify-center mb-3 shadow-3xs">
                    <i className="fa-solid fa-cubes text-slate-400"></i>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Canvas Is Isolated</p>
                  <p className="text-[11px] mt-1 text-slate-400 max-w-xs">Append components from the top bar to design your document schema layout blueprints.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {components.map((comp, index) => {
                    const isSelected = selectedComponentId === comp.id;
                    const isEditing = editingId === comp.id;

                    return (
                      <div
                        key={comp.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedComponentId(comp.id);
                        }}
                        className={`group relative p-4 pl-10 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50/5 shadow-xs ring-4 ring-indigo-500/5' 
                            : 'border-slate-100 hover:border-slate-200 hover:shadow-3xs bg-white'
                        } ${draggedIdx === index ? 'opacity-20 scale-98 duration-100' : 'opacity-100'}`}
                      >
                        {/* Drag Handle Handle */}
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing p-1 transition-colors">
                          <i className="fa-solid fa-grip-vertical text-xs"></i>
                        </div>

                        {/* Top Module Badge Tracker */}
                        <div className="absolute top-2 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          <span className="bg-slate-800 text-white text-[8px] font-bold tracking-wide px-1.5 py-0.5 rounded-md shadow-3xs uppercase">
                            {comp.type}
                          </span>
                        </div>

                        {/* Node Render Engine Switches */}
                        <div className="pointer-events-auto">
                          {comp.type === 'text' && (
                            <div onDoubleClick={() => setEditingId(comp.id)}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={comp.props.value}
                                  onChange={(e) => handleTextEdit(comp.id, e.target.value)}
                                  onBlur={() => setEditingId(null)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingId(null); }}
                                  className="w-full border border-indigo-400 rounded-lg px-2.5 py-1.5 shadow-2xs outline-none text-slate-900 bg-white font-normal text-xs"
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  style={{ 
                                    fontSize: `${comp.props.fontSize || 16}px`, 
                                    fontWeight: comp.props.bold ? 'bold' : 'normal',
                                    textAlign: comp.props.align || 'left',
                                    color: comp.props.color || '#1e293b',
                                    fontFamily: comp.props.fontFamily ? `${comp.props.fontFamily}, sans-serif` : 'Arial, sans-serif'
                                  }}
                                  className="break-words min-h-[22px]"
                                >
                                  {comp.props.value || <span className="text-slate-300 italic font-light">Empty text string node</span>}
                                </div>
                              )}
                            </div>
                          )}

                          {comp.type === 'table' && (
                            <div className="overflow-x-auto pointer-events-none select-none rounded-lg border border-slate-200 shadow-3xs bg-white">
                              <table className="w-full text-[11px] text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50/60 border-b border-slate-200">
                                    {comp.props.columns.map((col, idx) => (
                                      <th key={idx} className="p-2 font-medium text-slate-600 font-mono text-[10px]">
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {[1, 2].map((rowIdx) => (
                                    <tr key={rowIdx} className="border-b border-slate-100 last:border-none odd:bg-white even:bg-slate-50/10">
                                      {comp.props.columns.map((col, idx) => (
                                        <td key={idx} className="p-2 text-slate-400 font-mono italic">
                                          {csvData.length > 0 ? csvData[rowIdx - 1]?.[col] || `—` : `{{${col}}}`}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {comp.type === 'spacer' && (
                            <div className="py-2 pointer-events-none select-none">
                              {comp.props.variant === 'line' ? (
                                <div className="flex items-center" style={{ height: `${comp.props.height || 24}px` }}>
                                  <div className="w-full border-t border-slate-200 border-dashed"></div>
                                </div>
                              ) : (
                                <div 
                                  style={{ height: `${comp.props.height || 24}px` }} 
                                  className="w-full bg-slate-50/60 rounded border border-slate-100 border-dashed flex items-center justify-center text-[10px] text-slate-400 font-mono"
                                >
                                  Blank Space ({comp.props.height}px)
                                </div>
                              )}
                            </div>
                          )}

                          {comp.type === 'page-break' && (
                            <div className="py-1 pointer-events-none select-none border-2 border-dashed border-purple-100 bg-purple-50/30 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-purple-600 font-semibold tracking-wide">
                              <i className="fa-solid fa-scissors text-purple-400"></i>
                              <span>jsreport PDF Page Break (Forces next block onto new sheet)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Properties Sidebar */}
          <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-auto shadow-xs">
            <h3 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
              <i className="fa-solid fa-sliders text-slate-400 text-xs"></i> Property Controller
            </h3>
            {selectedComponent ? (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Node Type</label>
                  <p className="font-semibold text-[11px] capitalize bg-slate-50 border border-slate-200/60 text-slate-700 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-3xs">
                    {selectedComponent.type === 'text' && <i className="fa-solid fa-font text-blue-500"></i>}
                    {selectedComponent.type === 'table' && <i className="fa-solid fa-table text-emerald-500"></i>}
                    {selectedComponent.type === 'spacer' && <i className="fa-solid fa-arrows-left-right-to-line text-amber-500 rotate-90"></i>}
                    {selectedComponent.type === 'page-break' && <i className="fa-solid fa-scissors text-purple-500"></i>}
                    {selectedComponent.type === 'page-break' ? 'Page Break' : selectedComponent.type}
                  </p>
                </div>

                {selectedComponent.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Edit Text Content</label>
                      <textarea
                        value={selectedComponent.props.value}
                        onChange={(e) => handleTextEdit(selectedComponent.id, e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-slate-50/30 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none h-20 resize-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Family</label>
                      <select
                        value={selectedComponent.props.fontFamily || 'Arial'}
                        onChange={(e) => updateComponent(selectedComponent.id, { fontFamily: e.target.value })}
                        className="w-full text-xs border border-slate-200 bg-slate-50 rounded-xl p-2.5 outline-none font-medium text-slate-700"
                      >
                        <option value="Arial">Arial (Sans-Serif)</option>
                        <option value="Helvetica">Helvetica (Modern)</option>
                        <option value="Times New Roman">Times New Roman (Elegant Serif)</option>
                        <option value="Courier New">Courier New (Monospace)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Text Alignment</label>
                      <div className="grid grid-cols-4 gap-1 bg-slate-50 border p-1 rounded-xl">
                        {[
                          { key: 'left', icon: 'fa-align-left' },
                          { key: 'center', icon: 'fa-align-center' },
                          { key: 'right', icon: 'fa-align-right' },
                          { key: 'justify', icon: 'fa-align-justify' }
                        ].map((btn) => {
                          const isActive = (selectedComponent.props.align || 'left') === btn.key;
                          return (
                            <button
                              key={btn.key}
                              type="button"
                              onClick={() => updateComponent(selectedComponent.id, { align: btn.key })}
                              className={`py-1.5 rounded-lg text-xs transition-all ${
                                isActive ? 'bg-white text-indigo-600 shadow-3xs font-bold border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <i className={`fa-solid ${btn.icon}`}></i>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Color</label>
                      <div className="flex items-center gap-2 border border-slate-200 bg-slate-50/30 rounded-xl p-1.5 pl-3">
                        <input
                          type="color"
                          value={selectedComponent.props.color || '#1e293b'}
                          onChange={(e) => updateComponent(selectedComponent.id, { color: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer overflow-hidden bg-transparent"
                        />
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{selectedComponent.props.color || '#1E293B'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Scale (px)</label>
                      <input
                        type="number"
                        value={selectedComponent.props.fontSize || 16}
                        onChange={(e) => updateComponent(selectedComponent.id, { fontSize: parseInt(e.target.value) || 12 })}
                        className="w-full text-xs border border-slate-200 bg-slate-50/30 rounded-xl p-2 outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedComponent.props.bold || false}
                        onChange={(e) => updateComponent(selectedComponent.id, { bold: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">Apply Bold Weight</span>
                    </label>
                  </>
                )}

                {selectedComponent.type === 'table' && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Output Fields</label>
                    <p className="text-[10px] text-slate-400 mb-2.5">Click parameters below to dynamically switch columns bound to the layout processor.</p>
                    <div className="max-h-72 overflow-y-auto space-y-1.5 bg-slate-50/50 p-2 rounded-xl border border-slate-200/80 shadow-3xs">
                      {csvHeaders.length > 0 ? (
                        csvHeaders.map((col, i) => {
                          const isIncluded = selectedComponent.props.columns.includes(col);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                let updatedCols;
                                if (isIncluded) {
                                  updatedCols = selectedComponent.props.columns.filter(c => c !== col);
                                  if (updatedCols.length === 0) updatedCols = [col];
                                } else {
                                  updatedCols = csvHeaders.filter(h => selectedComponent.props.columns.includes(h) || h === col);
                                }
                                updateComponent(selectedComponent.id, { columns: updatedCols });
                              }}
                              className={`w-full text-left text-xs font-mono py-2 px-2.5 rounded-lg border shadow-3xs transition-all flex items-center justify-between group/btn ${
                                isIncluded ? 'bg-indigo-600 border-indigo-600 text-white font-medium transform translate-x-0.5' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <span className="truncate pr-2">{col}</span>
                              <span className="text-[10px] flex-shrink-0">
                                {isIncluded ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-solid fa-circle-plus opacity-40 group-hover/btn:opacity-100"></i>}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-400 p-4 text-center italic">No input attributes registered.</div>
                      )}
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'spacer' && (
                  <>
                    {/* Spacer Output Format Selector */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Spacer Variant</label>
                      <div className="grid grid-cols-2 gap-1 bg-slate-50 border p-1 rounded-xl">
                        {[
                          { key: 'line', label: 'Solid Line' },
                          { key: 'space', label: 'Blank Space' }
                        ].map((v) => {
                          const isActive = (selectedComponent.props.variant || 'line') === v.key;
                          return (
                            <button
                              key={v.key}
                              type="button"
                              onClick={() => updateComponent(selectedComponent.id, { variant: v.key })}
                              className={`py-1.5 text-xs rounded-lg font-medium transition-all ${
                                isActive ? 'bg-white text-indigo-600 shadow-3xs border border-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Height Value Configurator */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gap Height (px)</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={selectedComponent.props.height || 24}
                        onChange={(e) => updateComponent(selectedComponent.id, { height: parseInt(e.target.value) || 10 })}
                        className="w-full text-xs border border-slate-200 bg-slate-50/30 rounded-xl p-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </>
                )}

                {selectedComponent.type === 'page-break' && (
                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-purple-900 text-xs leading-relaxed">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-info"></i> No Configurations Needed
                    </p>
                    This is an absolute structural break node. It injects a hard page delimiter into the dynamic rendering sequence pipeline.
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => deleteComponent(selectedComponent.id)}
                    className="w-full py-2 bg-red-50/50 text-red-600 hover:bg-red-100/80 rounded-xl text-xs font-semibold border border-red-200/30 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-3xs"
                  >
                    <i className="fa-solid fa-trash-can text-[11px]"></i> Delete Component
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-16 border border-dashed rounded-xl bg-slate-50/50 p-4">
                <i className="fa-solid fa-hand-pointer text-md block mb-1.5 text-slate-300 animate-pulse"></i>
                <p className="text-[11px] font-medium text-slate-500">No Segment Active</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Select a layout node on your canvas panel to tune design parameters.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerPage;