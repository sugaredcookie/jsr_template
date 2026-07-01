import React from 'react';
import { evaluateRowHighlightStyles, evaluateMetricValue, getComponentIcon, getComponentLabel } from '../utils/evaluators';

const Canvas = ({
  components,
  csvData,
  csvHeaders,
  selectedComponentId,
  editingId,
  draggedIdx,
  onSelectComponent,
  onEditComponent,
  onTextEdit,
  onDeleteComponent,
  onDragStart,
  onDragOver,
  onDragEnd
}) => {
  const renderComponent = (comp, index) => {
    const isSelected = selectedComponentId === comp.id;
    const isEditing = editingId === comp.id;

    return (
      <div
        key={comp.id}
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent(comp.id);
        }}
        className={`group relative p-4 pl-11 rounded-2xl border transition-all duration-150 cursor-pointer ${
          isSelected 
            ? 'border-indigo-500 bg-indigo-50/10 shadow-xs ring-4 ring-indigo-500/5 scale-[1.005]' 
            : 'border-slate-100 hover:border-slate-200 hover:shadow-3xs bg-white/70 hover:bg-white'
        } ${draggedIdx === index ? 'opacity-20 scale-95 duration-100' : 'opacity-100'}`}
      >
        {/* Drag Handle */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-400/80 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100 active:scale-95 transition-all">
          <i className="fa-solid fa-grip-vertical text-xs"></i>
        </div>

        {/* Component Type Badge */}
        <div className="absolute top-2 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
          <span className="bg-slate-800 text-white text-[8px] font-bold tracking-wide px-2 py-0.5 rounded-md shadow-3xs uppercase">
            {getComponentLabel(comp.type)}
          </span>
        </div>

        <div className="pointer-events-auto">
          {comp.type === 'text' && (
            <div onDoubleClick={() => onEditComponent(comp.id)}>
              {isEditing ? (
                <input
                  type="text"
                  value={comp.props.value}
                  onChange={(e) => onTextEdit(comp.id, e.target.value)}
                  onBlur={() => onEditComponent(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onEditComponent(null); }}
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
                  <div className="text-xl font-black text-slate-900 mt-0.5">{evaluateMetricValue(csvData, item.column, item.operation)}</div>
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
  };

  return (
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
            {components.map((comp, index) => renderComponent(comp, index))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;