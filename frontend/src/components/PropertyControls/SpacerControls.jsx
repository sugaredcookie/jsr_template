import React from 'react';

const SpacerControls = ({ component, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Spacer Variant Style</label>
        <div className="grid grid-cols-2 gap-1 bg-slate-50 border p-1 rounded-xl">
          {[
            { key: 'line', label: 'Solid Line' },
            { key: 'space', label: 'Blank Space' }
          ].map((v) => {
            const isActive = (component.props.variant || 'line') === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => onUpdate({ variant: v.key })}
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
          value={component.props.height || 24}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 10 })}
          className="w-full text-xs border border-slate-200 bg-slate-50/30 rounded-xl p-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-mono font-bold transition-all"
        />
      </div>
    </div>
  );
};

export default SpacerControls;