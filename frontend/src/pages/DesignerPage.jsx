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

  const toggleDownload = () => {
    if (!previewHtml) {
      alert("Generate preview first");
      return;
    }

    const blob = new Blob([previewHtml], {
      type: "text/html"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "report.html";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper evaluator to cross-reference dataset elements against dynamic rule parameters
  const evaluateRowHighlightStyles = useCallback((row, rule) => {
    if (!rule || !rule.column || !rule.operator || !rule.value) return {};
    
    const rawValue = row[rule.column];
    const cellValue = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
    const targetLimit = parseFloat(rule.value);

    if (!isNaN(cellValue) && !isNaN(targetLimit)) {
      switch (rule.operator) {
        case '>': if (cellValue > targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
        case '<': if (cellValue < targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
        case '==': if (cellValue === targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
        case '!=': if (cellValue !== targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
        default: return {};
      }
    }
    
    const stringCell = String(rawValue).toLowerCase().trim();
    const stringTarget = String(rule.value).toLowerCase().trim();
    
    switch (rule.operator) {
      case '==': if (stringCell === stringTarget) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      case '!=': if (stringCell !== stringTarget) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      default: return {};
    }
    return {};
  }, []);

  // Secondary clean evaluation wrapper for standalone analytical data targets
  const evaluateMetricValue = (column, operation) => {
    if (!csvData.length || !column) return '—';

    if (operation === 'COUNT') return csvData.length.toLocaleString();

    const values = csvData
      .map(row => parseFloat(String(row[column] || '').replace(/[^0-9.-]/g, '')))
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
            if (comp.type === 'grid-row') {
              const updatedItems = comp.props.gridItems.map(item => ({
                ...item,
                column: item.column || headers[0]
              }));
              return { ...comp, props: { ...comp.props, gridItems: updatedItems } };
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
      props = { columns: csvHeaders.length > 0 ? csvHeaders : ['Column 1', 'Column 2', 'Column 3'], columnMetadata: {}, highlightRule: null };
    } else if (type === 'spacer') {
      props = { height: 24, variant: 'line' };
    } else if (type === 'page-break') {
      props = {};
    } else if (type === 'grid-row') {
      props = {
        gridItems: [
          { id: `metric-1-${currentId}`, title: 'Headcount Summary', column: csvHeaders[0] || '', operation: 'COUNT' },
          { id: `metric-2-${currentId}`, title: 'Performance Average', column: csvHeaders[0] || '', operation: 'AVG' }
        ]
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
      comp.id === id && comp.type === 'text' ? { ...comp, props: { ...comp.props, value: newValue } } : comp
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
          const highlight = evaluateRowHighlightStyles(row, comp.props.highlightRule);
          const trInlineBg = highlight.backgroundColor ? `background-color: ${highlight.backgroundColor};` : 'background: #ffffff;';
          const trInlineColor = highlight.color ? `color: ${highlight.color};` : '';

          compiledHtml += `<tr style="border-bottom: 1px solid #e2e8f0; ${trInlineBg} ${trInlineColor}">`;
          comp.props.columns.forEach(col => {
            const meta = comp.props.columnMetadata?.[col] || { align: 'left' };
            compiledHtml += `<td style="border-right:1px solid #e2e8f0; padding:12px 10px; text-align:${meta.align}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row[col] || ''}</td>`;
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
      } else if (comp.type === 'grid-row') {
        compiledHtml += `<div style="display: flex; gap: 16px; width: 100%; margin-bottom: 20px;">`;
        comp.props.gridItems.forEach(item => {
          const val = evaluateMetricValue(item.column, item.operation);
          compiledHtml += `
            <div style="flex: 1; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-family: sans-serif;">
              <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">${item.title}</div>
              <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px;">${val}</div>
              <div style="font-size: 9px; color: #94a3b8; margin-top: 2px; font-family: monospace;">${item.operation}(${item.column || 'all'})</div>
            </div>`;
        });
        compiledHtml += `</div>`;
      }
    });
    compiledHtml += `</div>`;

    setTimeout(() => {
      setPreviewHtml(compiledHtml);
      setIsPreviewMode(true);
      setIsGenerating(false);
    }, 800);
  }, [csvData, components, evaluateRowHighlightStyles]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 font-sans antialiased select-none text-slate-800">
      
      {/* Top Toolbar */}
      <div className="h-16 bg-white/75 backdrop-blur-md border-b border-white/60 flex items-center px-6 gap-6 shadow-xs sticky top-0 z-50">
        <div className="flex items-center gap-2.5 flex-shrink-0 group cursor-default transition-all duration-300 hover:opacity-90">
          {/* <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
            <i className="fa-solid fa-file-signature text-sm text-white"></i>
          </div> */}
          <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Report Designer
          </h1>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2 mx-auto bg-slate-200/40 p-1.5 rounded-2xl border border-slate-300/20 backdrop-blur-xs">
          <label className="cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl shadow-3xs hover:bg-slate-50 hover:border-slate-300/80 text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200">
            <i className="fa-solid fa-cloud-arrow-up text-indigo-500 text-xs"></i>
            <span>Upload CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>

          <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

          <button 
            onClick={() => addComponent('text')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-font text-blue-500 text-xs"></i>
            <span>Text</span>
          </button>

          <button 
            onClick={() => addComponent('table')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-table-columns text-emerald-500 text-xs"></i>
            <span>Table</span>
          </button>

          <button 
            onClick={() => addComponent('grid-row')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-chart-pie text-violet-500 text-xs"></i>
            <span>Infographic Grid</span>
          </button>

          <button 
            onClick={() => addComponent('spacer')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-arrows-left-right-to-line text-amber-500 rotate-90 text-xs"></i>
            <span>Spacer</span>
          </button>

          <button 
            onClick={() => addComponent('page-break')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 shadow-3xs text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
          >
            <i className="fa-solid fa-scissors text-rose-500 text-xs"></i>
            <span>Page Break</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 bg-slate-800 hover:bg-slate-950 shadow-md pointer">
          <button onClick={toggleDownload}>
              <p>Download</p>
          </button>
        </div>

        <button
          onClick={isPreviewMode ? () => setIsPreviewMode(false) : handleGeneratePreview}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-semibold transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 ${
            isPreviewMode ? 'bg-slate-800 hover:bg-slate-950 shadow-md' : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:opacity-95 shadow-md shadow-indigo-600/10'
          }`}
        >
          {isGenerating ? <i className="fa-solid fa-circle-notch animate-spin text-xs"></i> : isPreviewMode ? <i className="fa-solid fa-circle-chevron-left text-xs"></i> : <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>}
          <span>{isPreviewMode ? 'Back to Designer' : 'Generate Preview'}</span>
        </button>
      </div>

      {/* Main Framework Splitter */}
      {isPreviewMode && previewHtml ? (
        <div className="flex-1 bg-slate-900/5 overflow-auto p-10 flex justify-center items-start animate-fade-in">
          <div className="w-full max-w-5xl border border-slate-200 bg-white shadow-xl rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar Tokens List */}
          <div className="w-72 bg-white/70 backdrop-blur-md border-r border-slate-200 flex flex-col shadow-3xs">
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
            <div className="bg-white/80 w-full max-w-4xl min-h-[720px] shadow-xs border border-slate-200/80 backdrop-blur-md rounded-3xl p-8 overflow-hidden transition-all duration-300">
              {components.length === 0 ? (
                <div className="h-[520px] flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/40 p-6 animate-fade-in">
                  <div className="w-12 h-12 bg-gradient-to-tr from-slate-50 to-slate-100 border border-slate-200/60 rounded-xl flex items-center justify-center mb-3 shadow-3xs transform group-hover:scale-105 transition-all">
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
                        className={`group relative p-4 pl-11 rounded-2xl border transition-all duration-150 cursor-pointer ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50/10 shadow-xs ring-4 ring-indigo-500/5 scale-[1.005]' 
                            : 'border-slate-100 hover:border-slate-200 hover:shadow-3xs bg-white/70 hover:bg-white'
                        } ${draggedIdx === index ? 'opacity-20 scale-95 duration-100' : 'opacity-100'}`}
                      >
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-400/80 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100 active:scale-95 transition-all">
                          <i className="fa-solid fa-grip-vertical text-xs"></i>
                        </div>

                        <div className="absolute top-2 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                          <span className="bg-slate-800 text-white text-[8px] font-bold tracking-wide px-2 py-0.5 rounded-md shadow-3xs uppercase">
                            {comp.type === 'grid-row' ? 'Infographic Row' : comp.type}
                          </span>
                        </div>

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
                                  className="w-full border-2 border-indigo-400 rounded-xl px-3 py-1.5 shadow-2xs outline-none text-slate-900 bg-white font-medium text-xs animate-fade-in"
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
                                  {comp.props.value || <span className="text-slate-300 italic font-light">Empty layout copy block</span>}
                                </div>
                              )}
                            </div>
                          )}

                          {comp.type === 'table' && (
                            <div className="overflow-x-auto pointer-events-none select-none rounded-lg border border-slate-200 shadow-3xs bg-white">
                              <table className="w-full text-[11px] text-left border-collapse min-w-[600px] table-layout-fixed">
                                <thead>
                                  <tr className="bg-slate-50/60 border-b border-slate-200">
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
                                  {[1, 2, 3].map((rowIdx) => {
                                    const rowData = csvData[rowIdx - 1];
                                    let computedRowStyle = { background: '#ffffff', color: '#334155' };

                                    if (csvData.length > 0 && rowData && comp.props.highlightRule) {
                                      const hr = comp.props.highlightRule;
                                      const styleResult = evaluateRowHighlightStyles(rowData, hr);
                                      if (styleResult.backgroundColor) {
                                        computedRowStyle = styleResult;
                                      }
                                    }

                                    return (
                                      <tr key={rowIdx} style={computedRowStyle} className="border-b border-slate-100 last:border-none bg-white odd:bg-white/40 even:bg-slate-50/20">
                                        {comp.props.columns.map((col, idx) => {
                                          const meta = comp.props.columnMetadata?.[col] || { align: 'left' };
                                          return (
                                            <td key={idx} style={{ textAlign: meta.align }} className="p-2.5 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                                              {csvData.length > 0 ? csvData[rowIdx - 1]?.[col] || `—` : `[${col}]`}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
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
                                  Blank Whitespace ({comp.props.height}px)
                                </div>
                              )}
                            </div>
                          )}

                          {comp.type === 'page-break' && (
                            <div className="py-0.5 pointer-events-none select-none border border-dashed border-purple-200 bg-purple-50/20 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-purple-600 font-semibold tracking-wide shadow-3xs animate-fade-in">
                              <i className="fa-solid fa-scissors text-purple-400"></i>
                              <span>jsreport hard PDF Page Break Marker</span>
                            </div>
                          )}

                          {comp.type === 'grid-row' && (
                            <div className="flex flex-row gap-4 w-full p-1 animate-fade-in">
                              {comp.props.gridItems.map((item, idx) => (
                                <div key={item.id || idx} className="flex-1 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl shadow-3xs transform hover:scale-[1.01] transition-all">
                                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">{item.title}</div>
                                  <div className="text-xl font-black text-slate-900 mt-0.5">{evaluateMetricValue(item.column, item.operation)}</div>
                                  <div className="text-[8px] font-mono text-indigo-500 font-bold mt-1 bg-indigo-50 px-1.5 py-0.5 rounded inline-block">
                                    {item.operation}({item.column || 'Unset'})
                                  </div>
                                </div>
                              ))}
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

          {/* Right Properties Management Panel */}
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
                    {selectedComponent.type === 'grid-row' && <i className="fa-solid fa-chart-pie text-violet-500 text-xs"></i>}
                    {selectedComponent.type === 'grid-row' ? 'Infographic Grid' : selectedComponent.type}
                  </p>
                </div>

                {selectedComponent.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Edit Text Content</label>
                      <textarea
                        value={selectedComponent.props.value}
                        onChange={(e) => handleTextEdit(selectedComponent.id, e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-slate-50/40 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none h-20 resize-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Family</label>
                      <select
                        value={selectedComponent.props.fontFamily || 'Arial'}
                        onChange={(e) => updateComponent(selectedComponent.id, { fontFamily: e.target.value })}
                        className="w-full text-xs border border-slate-200 bg-slate-50 rounded-xl p-2.5 outline-none font-semibold text-slate-700"
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
                      <div className="flex items-center gap-2 border border-slate-200 bg-slate-50/40 rounded-xl p-1.5 pl-3">
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
                        className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 bg-white shadow-3xs"
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
                                  isIncluded ? 'bg-indigo-600 border-indigo-600 text-white font-medium shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                <span className="truncate pr-2">{col}</span>
                                <span className="text-[10px] flex-shrink-0">
                                  {isIncluded ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-solid fa-circle-plus opacity-40"></i>}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-xs text-slate-400 p-2 text-center italic bg-slate-100/50 rounded-lg">No CSV headers mapped.</div>
                        )}
                      </div>
                    </div>

                    {/* Conditional Highlighting Rules Manager Panel */}
                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i> Row Alert Rules
                      </label>
                      
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div>
                          <label className="block text-[9px] text-slate-400 font-medium mb-1">Target Match Field</label>
                          <select
                            value={selectedComponent.props.highlightRule?.column || ''}
                            onChange={(e) => {
                              const currentRule = selectedComponent.props.highlightRule || { operator: '>', value: '0', bgWash: '#f0fdf4', textColor: '#166534' };
                              updateComponent(selectedComponent.id, { highlightRule: { ...currentRule, column: e.target.value } });
                            }}
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 outline-none font-medium text-slate-700"
                          >
                            <option value="">(Select Column)</option>
                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <label className="block text-[9px] text-slate-400 font-medium mb-1">Operator</label>
                            <select
                              value={selectedComponent.props.highlightRule?.operator || '>'}
                              onChange={(e) => {
                                const currentRule = selectedComponent.props.highlightRule || { column: '', value: '0', bgWash: '#f0fdf4', textColor: '#166534' };
                                updateComponent(selectedComponent.id, { highlightRule: { ...currentRule, operator: e.target.value } });
                              }}
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 outline-none font-mono font-bold text-slate-700"
                            >
                              <option value=">">&gt;</option>
                              <option value="<">&lt;</option>
                              <option value="==">==</option>
                              <option value="!=">!=</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[9px] text-slate-400 font-medium mb-1">Match Constraint Value</label>
                            <input
                              type="text"
                              value={selectedComponent.props.highlightRule?.value || ''}
                              placeholder="e.g. 10 or Admin"
                              onChange={(e) => {
                                const currentRule = selectedComponent.props.highlightRule || { column: '', operator: '>', bgWash: '#f0fdf4', textColor: '#166534' };
                                updateComponent(selectedComponent.id, { highlightRule: { ...currentRule, value: e.target.value } });
                              }}
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 outline-none font-medium text-slate-700 focus:border-indigo-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] text-slate-400 font-medium mb-1.5">Alert Color Variant</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: 'Emerald Success', bg: '#f0fdf4', text: '#166534' },
                              { label: 'Amber Caution', bg: '#fffbeb', text: '#92400e' },
                              { label: 'Rose Critical', bg: '#fef2f2', text: '#991b1b' },
                              { label: 'Sky Informational', bg: '#f0f9ff', text: '#075985' }
                            ].map((palette) => {
                              const isChecked = selectedComponent.props.highlightRule?.bgWash === palette.bg;
                              return (
                                <button
                                  key={palette.label}
                                  type="button"
                                  onClick={() => {
                                    const currentRule = selectedComponent.props.highlightRule || { column: '', operator: '>', value: '' };
                                    updateComponent(selectedComponent.id, { 
                                      highlightRule: { ...currentRule, bgWash: palette.bg, textColor: palette.text } 
                                    });
                                  }}
                                  style={{ backgroundColor: palette.bg, color: palette.text }}
                                  className={`p-2 rounded-lg border text-[10px] font-bold text-center tracking-tight transition-all truncate ${
                                    isChecked ? 'border-slate-800 ring-2 ring-slate-800/20 scale-102 font-black' : 'border-slate-200 opacity-80'
                                  }`}
                                >
                                  {palette.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
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

                {/* FIXED: Added a custom side dashboard logic controller to configure nested Infographic Grid structures */}
                {selectedComponent.type === 'grid-row' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Infographic Sub-Cards</label>
                      <p className="text-[10px] text-slate-400 mt-1">Configure layout parameters for each item nested inside this tracking row grid layout container.</p>
                    </div>

                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                      {selectedComponent.props.gridItems.map((item, idx) => (
                        <div key={item.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-3xs animate-fade-in">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Card Slot #{idx + 1}</span>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Display Metric Title</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const copyItems = [...selectedComponent.props.gridItems];
                                copyItems[idx] = { ...item, title: e.target.value };
                                updateComponent(selectedComponent.id, { gridItems: copyItems });
                              }}
                              className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none text-slate-700 font-semibold focus:border-indigo-400"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Column</label>
                              <select
                                value={item.column}
                                onChange={(e) => {
                                  const copyItems = [...selectedComponent.props.gridItems];
                                  copyItems[idx] = { ...item, column: e.target.value };
                                  updateComponent(selectedComponent.id, { gridItems: copyItems });
                                }}
                                className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 outline-none font-medium text-slate-700"
                              >
                                {csvHeaders.length > 0 ? (
                                  csvHeaders.map(h => <option key={h} value={h}>{h}</option>)
                                ) : (
                                  <option value="">(No Data)</option>
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operation</label>
                              <select
                                value={item.operation}
                                onChange={(e) => {
                                  const copyItems = [...selectedComponent.props.gridItems];
                                  copyItems[idx] = { ...item, operation: e.target.value };
                                  updateComponent(selectedComponent.id, { gridItems: copyItems });
                                }}
                                className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 outline-none font-bold text-slate-700"
                              >
                                <option value="COUNT">COUNT</option>
                                <option value="SUM">SUM</option>
                                <option value="AVG">AVG</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
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
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-900 text-xs leading-relaxed shadow-4xs animate-fade-in">
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