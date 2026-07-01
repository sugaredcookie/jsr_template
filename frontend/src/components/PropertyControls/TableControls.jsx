import React from 'react';

const TableControls = ({ component, onUpdate, csvHeaders }) => {
  const updateProp = (key, value) => {
    onUpdate({ [key]: value });
  };

  const toggleColumn = (col) => {
    const isIncluded = component.props.columns.includes(col);
    let updatedCols;
    let updatedMeta = { ...(component.props.columnMetadata || {}) };
    
    if (isIncluded) {
      updatedCols = component.props.columns.filter(c => c !== col);
      if (updatedCols.length === 0) updatedCols = [col];
    } else {
      updatedCols = csvHeaders.filter(h => component.props.columns.includes(h) || h === col);
      if (!updatedMeta[col]) {
        updatedMeta[col] = { label: col, align: 'left', width: Math.floor(100 / updatedCols.length) };
      }
    }
    updateProp('columns', updatedCols);
    updateProp('columnMetadata', updatedMeta);
  };

  const updateColumnMeta = (col, metaKey, value) => {
    const updatedMeta = { ...(component.props.columnMetadata || {}) };
    updatedMeta[col] = { ...updatedMeta[col] || { label: col, align: 'left', width: 25 }, [metaKey]: value };
    updateProp('columnMetadata', updatedMeta);
  };

  const colorPalettes = [
    { label: 'Emerald Success', bg: '#f0fdf4', text: '#166534' },
    { label: 'Amber Caution', bg: '#fffbeb', text: '#92400e' },
    { label: 'Rose Critical', bg: '#fef2f2', text: '#991b1b' },
    { label: 'Sky Informational', bg: '#f0f9ff', text: '#075985' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Output Fields</label>
        <p className="text-[10px] text-slate-400 mb-2.5">Select columns to display in the generated view.</p>
        <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/80 shadow-3xs">
          {csvHeaders.length > 0 ? (
            csvHeaders.map((col) => {
              const isIncluded = component.props.columns.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleColumn(col)}
                  className={`w-full text-left text-xs font-mono py-1.5 px-2.5 rounded-lg border shadow-3xs transform active:scale-99 transition-all flex items-center justify-between ${
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

      {/* Highlighting Rules */}
      <div className="pt-3 border-t border-slate-100">
        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i> Row Alert Rules
        </label>
        
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div>
            <label className="block text-[9px] text-slate-400 font-medium mb-1">Target Match Field</label>
            <select
              value={component.props.highlightRule?.column || ''}
              onChange={(e) => {
                const currentRule = component.props.highlightRule || { operator: '>', value: '0', bgWash: '#f0fdf4', textColor: '#166534' };
                updateProp('highlightRule', { ...currentRule, column: e.target.value });
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
                value={component.props.highlightRule?.operator || '>'}
                onChange={(e) => {
                  const currentRule = component.props.highlightRule || { column: '', value: '0', bgWash: '#f0fdf4', textColor: '#166534' };
                  updateProp('highlightRule', { ...currentRule, operator: e.target.value });
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
                value={component.props.highlightRule?.value || ''}
                placeholder="e.g. 10 or Admin"
                onChange={(e) => {
                  const currentRule = component.props.highlightRule || { column: '', operator: '>', bgWash: '#f0fdf4', textColor: '#166534' };
                  updateProp('highlightRule', { ...currentRule, value: e.target.value });
                }}
                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 outline-none font-medium text-slate-700 focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] text-slate-400 font-medium mb-1.5">Alert Color Variant</label>
            <div className="grid grid-cols-2 gap-2">
              {colorPalettes.map((palette) => {
                const isChecked = component.props.highlightRule?.bgWash === palette.bg;
                return (
                  <button
                    key={palette.label}
                    type="button"
                    onClick={() => {
                      const currentRule = component.props.highlightRule || { column: '', operator: '>', value: '' };
                      updateProp('highlightRule', { ...currentRule, bgWash: palette.bg, textColor: palette.text });
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

      {/* Column Settings */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Column Settings</label>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {component.props.columns.map((col) => {
            const currentMeta = component.props.columnMetadata?.[col] || { label: col, align: 'left', width: 25 };
            
            return (
              <div key={col} className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2 shadow-4xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-indigo-600 truncate max-w-[120px]">{col}</span>
                  <div className="flex bg-white border border-slate-200 rounded-md p-0.5 shadow-4xs">
                    {['left', 'center', 'right'].map((alignOption) => (
                      <button
                        key={alignOption}
                        type="button"
                        onClick={() => updateColumnMeta(col, 'align', alignOption)}
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
                  onChange={(e) => updateColumnMeta(col, 'label', e.target.value)}
                  className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 outline-none text-slate-700 focus:border-indigo-400 font-semibold shadow-3xs"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">Width %</span>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={currentMeta.width || ''}
                    onChange={(e) => updateColumnMeta(col, 'width', parseInt(e.target.value) || 10)}
                    className="w-full text-[10px] font-bold border border-slate-200 bg-white rounded-md p-1 outline-none text-slate-700 font-mono text-center shadow-4xs"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TableControls;