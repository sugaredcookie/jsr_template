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

  const addComponent = useCallback((type) => {
    const currentId = nextId;
    const newComponent = {
      id: currentId,
      type: type,
      props: type === 'text'
        ? { value: 'Double click to edit me', fontSize: 16, bold: false }
        : { columns: csvHeaders.length > 0 ? csvHeaders : ['Column 1', 'Column 2', 'Column 3'] }
    };

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

  const handleGeneratePreview = useCallback(async () => {
    if (!csvData.length) {
      alert('Please upload a CSV file first.');
      return;
    }
    setIsGenerating(true);

    let compiledHtml = `<div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">`;
    components.forEach(comp => {
      if (comp.type === 'text') {
        compiledHtml += `<p style="font-size: ${comp.props.fontSize}px; font-weight: ${comp.props.bold ? 'bold' : 'normal'}; margin-bottom: 15px;">${comp.props.value}</p>`;
      } else if (comp.type === 'table') {
        compiledHtml += `<table style="width:100%; border-collapse:collapse; margin-bottom:20px;"><thead><tr style="background:#f3f4f6;">`;
        comp.props.columns.forEach(col => {
          compiledHtml += `<th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">${col}</th>`;
        });
        compiledHtml += `</tr></thead><tbody>`;

        csvData.slice(0, 5).forEach(row => {
          compiledHtml += `<tr>`;
          comp.props.columns.forEach(col => {
            compiledHtml += `<td style="border:1px solid #e5e7eb; padding:8px;">${row[col] || ''}</td>`;
          });
          compiledHtml += `</tr>`;
        });
        compiledHtml += `</tbody></table>`;
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

        <div className="flex items-center gap-3 mx-auto">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-xs hover:bg-indigo-700 hover:shadow-md active:scale-98 text-xs font-medium transition-all duration-200">
            <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
            <span>Upload CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          <button 
            onClick={() => addComponent('text')} 
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-3xs active:scale-98 transition-all duration-200 text-xs font-medium"
          >
            <i className="fa-solid fa-font text-blue-500 text-xs"></i>
            <span>Add Text</span>
          </button>

          <button 
            onClick={() => addComponent('table')} 
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-3xs active:scale-98 transition-all duration-200 text-xs font-medium"
          >
            <i className="fa-solid fa-table-columns text-emerald-500 text-xs"></i>
            <span>Add Table</span>
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
                  <p className="text-[11px] mt-1 text-slate-400 max-w-xs">Append text formatting strings or spreadsheet grids from the header context to configure compile logic blueprints.</p>
                </div>
              ) : (
                <div className="space-y-4">
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
                            : 'border-slate-100 hover:border-slate-300 hover:shadow-3xs bg-white'
                        } ${draggedIdx === index ? 'opacity-20 scale-98 duration-100' : 'opacity-100'}`}
                      >
                        {/* Drag Handle */}
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing p-1 transition-colors">
                          <i className="fa-solid fa-grip-vertical text-xs"></i>
                        </div>

                        {/* Module Badge Indicator */}
                        <div className="absolute top-2 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <span className="bg-slate-800 text-white text-[9px] font-medium tracking-wide px-1.5 py-0.5 rounded-md shadow-3xs">
                            {comp.type === 'text' ? 'TEXT BLOCK' : 'DATA TABLE'}
                          </span>
                        </div>

                        {/* Renderer Blocks */}
                        <div className="pointer-events-auto">
                          {comp.type === 'text' ? (
                            <div onDoubleClick={() => setEditingId(comp.id)}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={comp.props.value}
                                  onChange={(e) => handleTextEdit(comp.id, e.target.value)}
                                  onBlur={() => setEditingId(null)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingId(null); }}
                                  className="w-full border border-indigo-400 rounded-lg px-2.5 py-1.5 shadow-2xs outline-none text-slate-900 bg-white font-normal text-xs animate-fade-in"
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  style={{ fontSize: `${comp.props.fontSize || 16}px`, fontWeight: comp.props.bold ? 'bold' : 'normal' }}
                                  className="text-slate-800 break-words min-h-[22px]"
                                >
                                  {comp.props.value || <span className="text-slate-300 italic font-light">Empty layout string token</span>}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Structural Table Elements Container */
                            <div className="overflow-x-auto pointer-events-none select-none rounded-lg border border-slate-200 mt-0.5 shadow-3xs bg-white">
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
                    {selectedComponent.type === 'text' ? <i className="fa-solid fa-font text-blue-500"></i> : <i className="fa-solid fa-table text-emerald-500"></i>}
                    {selectedComponent.type}
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
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Scale (px)</label>
                      <input
                        type="number"
                        value={selectedComponent.props.fontSize || 16}
                        onChange={(e) => updateComponent(selectedComponent.id, { fontSize: parseInt(e.target.value) || 12 })}
                        className="w-full text-xs border border-slate-200 bg-slate-50/30 rounded-xl p-2 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                      <input
                        type="checkbox"
                        id="bold-check"
                        checked={selectedComponent.props.bold || false}
                        onChange={(e) => updateComponent(selectedComponent.id, { bold: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500/10 border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700 cursor-pointer">Apply Bold Weight</span>
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
                                  updatedCols = csvHeaders.filter(h =>
                                    selectedComponent.props.columns.includes(h) || h === col
                                  );
                                }
                                updateComponent(selectedComponent.id, { columns: updatedCols });
                              }}
                              className={`w-full text-left text-xs font-mono py-2 px-2.5 rounded-lg border shadow-3xs transition-all flex items-center justify-between group/btn ${
                                isIncluded
                                  ? 'bg-indigo-600 border-indigo-600 text-white font-medium transform translate-x-0.5'
                                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <span className="truncate pr-2">{col}</span>
                              <span className="text-[10px] flex-shrink-0">
                                {isIncluded ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-solid fa-circle-plus opacity-40 group-hover/btn:opacity-100 transition-opacity"></i>}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-400 p-4 text-center italic">
                          No input attributes registered.
                        </div>
                      )}
                    </div>
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