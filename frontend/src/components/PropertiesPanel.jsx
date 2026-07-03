import React from 'react';
import { getComponentIcon, getComponentLabel, detectColumnType } from '../utils/evaluators.js';
import TextControls from './PropertyControls/TextControls';
import GridControls from './PropertyControls/GridControls';
import SpacerControls from './PropertyControls/SpacerControls';

const PropertiesPanel = ({ 
  selectedComponent, 
  onUpdateComponent, 
  onDeleteComponent,
  csvHeaders,
  csvData 
}) => {
  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-auto shadow-xs sticky top-16 h-[calc(100vh-64px)]">
        <h3 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
          <i className="fa-solid fa-sliders text-slate-400 text-xs"></i> Property Controller
        </h3>
        <div className="text-center text-slate-400 py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 p-4">
          <i className="fa-solid fa-hand-pointer text-md block mb-1.5 text-slate-300 animate-pulse"></i>
          <p className="text-[11px] font-bold text-slate-500">No Segment Active</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Select a layout node on your canvas panel to tune design parameters.</p>
        </div>
      </div>
    );
  }

  // Column Sorter Engine Logic
  const shiftColumnPosition = (columns, index, direction) => {
    const updatedCols = [...columns];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= updatedCols.length) return;

    // Direct value swap
    const pivot = updatedCols[index];
    updatedCols[index] = updatedCols[targetIdx];
    updatedCols[targetIdx] = pivot;

    onUpdateComponent(selectedComponent.id, { columns: updatedCols });
  };

  // Visibility Meta Flags Engine
  const toggleColumnFlag = (colName) => {
    const currentMetadata = selectedComponent.props?.columnMetadata || {};
    const specificMeta = currentMetadata[colName] || { label: colName, align: 'left', width: '' };

    const updatedMetadata = {
      ...currentMetadata,
      [colName]: {
        ...specificMeta,
        hidden: !specificMeta.hidden
      }
    };

    onUpdateComponent(selectedComponent.id, { columnMetadata: updatedMetadata });
  };

  const renderControls = () => {
    switch (selectedComponent.type) {
      case 'text':
        return (
          <TextControls 
            component={selectedComponent} 
            onUpdate={(props) => onUpdateComponent(selectedComponent.id, props)}
          />
        );
      case 'table':
        const tableProps = selectedComponent.props || {};
        const columns = tableProps.columns || [];
        const metadata = tableProps.columnMetadata || {};

        return (
          <div className="space-y-4 animate-fade-in">
            {/* Automatic PDF Head Repeat Control Configuration */}
            <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl shadow-3xs">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!tableProps.repeatHeaderOnPageBreak}
                  onChange={(e) => onUpdateComponent(selectedComponent.id, { repeatHeaderOnPageBreak: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 text-xs cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-700">Repeat Table Headers</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 leading-normal">
                    Automatically duplicate table column titles at the top of every broken PDF page layout.
                  </span>
                </div>
              </label>
            </div>

            {/* Active Columns Pipeline Manager */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Active Columns Setup ({columns.length})
              </label>
              
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 border border-slate-100 p-1 bg-slate-50/50 rounded-xl">
                {columns.map((col, idx) => {
                  const meta = metadata[col] || {};
                  const isHidden = !!meta.hidden;

                  return (
                    <div 
                      key={col} 
                      className={`flex items-center justify-between p-2 rounded-lg border bg-white transition-all text-xs font-semibold ${
                        isHidden ? 'opacity-50 border-slate-200 bg-slate-50/50' : 'border-slate-200 shadow-3xs text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate max-w-[70%]">
                        <button
                          type="button"
                          onClick={() => toggleColumnFlag(col)}
                          className={`text-xs p-1 hover:bg-slate-50 rounded transition-colors ${isHidden ? 'text-slate-300' : 'text-indigo-500'}`}
                          title={isHidden ? "Show Field" : "Hide Field"}
                        >
                          <i className={`fa-solid ${isHidden ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                        <span className="truncate font-mono text-[10px]">{meta.label || col}</span>
                      </div>

                      {/* Manual Positional Shifters */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => shiftColumnPosition(columns, idx, -1)}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 rounded hover:bg-slate-50 transition-all"
                        >
                          <i className="fa-solid fa-chevron-up text-[9px]"></i>
                        </button>
                        <button
                          type="button"
                          disabled={idx === columns.length - 1}
                          onClick={() => shiftColumnPosition(columns, idx, 1)}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 rounded hover:bg-slate-50 transition-all"
                        >
                          <i className="fa-solid fa-chevron-down text-[9px]"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'grid-row':
        return (
          <GridControls 
            component={selectedComponent} 
            onUpdate={(props) => onUpdateComponent(selectedComponent.id, props)}
            csvHeaders={csvHeaders}
          />
        );
      case 'spacer':
        return (
          <SpacerControls 
            component={selectedComponent} 
            onUpdate={(props) => onUpdateComponent(selectedComponent.id, props)}
          />
        );
      case 'page-break':
        return (
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-900 text-xs leading-relaxed shadow-4xs animate-fade-in">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info text-purple-500"></i> Static Node Properties
            </p>
            This is an isolated structural split node. It injects a hard page page-break break layout constraint directly into your server-side compiler pipeline config parameters.
          </div>
        );
      case 'chart':
        const chartProps = selectedComponent.props || {};
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Chart Component Header</label>
              <input
                type="text"
                value={chartProps.title || ''}
                onChange={(e) => onUpdateComponent(selectedComponent.id, { title: e.target.value })}
                placeholder="e.g. Sales Metrics Overview"
                className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 outline-none font-semibold text-slate-700 focus:border-indigo-400 shadow-3xs transition-all"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Visualization Model</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                {['bar', 'line', 'pie'].map((type) => {
                  const isActive = (chartProps.chartType || 'bar') === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onUpdateComponent(selectedComponent.id, { chartType: type })}
                      className={`py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all duration-150 ${
                        isActive ? 'bg-white text-indigo-600 shadow-3xs border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">X-Axis Labels (Categorical Column)</label>
              <select
                value={chartProps.xAxisColumn || ''}
                onChange={(e) => onUpdateComponent(selectedComponent.id, { xAxisColumn: e.target.value })}
                className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 outline-none font-semibold text-slate-700 focus:border-indigo-400 shadow-3xs transition-all"
              >
                <option value="">(Select Category Field)</option>
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Metric Formula Operation</label>
              <select
                value={chartProps.operation || 'COUNT'}
                onChange={(e) => {
                  const op = e.target.value;
                  if (op !== 'COUNT' && chartProps.yAxisColumn && csvData) {
                    const detectedType = detectColumnType(csvData, chartProps.yAxisColumn);
                    if (detectedType === 'string') {
                      alert(`Silicon Architecture Guard: Column "${chartProps.yAxisColumn}" contains text/categorical records. Math operations cannot be assigned.`);
                      return;
                    }
                  }
                  onUpdateComponent(selectedComponent.id, { 
                    operation: op,
                    yAxisColumn: op === 'COUNT' ? '' : (chartProps.yAxisColumn || csvHeaders[0] || '')
                  });
                }}
                className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 outline-none font-bold text-slate-700 focus:border-indigo-400 shadow-3xs transition-all"
              >
                <option value="COUNT">COUNT (Total Records Available)</option>
                <option value="SUM">SUM (Requires Numeric Field)</option>
                <option value="AVG">AVG (Requires Numeric Field)</option>
              </select>
            </div>

            {chartProps.operation !== 'COUNT' && (
              <div className="animate-slide-in">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Y-Axis Values (Numeric Aggregation Target)</label>
                <select
                  value={chartProps.yAxisColumn || ''}
                  onChange={(e) => {
                    const nextCol = e.target.value;
                    if (nextCol && csvData) {
                      const detectedType = detectColumnType(csvData, nextCol);
                      if (detectedType === 'string') {
                        alert(`Silicon Architecture Guard: Column "${nextCol}" is resolved as a string text type. Please select a numerical column to perform ${chartProps.operation || 'math calculations'}.`);
                        return;
                      }
                    }
                    onUpdateComponent(selectedComponent.id, { yAxisColumn: nextCol });
                  }}
                  className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 outline-none font-semibold text-slate-700 focus:border-indigo-400 shadow-3xs transition-all"
                >
                  <option value="">(Select Values Target)</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-slate-500 text-sm">No controls available for this component type.</p>;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-auto shadow-xs sticky top-16 h-[calc(100vh-64px)]">
      <h3 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
        <i className="fa-solid fa-sliders text-slate-400 text-xs"></i> Property Controller
      </h3>

      <div className="space-y-5 animate-fade-in">
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Node Element Type</label>
          <p className="font-semibold text-[11px] capitalize bg-slate-50 border border-slate-200/60 text-slate-700 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-3xs">
            <i className={`${getComponentIcon(selectedComponent.type)} text-xs`}></i>
            {getComponentLabel(selectedComponent.type)}
          </p>
        </div>

        {renderControls()}

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => onDeleteComponent(selectedComponent.id)}
            className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold border border-red-200/30 shadow-3xs transform active:scale-98 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <i className="fa-solid fa-trash-can text-[11px]"></i> Delete Component
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;