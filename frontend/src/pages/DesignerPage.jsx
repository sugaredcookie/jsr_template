import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';

const DesignerPage = () => {
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [components, setComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null); // Track ID instead of object instance
  const [editingId, setEditingId] = useState(null);
  const [nextId, setNextId] = useState(1);
  const [draggedIdx, setDraggedIdx] = useState(null); // Track item sorting
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Find currently selected component configuration safely
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

          // Auto-update existing layout elements to use active column schema
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

  // Add Component
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
    setSelectedComponentId(currentId); // Reference by persistent ID
    setPreviewHtml(null);
    setIsPreviewMode(false);
  }, [nextId, csvHeaders]);

  // Update Component Properties
  const updateComponent = useCallback((id, newProps) => {
    setComponents(prev => prev.map(comp =>
      comp.id === id ? { ...comp, props: { ...comp.props, ...newProps } } : comp
    ));
  }, []);

  // Delete Component
  const deleteComponent = useCallback((id) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    if (selectedComponentId === id) setSelectedComponentId(null);
    if (editingId === id) setEditingId(null);
  }, [selectedComponentId, editingId]);

  // Handle Text Edit
  const handleTextEdit = useCallback((id, newValue) => {
    setComponents(prev => prev.map(comp =>
      comp.id === id && comp.type === 'text'
        ? { ...comp, props: { ...comp.props, value: newValue } }
        : comp
    ));
  }, []);

  // Native HTML5 Drag and Drop mechanics
  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    // Mutate state layout arrangement positions fluently
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

  // Generate Preview Simulation
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
    <div className="flex flex-col h-screen bg-gray-100 select-none">
      {/* Top Toolbar */}
      <div className="h-16 bg-white border-b flex items-center px-6 gap-6 shadow-sm z-10">
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-2xl text-red-500">📄</span>
          <h1 className="text-xl font-bold text-gray-800">Report Designer</h1>
        </div>

        <div className="flex items-center gap-3 mx-auto">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors">
            <span>Upload CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>

          <button onClick={() => addComponent('text')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">
            <span>+ Add Text</span>
          </button>

          <button onClick={() => addComponent('table')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">
            <span>📊 Add Table</span>
          </button>
        </div>

        <button
          onClick={isPreviewMode ? () => setIsPreviewMode(false) : handleGeneratePreview}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          <span>{isPreviewMode ? 'Back to Designer' : 'Generate Preview'}</span>
        </button>
      </div>

      {isPreviewMode && previewHtml ? (
        <div className="flex-1 bg-white overflow-auto p-4 flex justify-center">
          <div className="w-full max-w-4xl border m-4 bg-white shadow-lg p-8 rounded-lg" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="uppercase text-xs tracking-widest text-gray-400 font-bold mb-2">CSV File</h2>
              {csvFileName ? (
                <div className="text-sm font-medium text-green-600 truncate bg-green-50 p-2 rounded-lg border border-green-200">
                  {csvFileName}
                </div>
              ) : (
                <div className="text-gray-400 text-xs py-4 text-center border border-dashed border-gray-200 rounded-xl">
                  No CSV loaded
                </div>
              )}
            </div>

            <div className="p-4 border-b flex-1 overflow-auto">
              <h2 className="uppercase text-xs tracking-widest text-gray-400 font-bold mb-2">Available CSV Fields</h2>
              {csvHeaders.length > 0 ? (
                <div className="text-sm space-y-1.5">
                  {csvHeaders.map((h, i) => (
                    <div key={i} className="px-3 py-1.5 bg-gray-50 rounded-lg text-gray-700 border text-xs font-mono">
                      {`{{${h}}}`}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-xs py-8 text-center border border-dashed border-gray-200 rounded-xl">
                  Upload a CSV to view schema
                </div>
              )}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-8 flex items-start justify-center overflow-auto bg-gray-50">
            <div className="bg-white w-full max-w-3xl min-h-[700px] shadow-md border rounded-xl p-8">
              {components.length === 0 ? (
                <div className="h-[500px] flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-lg font-medium">Your Report Canvas is Empty</p>
                  <p className="text-sm mt-1 text-gray-400">Click components on top to construct layouts.</p>
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
                        className={`group relative p-5 pl-12 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200 hover:border-gray-300 bg-white'
                          } ${draggedIdx === index ? 'opacity-40 scale-95' : 'opacity-100'}`}
                      >
                        {/* Drag and Drop Grab Handle */}
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing text-lg px-1">
                          ⠿
                        </div>

                        {/* Element Identity Badge */}
                        <div className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
                          {comp.type === 'text' ? 'Text Block (Double Click)' : 'Data Table Component'}
                        </div>

                        {/* Element Content Renderers */}
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
                                  className="w-full border border-blue-400 rounded px-2 py-1 outline-none text-black font-normal"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  style={{ fontSize: `${comp.props.fontSize || 16}px`, fontWeight: comp.props.bold ? 'bold' : 'normal' }}
                                  className="text-gray-800 break-words min-h-[24px]"
                                >
                                  {comp.props.value || <span className="text-gray-300 italic">Empty text value</span>}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Structural Table Elements Container */
                            <div className="overflow-x-auto pointer-events-none select-none">
                              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                                <thead>
                                  <tr className="bg-gray-50">
                                    {comp.props.columns.map((col, idx) => (
                                      <th key={idx} className="border border-gray-200 p-2 font-semibold text-gray-600">
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {[1, 2].map((rowIdx) => (
                                    <tr key={rowIdx} className="bg-white odd:bg-gray-50/30">
                                      {comp.props.columns.map((col, idx) => (
                                        <td key={idx} className="border border-gray-200 p-2 text-gray-400 font-mono italic">
                                          {csvData.length > 0 ? csvData[rowIdx - 1]?.[col] || `[${col}]` : `[Dynamic ${col}]`}
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
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-auto">
            <h3 className="font-bold text-gray-800 text-md border-b pb-3 mb-4">Element Properties</h3>
            {selectedComponent ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Type</label>
                  <p className="font-medium text-sm capitalize bg-gray-100 px-2 py-1 rounded inline-block">{selectedComponent.type}</p>
                </div>

                {selectedComponent.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Edit Text Content</label>
                      <textarea
                        value={selectedComponent.props.value}
                        onChange={(e) => handleTextEdit(selectedComponent.id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Font Size (px)</label>
                      <input
                        type="number"
                        value={selectedComponent.props.fontSize || 16}
                        onChange={(e) => updateComponent(selectedComponent.id, { fontSize: parseInt(e.target.value) || 12 })}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bold-check"
                        checked={selectedComponent.props.bold || false}
                        onChange={(e) => updateComponent(selectedComponent.id, { bold: e.target.checked })}
                      />
                      <label htmlFor="bold-check" className="text-sm font-medium text-gray-700 cursor-pointer">Apply Bold Weight</label>
                    </div>
                  </>
                )}

                {selectedComponent.type === 'table' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Output Fields</label>
                    <p className="text-[11px] text-gray-400 mb-3">Click on a field name to toggle its visibility in your canvas report table.</p>
                    <div className="max-h-80 overflow-y-auto space-y-1.5 bg-gray-50 p-2 rounded-lg border">
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
                                  // Remove column (keep at least 1 so it doesn't crash empty)
                                  updatedCols = selectedComponent.props.columns.filter(c => c !== col);
                                  if (updatedCols.length === 0) updatedCols = [col];
                                } else {
                                  // Add column back matching original CSV sequence layout
                                  updatedCols = csvHeaders.filter(h =>
                                    selectedComponent.props.columns.includes(h) || h === col
                                  );
                                }
                                updateComponent(selectedComponent.id, { columns: updatedCols });
                              }}
                              className={`w-full text-left text-xs font-mono py-2 px-3 rounded-lg border shadow-sm transition-all flex items-center justify-between ${isIncluded
                                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                                  : 'bg-white border-gray-200 text-gray-400 opacity-60 hover:opacity-100'
                                }`}
                            >
                              <span>{col}</span>
                              <span className="text-[10px]">{isIncluded ? '✅' : '➕'}</span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-xs text-gray-400 p-4 text-center">
                          No CSV columns available. Upload a CSV file to manage fields.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <button
                    onClick={() => deleteComponent(selectedComponent.id)}
                    className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
                  >
                    Delete Component
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-20 border-2 border-dashed rounded-xl">
                <p className="text-sm">No component selected</p>
                <p className="text-xs text-gray-400 mt-1">Click a canvas layout block to customize its style metrics.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerPage;