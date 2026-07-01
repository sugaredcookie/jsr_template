import React from 'react';

const Sidebar = ({ csvFileName, csvHeaders, components }) => {
  return (
    <div className="w-72 bg-white/70 backdrop-blur-md border-r border-slate-200 flex flex-col shadow-3xs">
      {/* Active Document */}
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

      {/* Parser Tokens */}
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

      {/* Component Count */}
      <div className="p-4 border-t border-slate-100 bg-white/40">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-slate-400"></i>
          <span>{components.length} component{components.length !== 1 ? 's' : ''} on canvas</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;