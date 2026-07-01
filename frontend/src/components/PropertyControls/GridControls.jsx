import React from 'react';

const GridControls = ({ component, onUpdate, csvHeaders }) => {
  const updateGridItem = (index, key, value) => {
    const copyItems = [...component.props.gridItems];
    copyItems[index] = { ...copyItems[index], [key]: value };
    onUpdate({ gridItems: copyItems });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-100 pb-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Infographic Sub-Cards</label>
        <p className="text-[10px] text-slate-400 mt-1">Configure layout parameters for each item nested inside this tracking row grid layout container.</p>
      </div>

      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
        {component.props.gridItems.map((item, idx) => (
          <div key={item.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-3xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Card Slot #{idx + 1}</span>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Display Metric Title</label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateGridItem(idx, 'title', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none text-slate-700 font-semibold focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Column</label>
                <select
                  value={item.column}
                  onChange={(e) => updateGridItem(idx, 'column', e.target.value)}
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
                  onChange={(e) => updateGridItem(idx, 'operation', e.target.value)}
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
  );
};

export default GridControls;