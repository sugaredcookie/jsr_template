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

  // Helper calculation engine function to parse aggregations safely
  const calculateMetric = useCallback((column, operation) => {
    if (!csvData || csvData.length === 0 || !column) return 0;
    
    if (operation === 'COUNT') {
      return csvData.length;
    }

    const numericalValues = csvData
      .map(row => parseFloat(String(row[column] || '').replace(/[^0-9.-]/g, '')))
      .filter(val => !isNaN(val));

    if (numericalValues.length === 0) return 0;

    if (operation === 'SUM') {
      return numericalValues.reduce((acc, curr) => acc + curr, 0);
    }
    if (operation === 'AVG') {
      const total = numericalValues.reduce((acc, curr) => acc + curr, 0);
      return (total / numericalValues.length).toFixed(2);
    }
    return 0;
  }, [csvData]);

  // Secondary clean evaluation wrapper
  const evaluateMetricValue = (comp) => {
    if (!csvData.length || !comp.props.column) return '—';
    const targetColumn = comp.props.column;
    const operation = comp.props.operation || 'COUNT';

    if (operation === 'COUNT') return csvData.length.toLocaleString();

    const values = csvData
      .map(row => parseFloat(String(row[targetColumn] || '').replace(/[^0-9.-]/g, '')))
      .filter(v => !isNaN(v));

    if (values.length === 0) return '0';

    const total = values.reduce((sum, val) => sum + val, 0);
    if (operation === 'SUM') {
      return total.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (operation === 'AVG') {
      return (total / values.length).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return 0;
  };

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

          setComponents(prev => prev.map(comp => {
            if (comp.type === 'table') {
              return { ...comp, props: { ...comp.props, columns: headers, columnMetadata: {} } };
            }
            if (comp.type === 'metric-card' && !comp.props.column) {
              return { ...comp, props: { ...comp.props, column: headers[0] } };
            }
            return comp;
          }));
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
      props = { columns: csvHeaders.length > 0 ? csvHeaders : ['Column 1', 'Column 2', 'Column 3'], columnMetadata: {} };
    } else if (type === 'spacer') {
      props = { height: 24, variant: 'line' };
    } else if (type === 'page-break') {
      props = {};
    } else if (type === 'metric-card') {
      props = {
        title: 'Summary Metric Card',
        column: csvHeaders.length > 0 ? csvHeaders[0] : '',
        operation: 'COUNT'
      };
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

    let compiledHtml = `<div style="padding: 40px; width: 100%; margin: 0 auto; background: #ffffff; color: #1e293b; text-align: left;">`;
    
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
        compiledHtml += `<div style="width: 100%; overflow-x: auto; margin-bottom: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">`;
        compiledHtml += `<table style="width:100%; border-collapse:collapse; font-family: sans-serif; font-size: 13px; table-layout: fixed;"><thead><tr style="background:#f8fafc; border-bottom: 2px solid #e2e8f0;">`;
        
        comp.props.columns.forEach(col => {
          const meta = comp.props.columnMetadata?.[col] || { label: col, align: 'left', width: '' };
          compiledHtml += `<th style="border-right:1px solid #e2e8f0; padding:12px 10px; text-align:${meta.align}; color:#475569; font-weight:600; width:${meta.width}%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${meta.label || col}</th>`;
        });
        
        compiledHtml += `</tr></thead><tbody>`;

        csvData.slice(0, 5).forEach(row => {
          compiledHtml += `<tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">`;
          comp.props.columns.forEach(col => {
            const meta = comp.props.columnMetadata?.[col] || { align: 'left' };
            compiledHtml += `<td style="border-right:1px solid #e2e8f0; padding:12px 10px; color:#334155; text-align:${meta.align}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row[col] || ''}</td>`;
          });
          compiledHtml += `</tr>`;
        });
        compiledHtml += `</tbody></table></div>`;
      } else if (comp.type === 'spacer') {
        if (comp.props.variant === 'line') {
          compiledHtml += `<div style="margin: ${parseInt(comp.props.height || 24) / 2}px 0; border-top: 1px solid #e2e8f0; width: 100%;"></div>`;
        } else {
          compiledHtml += `<div style="height: ${comp.props.height || 24}px; width: 100%;"></div>`;
        }
      } else if (comp.type === 'page-break') {
        compiledHtml += `<div style="page-break-before: always; height: 0; margin: 0; border: none;"></div>`;
      } else if (comp.type === 'metric-card') {
        const metricVal = evaluateMetricValue(comp);
        compiledHtml += `
          <div style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px; font-family: sans-serif; display: inline-block; min-width: 200px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">${comp.props.title || 'Metric'}</div>
            <div style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 4px;">${metricVal}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px; font-family: monospace;">${comp.props.operation}(${comp.props.column || 'all'})</div>
          </div>
        `;
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 font-sans antialiased select-none text-slate-800">
      
      {/* Glassmorphic Top Toolbar */}
      <div className="h-16 glass-toolbar border-b border-white/60 flex items-center px-6 gap-6 shadow-xs sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2.5 flex-shrink-0 group cursor-default transition-all duration-300 hover:opacity-90">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
            <i className="fa-solid fa-file-signature text-sm text-white"></i>
          </div>
          <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Report Designer
          </h1>
        </div>

        {/* Toolbar Action Core Button Grid */}
        <div className="flex items-center gap-2.5 mx-auto bg-slate-200/50 p-1.5 rounded-2xl border border-slate-300/30 backdrop-blur-xs">
          <label className="cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-3xs hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200">
            <i className="fa-solid fa-cloud-arrow-up text-indigo-500 text-xs"></i>
            <span>Upload CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>

          <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

          <button 
            onClick={() => addComponent('text')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-font text-blue-500 text-xs"></i>
            <span>Text</span>
          </button>

          <button 
            onClick={() => addComponent('table')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-table-columns text-emerald-500 text-xs"></i>
            <span>Table</span>
          </button>

          <button 
            onClick={() => addComponent('metric-card')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-chart-pie text-violet-500 text-xs"></i>
            <span>Metric Card</span>
          </button>

          <button 
            onClick={() => addComponent('spacer')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-arrows-left-right-to-line text-amber-500 rotate-90 text-xs"></i>
            <span>Spacer</span>
          </button>

          <button 
            onClick={() => addComponent('page-break')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-scissors text-rose-500 text-xs"></i>
            <span>Page Break</span>
          </button>
        </div>

        <button
          onClick={isPreviewMode ? () => setIsPreviewMode(false) : handleGeneratePreview}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 ${
            isPreviewMode ? 'bg-slate-800 hover:bg-slate-950 shadow-md' : 'btn-gradient-indigo'
          }`}
        >
          {isGenerating ? <i className="fa-solid fa-circle-notch animate-spin text-xs"></i> : isPreviewMode ? <i className="fa-solid fa-circle-chevron-left text-xs"></i> : <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>}
          <span>{isPreviewMode ? 'Back to Designer' : 'Generate Preview'}</span>
        </button>
      </div>

      {/* Primary Workspace Windows Layout Splitter */}
      {isPreviewMode && previewHtml ? (
        <div className="flex-1 bg-slate-900/5 overflow-auto p-10 flex justify-center items-start animate-fade-in">
          <div className="w-full max-w-5xl border border-slate-200/60 bg-white shadow-xl rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          
          {/* Glassmorphic Left Sidebar */}
          <div className="w-72 glass-sidebar border-r border-slate-200/80 flex flex-col shadow-3xs">
            <div className="p-4 border-b border-slate-100 bg-white/40">
              <h2 className="uppercase text-[9px] tracking-wider text-slate-400 font-bold mb-2.5 flex items-center gap-1.5">
                <i className="fa-solid fa-file-csv opacity-70"></i> Active Document
              </h2>
              {csvFileName ? (
                <div className="text-xs font-medium text-emerald-700 truncate bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 animate-slide-in shadow-3xs">
                  <i className="fa-solid fa-circle-check text-emerald-500 text-xs animate-pulse"></i>
                  <span className="truncate font-medium">{csvFileName}</span>
                </div>
              ) : (
                <div className="text-slate-400 text-[11px] py-4 text-center border border-dashed border-slate-200 bg-white/50 rounded-xl">
                  <i className="fa-solid fa-inbox block text-md mb-1 opacity-50 animate-bounce"></i>
                  No CSV spreadsheet loaded
                </div>
              )}
            </div>

            <div className="p-4 border-b border-slate-100 flex-1 overflow-auto bg-white/20">
              <h2 className="uppercase text-[9px] tracking-wider text-slate-400 font-bold mb-2.5 flex items-center gap-1.5">
                <i className="fa-solid fa-database opacity-70"></i> Parser Tokens
              </h2>
              {csvHeaders.length > 0 ? (
                <div className="text-sm space-y-1.5 pb-4">
                  {csvHeaders.map((h, i) => (
                    <div key={i} className="px-3 py-2 bg-white/80 hover:bg-white rounded-xl text-slate-600 border border-slate-200/50 text-xs font-mono flex items-center gap-2 shadow-4xs hover:shadow-3xs hover:scale-101 transition-all cursor-default duration-150">
                      <i className="fa-solid fa-tag text-indigo-400 text-[10px]"></i>
                      <span className="truncate font-medium">{h}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-[11px] py-8 text-center border border-dashed border-slate-200 bg-white/50 rounded-xl">
                  Upload dataset to fetch layout variables
                </div>
              )}
            </div>
          </div>

          {/* Interactive Core Designer Workspace Canvas Panel */}
          <div className="flex-1 p-8 flex items-start justify-center overflow-auto bg-slate-900/[0.01]">
            <div className="bg-white/80 w-full max-w-4xl min-h-[750px] shadow-sm border border-slate-200/80 backdrop-blur-md rounded-3xl p-8 overflow-hidden transition-all duration-300">
              {components.length === 0 ? (
                <div className="h-[550px] flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-200/80 rounded-2xl bg-white/40 p-6 animate-fade-in">
                  <div className="w-12 h-12 bg-gradient-to-tr from-slate-50 to-slate-100 border border-slate-200/80 rounded-xl flex items-center justify-center mb-3 shadow-3xs transform group-hover:scale-105 transition-all">
                    <i className="fa-solid fa-cubes text-slate-400 text-md"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-700">Canvas Blueprint Isolated</p>
                  <p className="text-[11px] mt-1 text-slate-400 max-w-xs">Append workspace modules from the header toolbar grid map to begin layouts formatting configurations.</p>
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
                        className={`group relative p-4 pl-11 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50/10 shadow-xs ring-4 ring-indigo-500/5 scale-[1.005]' 
                            : 'border-slate-100 hover:border-slate-300/80 hover:shadow-3xs bg-white/70 hover:bg-white'
                        } ${draggedIdx === index ? 'opacity-20 scale-95 duration-100' : 'opacity-100'}`}
                      >
                        {/* Grab Reorder Handle */}
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-400/80 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100 active:scale-95 transition-all">
                          <i className="fa-solid fa-grip-vertical text-xs"></i>
                        </div>

                        {/* Hover contextual labels */}
                        <div className="absolute top-2 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          <span className="bg-slate-800 text-white text-[8px] font-bold tracking-wide px-2 py-0.5 rounded-md shadow-3xs uppercase">
                            {comp.type === 'metric-card' ? 'Summary Metric' : comp.type}
                          </span>
                        </div>

                        {/* Unified Canvas Presentation Layer Node Blocks */}
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
                                  className="w-full border-2 border-indigo-400 rounded-xl px-3 py-1.5 shadow-3xs outline-none text-slate-900 bg-white font-medium text-xs animate-fade-in"
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
                                  className="break-words min-h-[22px] transition-all"
                                >
                                  {comp.props.value || <span className="text-slate-300 italic font-light">Empty context field value</span>}
                                </div>
                              )}
                            </div>
                          )}

                          {comp.type === 'table' && (
                            <div className="overflow-x-auto pointer-events-none select-none rounded-xl border border-slate-200/80 shadow-3xs bg-white/50">
                              <table className="w-full text-[11px] text-left border-collapse min-w-[600px] table-layout-fixed">
                                <thead>
                                  <tr className="bg-slate-50/80 border-b border-slate-200">
                                    {comp.props.columns.map((col, idx) => {
                                      const meta = comp.props.columnMetadata?.[col] || { label: col, align: 'left', width: '' };
                                      return (
                                        <th key={idx} style={{ textAlign: meta.align, width: meta.width ? `${meta.width}%` : 'auto' }} className="p-2.5 font-semibold text-slate-600 font-mono text-[10px] overflow-hidden text-ellipsis whitespace-nowrap bg-slate-100/40">
                                          {meta.label || col}
                                        </th>
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {[1, 2].map((rowIdx) => (
                                    <tr key={rowIdx} className="border-b border-slate-100 last:border-none bg-white/80 odd:bg-white/40 even:bg-slate-50/20">
                                      {comp.props.columns.map((col, idx) => {
                                        const meta = comp.props.columnMetadata?.[col] || { align: 'left' };
                                        return (
                                          <td key={idx} style={{ textAlign: meta.align }} className="p-2.5 text-slate-400 font-mono italic overflow-hidden text-ellipsis whitespace-nowrap">
                                            {csvData.length > 0 ? csvData[rowIdx - 1]?.[col] || `—` : `[${col}]`}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {comp.type === 'spacer' && (
                            <div className="py-1 pointer-events-none select-none">
                              {comp.props.variant === 'line' ? (
                                <div className="flex items-center w-full" style={{ height: `${comp.props.height || 24}px` }}>
                                  <div className="w-full border-t border-slate-200 border-dashed opacity-60"></div>
                                </div>
                              ) : (
                                <div 
                                  style={{ height: `${comp.props.height || 24}px` }} 
                                  className="w-full bg-slate-50/50 rounded-xl border border-slate-100 border-dashed flex items-center justify-center text-[10px] text-slate-400 font-mono"
                                >
                                  Blank Whitespace Padding ({comp.props.height}px)
                                </div>
                              )}
                            </div>
                          )}

                          {comp.type === 'page-break' && (
                            <div className="py-0.5 pointer-events-none select-none border border-dashed border-purple-200 bg-purple-50/40 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-purple-600 font-semibold tracking-wide shadow-3xs animate-fade-in">
                              <i className="fa-solid fa-scissors text-purple-400"></i>
                              <span>jsreport Core Hard PDF Page Break Delimiter</span>
                            </div>
                          )}

                          {comp.type === 'metric-card' && (
                            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/80 rounded-2xl inline-block min-w-[220px] shadow-3xs animate-fade-in pointer-events-none select-none transform hover:scale-101 transition-all duration-200">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                {comp.props.title || 'Summary Card'}
                              </div>
                              <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                                {evaluateMetricValue(comp)}
                              </div>
                              <div className="text-[9px] font-mono text-indigo-500 font-semibold mt-1 flex items-center gap-1 bg-indigo-50/60 px-2 py-0.5 rounded-md inline-block">
                                <i className="fa-solid fa-calculator opacity-80"></i>
                                <span>{comp.props.operation}({comp.props.column || 'Null Token'})</span>
                              </div>
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

          {/* Right side properties sidebar configuration engine */}
          <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-auto shadow-xs sticky top-16 h-[calc(100vh-64px)]">
            <h3 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
              <i className="fa-solid fa-sliders text-slate-400 text-xs"></i> Property Controller
            </h3>
            {selectedComponent ? (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Node Element Type</label>
                  <p className="font-semibold text-[11px] capitalize bg-slate-50 border border-slate-200/60 text-slate-700 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-3xs">
                    {selectedComponent.type === 'text' && <i className="fa-solid fa-font text-blue-500 text-xs"></i>}
                    {selectedComponent.type === 'table' && <i className="fa-solid fa-table text-emerald-500 text-xs"></i>}
                    {selectedComponent.type === 'spacer' && <i className="fa-solid fa-arrows-left-right-to-line text-amber-500 text-xs rotate-90"></i>}
                    {selectedComponent.type === 'page-break' && <i className="fa-solid fa-scissors text-purple-500 text-xs"></i>}
                    {selectedComponent.type === 'metric-card' && <i className="fa-solid fa-chart-pie text-indigo-500 text-xs"></i>}
                    {selectedComponent.type === 'metric-card' ? 'Metric Card' : selectedComponent.type}
                  </p>
                </div>

                {selectedComponent.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Edit Text Content</label>
                      <textarea
                        value={selectedComponent.props.value}
                        onChange={(e) => handleTextEdit(selectedComponent.id, e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-slate-50/50 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none h-20 resize-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Family</label>
                      <select
                        value={selectedComponent.props.fontFamily || 'Arial'}
                        onChange={(e) => updateComponent(selectedComponent.id, { fontFamily: e.target.value })}
                        className="w-full text-xs border border-slate-200 bg-slate-50 rounded-xl p-2.5 outline-none font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                      >
                        <option value="Arial">Arial (Sans-Serif)</option>
                        <option value="Helvetica">Helvetica (Modern)</option>
                        <option value="Times New Roman">Times New Roman (Serif)</option>
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
                              className={`py-1.5 rounded-lg text-xs transition-all duration-200 ${
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
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Tint Color</label>
                      <div className="flex items-center gap-2 border border-slate-200 bg-slate-50/50 rounded-xl p-1.5 pl-3 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all">
                        <input
                          type="color"
                          value={selectedComponent.props.color || '#1e293b'}
                          onChange={(e) => updateComponent(selectedComponent.id, { color: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer overflow-hidden bg-transparent transform hover:scale-105 transition-transform"
                        />
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{selectedComponent.props.color || '#1e293b'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Scale (px)</label>
                      <input
                        type="number"
                        value={selectedComponent.props.fontSize || 16}
                        onChange={(e) => updateComponent(selectedComponent.id, { fontSize: parseInt(e.target.value) || 12 })}
                        className="w-full text-xs font-bold border border-slate-300 bg-slate-50 rounded-xl p-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-mono transition-all shadow-3xs"
                      />
                    </div>
                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedComponent.props.bold || false}
                        onChange={(e) => updateComponent(selectedComponent.id, { bold: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 bg-white shadow-3xs focus:ring-0"
                      />
                      <span className="text-xs font-medium text-slate-700">Apply Bold Weight</span>
                    </label>
                  </>
                )}

                {selectedComponent.type === 'table' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Output Fields</label>
                      <p className="text-[10px] text-slate-400 mb-2.5">Select columns to display in the generated view.</p>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/80 shadow-3xs">
                        {csvHeaders.length > 0 ? (
                          csvHeaders.map((col, i) => {
                            const isIncluded = selectedComponent.props.columns.includes(col);
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  let updatedCols;
                                  let updatedMeta = { ...(selectedComponent.props.columnMetadata || {}) };
                                  
                                  if (isIncluded) {
                                    updatedCols = selectedComponent.props.columns.filter(c => c !== col);
                                    if (updatedCols.length === 0) updatedCols = [col];
                                  } else {
                                    updatedCols = csvHeaders.filter(h => selectedComponent.props.columns.includes(h) || h === col);
                                    if (!updatedMeta[col]) {
                                      updatedMeta[col] = { label: col, align: 'left', width: Math.floor(100 / updatedCols.length) };
                                    }
                                  }
                                  updateComponent(selectedComponent.id, { columns: updatedCols, columnMetadata: updatedMeta });
                                }}
                                className={`w-full text-left text-xs font-mono py-1.5 px-2.5 rounded-lg border shadow-3xs transform active:scale-99 transition-all flex items-center justify-between group/btn ${
                                  isIncluded ? 'bg-indigo-600 border-indigo-600 text-white font-medium shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
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
                          <div className="text-xs text-slate-400 p-2 text-center italic bg-slate-100/50 rounded-lg">No CSV headers mapped.</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Column Settings</label>
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {selectedComponent.props.columns.map((col) => {
                          const currentMeta = selectedComponent.props.columnMetadata?.[col] || { label: col, align: 'left', width: 25 };
                          
                          return (
                            <div key={col} className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2 shadow-4xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-indigo-600 truncate max-w-[120px]">{col}</span>
                                <div className="flex bg-white border border-slate-200 rounded-md p-0.5 shadow-4xs">
                                  {['left', 'center', 'right'].map((alignOption) => (
                                    <button
                                      key={alignOption}
                                      type="button"
                                      onClick={() => {
                                        const updatedMeta = { ...selectedComponent.props.columnMetadata };
                                        updatedMeta[col] = { ...currentMeta, align: alignOption };
                                        updateComponent(selectedComponent.id, { columnMetadata: updatedMeta });
                                      }}
                                      className={`px-1.5 py-0.5 text-[9px] rounded transition-all ${
                                        currentMeta.align === alignOption ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      <i className={`fa-solid fa-align-${alignOption === 'right' ? 'right' : alignOption === 'center' ? 'center' : 'left'}`}></i>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <input
                                type="text"
                                value={currentMeta.label}
                                placeholder="Display Label Name"
                                onChange={(e) => {
                                  const updatedMeta = { ...selectedComponent.props.columnMetadata };
                                  updatedMeta[col] = { ...currentMeta, label: e.target.value };
                                  updateComponent(selectedComponent.id, { columnMetadata: updatedMeta });
                                }}
                                className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 outline-none text-slate-700 focus:border-indigo-400 font-semibold shadow-3xs"
                              />

                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">Width %</span>
                                <input
                                  type="number"
                                  min="5"
                                  max="100"
                                  value={currentMeta.width || ''}
                                  onChange={(e) => {
                                    const updatedMeta = { ...selectedComponent.props.columnMetadata };
                                    updatedMeta[col] = { ...currentMeta, width: parseInt(e.target.value) || 10 };
                                    updateComponent(selectedComponent.id, { columnMetadata: updatedMeta });
                                  }}
                                  className="w-full text-[10px] font-bold border border-slate-200 bg-white rounded-md p-1 outline-none text-slate-700 font-mono text-center shadow-4xs"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'metric-card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Card Header Title</label>
                      <input
                        type="text"
                        value={selectedComponent.props.title}
                        onChange={(e) => updateComponent(selectedComponent.id, { title: e.target.value })}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none text-slate-700 font-semibold focus:border-indigo-400 transition-colors shadow-3xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Analytical Column</label>
                      <select
                        value={selectedComponent.props.column}
                        onChange={(e) => updateComponent(selectedComponent.id, { column: e.target.value })}
                        className="w-full text-xs border border-slate-200 bg-slate-50 rounded-xl p-2.5 outline-none font-bold text-slate-700 focus:bg-white focus:border-indigo-400 transition-colors"
                      >
                        {csvHeaders.length > 0 ? (
                          csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))
                        ) : (
                          <option value="">(No CSV Dataset Loaded)</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aggregation Operation</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-50 border p-1 rounded-xl">
                        {['COUNT', 'SUM', 'AVG'].map((op) => {
                          const isActive = selectedComponent.props.operation === op;
                          return (
                            <button
                              key={op}
                              type="button"
                              onClick={() => updateComponent(selectedComponent.id, { operation: op })}
                              className={`py-1.5 text-[10px] rounded-lg font-bold transition-all duration-150 ${
                                isActive ? 'bg-white text-indigo-600 shadow-3xs border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {op}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'spacer' && (
                  <>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Spacer Variant Style</label>
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
                              className={`py-1.5 text-xs rounded-lg font-medium transition-all duration-150 ${
                                isActive ? 'bg-white text-indigo-600 shadow-3xs border border-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gap Dimensions (px)</label>
                      <input
                        type="number"
                        min="10"
                        max="250"
                        value={selectedComponent.props.height || 24}
                        onChange={(e) => updateComponent(selectedComponent.id, { height: parseInt(e.target.value) || 10 })}
                        className="w-full text-xs border border-slate-200 bg-slate-50/30 rounded-xl p-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-mono font-bold transition-all"
                      />
                    </div>
                  </>
                )}

                {selectedComponent.type === 'page-break' && (
                  <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-purple-900 text-xs leading-relaxed shadow-4xs animate-fade-in">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-info text-purple-500"></i> Static Node Properties
                    </p>
                    This is an isolated structural split node. It injects a hard page page-break break layout constraint directly into your server-side compiler pipeline config parameters.
                  </div>
                )}

                {/* Deletion Zone */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => deleteComponent(selectedComponent.id)}
                    className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold border border-red-200/30 shadow-3xs transform active:scale-98 transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-solid fa-trash-can text-[11px]"></i> Delete Component
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 p-4">
                <i className="fa-solid fa-hand-pointer text-md block mb-1.5 text-slate-300 animate-pulse"></i>
                <p className="text-[11px] font-bold text-slate-500">No Segment Active</p>
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