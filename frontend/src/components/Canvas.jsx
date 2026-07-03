import React from 'react';
import { evaluateRowHighlightStyles, evaluateMetricValue, getComponentIcon, getComponentLabel } from '../utils/evaluators';

const THEME_STYLES = {
  silicon: {
    fontFamily: "font-sans tracking-tight",
    monoFont: "font-mono tracking-wide",
    containerBg: "bg-white",
    textColor: "text-slate-700",
    headingColor: "text-slate-900",
    subtextColor: "text-slate-400",
    borderStyle: "border border-slate-200/50",
    borderRadius: "rounded-xl",
    tableHeaderBg: "bg-slate-100/40",
    cardBg: "bg-slate-50/70",
    accentBg: "bg-indigo-50 border-indigo-100",
    accentText: "text-indigo-600",
    chartFill: "from-indigo-500/10 to-indigo-500/20 border-indigo-500/30",
    chartDot: "bg-indigo-500 ring-indigo-500/10",
    chartLine: "bg-indigo-400/30"
  },
  corporate: {
    fontFamily: "font-sans tracking-normal",
    monoFont: "font-mono tracking-normal",
    containerBg: "bg-slate-50/50",
    textColor: "text-slate-600",
    headingColor: "text-blue-900",
    subtextColor: "text-slate-500",
    borderStyle: "border border-slate-300",
    borderRadius: "rounded-md",
    tableHeaderBg: "bg-slate-200",
    cardBg: "bg-white",
    accentBg: "bg-blue-50 border-blue-200",
    accentText: "text-blue-700",
    chartFill: "from-blue-600/10 to-blue-600/20 border-blue-600/40",
    chartDot: "bg-blue-700 ring-blue-700/10",
    chartLine: "bg-blue-500/30"
  },
  editorial: {
    fontFamily: "font-serif tracking-wide",
    monoFont: "font-mono tracking-tight",
    containerBg: "bg-[#fcfbf7]",
    textColor: "text-neutral-800",
    headingColor: "text-neutral-900",
    subtextColor: "text-neutral-500",
    borderStyle: "border border-neutral-900",
    borderRadius: "rounded-none",
    tableHeaderBg: "bg-neutral-200/60",
    cardBg: "bg-[#fcfbf7]",
    accentBg: "bg-neutral-100 border-neutral-900",
    accentText: "text-neutral-900",
    chartFill: "from-neutral-900/5 to-neutral-900/10 border-neutral-900/40",
    chartDot: "bg-neutral-900 ring-neutral-900/10",
    chartLine: "bg-neutral-900/20"
  }
};

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
  onDragEnd,
  currentTheme = 'silicon'
}) => {
  const theme = THEME_STYLES[currentTheme] || THEME_STYLES.silicon;

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
        className={`group relative p-4 pl-11 border transition-all duration-150 cursor-pointer ${theme.borderRadius} ${
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
                    color: comp.props.color || (currentTheme === 'editorial' ? '#2d2d2d' : '#1e293b'),
                    fontFamily: comp.props.fontFamily ? `${comp.props.fontFamily}, sans-serif` : (currentTheme === 'editorial' ? 'Georgia, serif' : 'Arial, sans-serif')
                  }}
                  className={`break-words min-h-[22px] transition-all ${theme.fontFamily}`}
                >
                  {comp.props.value || <span className="text-slate-300 italic font-light">Empty layout copy block</span>}
                </div>
              )}
            </div>
          )}

          {comp.type === 'table' && (() => {
            // Filter down to visibility-approved columns dynamically ahead of table drawing routines
            const visibleColumns = comp.props.columns.filter(
              col => !comp.props.columnMetadata?.[col]?.hidden
            );

            return (
              <div className={`overflow-x-auto pointer-events-none select-none shadow-3xs bg-white relative ${theme.borderRadius} ${theme.borderStyle}`}>
                {/* Visual configuration state tracking tags */}
                {comp.props.repeatHeaderOnPageBreak && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shadow-3xs z-20">
                    <i className="fa-solid fa-repeat text-[7px]"></i> Print Pagination Active
                  </div>
                )}

                <table className={`w-full text-[11px] text-left border-collapse min-w-[600px] table-layout-fixed ${theme.fontFamily}`}>
                  <thead>
                    <tr className={`border-b border-slate-200 ${theme.tableHeaderBg}`}>
                      {visibleColumns.map((col, idx) => {
                        const meta = comp.props.columnMetadata?.[col] || { label: col, align: 'left', width: '' };
                        return (
                          <th key={idx} style={{ textAlign: meta.align, width: meta.width ? `${meta.width}%` : 'auto' }} className={`p-2.5 font-semibold text-[10px] overflow-hidden text-ellipsis whitespace-nowrap ${theme.headingColor} ${theme.monoFont}`}>
                            {meta.label || col}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((rowIdx) => {
                      const rowData = csvData[rowIdx - 1];
                      let computedRowStyle = { background: '#ffffff', color: currentTheme === 'editorial' ? '#2d2d2d' : '#334155' };

                      if (csvData.length > 0 && rowData && comp.props.highlightRule) {
                        const hr = comp.props.highlightRule;
                        const styleResult = evaluateRowHighlightStyles(rowData, hr);
                        if (styleResult.backgroundColor) {
                          computedRowStyle = styleResult;
                        }
                      }

                      return (
                        <tr key={rowIdx} style={computedRowStyle} className="border-b border-slate-100 last:border-none bg-white odd:bg-white/40 even:bg-slate-50/20">
                          {visibleColumns.map((col, idx) => {
                            const meta = comp.props.columnMetadata?.[col] || { align: 'left' };
                            return (
                              <td key={idx} style={{ textAlign: meta.align }} className={`p-2.5 text-xs overflow-hidden text-ellipsis whitespace-nowrap ${theme.monoFont}`}>
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
            );
          })()}

          {comp.type === 'spacer' && (
            <div className="py-1 pointer-events-none select-none">
              {comp.props.variant === 'line' ? (
                <div className="flex items-center w-full" style={{ height: `${comp.props.height || 24}px` }}>
                  <div className={`w-full border-t border-dashed opacity-60 ${currentTheme === 'editorial' ? 'border-neutral-900' : 'border-slate-200'}`}></div>
                </div>
              ) : (
                <div 
                  style={{ height: `${comp.props.height || 24}px` }} 
                  className={`w-full bg-slate-50/50 border border-dashed flex items-center justify-center text-[10px] text-slate-400 border-slate-200 ${theme.borderRadius} ${theme.monoFont}`}
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
                <div key={item.id || idx} className={`flex-1 p-4 shadow-3xs transform hover:scale-[1.01] transition-all ${theme.cardBg} ${theme.borderStyle} ${theme.borderRadius} ${theme.fontFamily}`}>
                  <div className={`text-[9px] font-bold uppercase tracking-wider truncate ${theme.subtextColor}`}>{item.title}</div>
                  <div className={`text-xl font-black mt-0.5 ${theme.headingColor}`}>{evaluateMetricValue(csvData, item.column, item.operation)}</div>
                  <div className={`text-[8px] font-bold mt-1 px-1.5 py-0.5 rounded inline-block ${theme.monoFont} ${theme.accentBg} ${theme.accentText}`}>
                    {item.operation}({item.column || 'Unset'})
                  </div>
                </div>
              ))}
            </div>
          )}

          {comp.type === 'chart' && (
            <div className={`w-full p-5 select-none animate-fade-in ${theme.cardBg} ${theme.borderStyle} ${theme.borderRadius} ${theme.fontFamily}`}>
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <i className={`fa-solid fa-chart-simple text-xs ${theme.accentText}`}></i>
                  <span className={`text-[11px] font-bold uppercase tracking-wide ${theme.headingColor}`}>
                    {comp.props.title || 'Data Visualization Summary'}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${theme.accentBg}`}>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${theme.monoFont} ${theme.accentText}`}>
                    {comp.props.chartType || 'bar'}
                  </span>
                </div>
              </div>

              {/* Theme-Aware Mock Vector Chart Blueprint Layer */}
              <div className={`h-44 w-full bg-white border border-slate-200/50 p-4 flex flex-col justify-between relative overflow-hidden group-hover:border-indigo-200/50 transition-all ${theme.borderRadius}`}>
                
                {comp.props.chartType === 'pie' ? (
                  <div className="flex-1 flex items-center justify-center relative">
                    <div className="w-28 h-28 rounded-full border-[14px] border-slate-100 flex items-center justify-center relative animate-pulse">
                      <div className={`absolute inset-0 rounded-full border-[14px] border-transparent border-t-indigo-500/20 border-l-purple-500/20 rotate-45 ${currentTheme === 'editorial' ? 'border-t-neutral-900/40' : ''}`}></div>
                      <div className="text-center">
                        <span className={`text-[9px] font-bold block tracking-tight ${theme.monoFont} ${theme.subtextColor}`}>X: {comp.props.xAxisColumn || 'None'}</span>
                        <span className={`text-[8px] px-1 rounded mt-0.5 inline-block ${theme.monoFont} ${theme.accentBg} ${theme.accentText}`}>{comp.props.operation}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-end gap-2.5 pb-2 relative">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                      <div className="w-full border-b border-slate-100"></div>
                      <div className="w-full border-b border-slate-100"></div>
                      <div className="w-full border-b border-slate-100"></div>
                    </div>
                    
                    <div className="flex items-end justify-around h-full px-4 relative z-10">
                      {[60, 85, 45, 100, 70].map((heightHeight, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1.5 w-12 group/bar">
                          {comp.props.chartType === 'line' ? (
                            <div className="w-full flex flex-col items-center relative" style={{ marginBottom: `${heightHeight * 0.9}px` }}>
                              <div className={`w-2.5 h-2.5 rounded-full shadow-3xs group-hover/bar:scale-110 transition-transform ${theme.chartDot}`}></div>
                              {idx < 4 && (
                                <div className={`absolute left-1/2 top-1.5 w-16 h-0.5 -rotate-12 origin-left pointer-events-none ${theme.chartLine}`}></div>
                              )}
                            </div>
                          ) : (
                            <div 
                              className={`w-8 bg-gradient-to-t rounded-t-md transition-all duration-300 ${theme.chartFill}`}
                              style={{ height: `${heightHeight}%` }}
                            ></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {comp.props.chartType !== 'pie' && (
                  <div className={`border-t border-slate-100 pt-2 flex items-center justify-between text-[9px] font-medium ${theme.monoFont} ${theme.subtextColor}`}>
                    <span className="truncate max-w-[50%]">X-Axis: <b className={theme.headingColor}>{comp.props.xAxisColumn || 'Unset'}</b></span>
                    <span className="truncate max-w-[50%] text-right">
                      Y-Axis: <b className={theme.accentText}>{comp.props.operation}({comp.props.operation === 'COUNT' ? 'all' : comp.props.yAxisColumn || 'Unset'})</b>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-8 flex items-start justify-center overflow-auto bg-slate-900/[0.01]">
      <div className={`w-full max-w-4xl min-h-[720px] shadow-xs border border-slate-200/80 backdrop-blur-md p-8 overflow-hidden transition-all duration-300 ${theme.containerBg} ${theme.borderRadius}`}>
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