import React from 'react';

const Sidebar = ({ 
  csvFileName, 
  csvHeaders, 
  components,
  csvData,
}) => {
  const componentStats = React.useMemo(() => {
    const stats = {};
    components.forEach(comp => {
      stats[comp.type] = (stats[comp.type] || 0) + 1;
    });
    return stats;
  }, [components]);

  const hasData = csvData && csvData.length > 0;

  return (
    <div className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-full overflow-hidden">
      {/* Header */}
      {/* <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-semibold text-slate-700">Active Document</span>
        </div>
        {csvFileName ? (
          <div className="mt-2">
            <div className="text-xs font-medium text-slate-600 truncate">{csvFileName}</div>
            <div className="text-xs text-slate-400 mt-0.5">{csvData?.length || 0} rows</div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-400">No CSV spreadsheet loaded</div>
        )}
      </div> */}

      {/* removed the active documents span */}

      {/* CSV Headers Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Parser Tokens</span>
          {csvHeaders.length > 0 && (
            <span className="ml-auto text-xs text-slate-400">{csvHeaders.length} columns</span>
          )}
        </div>

        {hasData && csvHeaders.length > 0 ? (
          <div className="space-y-1">
            {csvHeaders.map((header, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100/80 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs text-slate-700 font-mono">{header}</span>
                {csvData.length > 0 && (
                  <span className="ml-auto text-[10px] text-slate-400">
                    {csvData.filter(row => row[header] !== undefined && row[header] !== null && row[header] !== '').length}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <p className="text-xs text-slate-400">No parser tokens available</p>
            <p className="text-xs text-slate-300 mt-1">Upload a CSV to see columns</p>
          </div>
        )}

        {/* Component Stats - New Section */}
        {components.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Components</span>
              <span className="ml-auto text-xs text-slate-400">{components.length} total</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(componentStats).map(([type, count]) => (
                <div key={type} className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100/80 flex justify-between items-center">
                  <span className="text-xs text-slate-600 capitalize">{type}</span>
                  <span className="text-xs font-medium text-indigo-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Data Stats */}
      {hasData && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Rows: <span className="font-medium text-slate-600">{csvData.length}</span></span>
            <span>Columns: <span className="font-medium text-slate-600">{csvHeaders.length}</span></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;