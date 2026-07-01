import React from 'react';

const TextControls = ({ component, onUpdate }) => {
  const updateProp = (key, value) => {
    onUpdate({ [key]: value });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Edit Text Content</label>
        <textarea
          value={component.props.value || ''}
          onChange={(e) => updateProp('value', e.target.value)}
          className="w-full text-xs border border-slate-200 bg-slate-50/40 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none h-20 resize-none transition-all duration-200"
        />
      </div>

      <div>
        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Family</label>
        <select
          value={component.props.fontFamily || 'Arial'}
          onChange={(e) => updateProp('fontFamily', e.target.value)}
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
          {['left', 'center', 'right', 'justify'].map((align) => {
            const isActive = (component.props.align || 'left') === align;
            const iconMap = { left: 'fa-align-left', center: 'fa-align-center', right: 'fa-align-right', justify: 'fa-align-justify' };
            return (
              <button
                key={align}
                type="button"
                onClick={() => updateProp('align', align)}
                className={`py-1.5 rounded-lg text-xs transition-all duration-200 ${
                  isActive ? 'bg-white text-indigo-600 shadow-3xs font-bold border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <i className={`fa-solid ${iconMap[align]}`}></i>
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
            value={component.props.color || '#1e293b'}
            onChange={(e) => updateProp('color', e.target.value)}
            className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer overflow-hidden bg-transparent transform hover:scale-105 transition-transform"
          />
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{component.props.color || '#1e293b'}</span>
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Font Scale (px)</label>
        <input
          type="number"
          value={component.props.fontSize || 16}
          onChange={(e) => updateProp('fontSize', parseInt(e.target.value) || 12)}
          className="w-full text-xs font-bold border border-slate-300 bg-slate-50 rounded-xl p-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-mono transition-all shadow-3xs"
        />
      </div>

      <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/60 transition-colors">
        <input
          type="checkbox"
          checked={component.props.bold || false}
          onChange={(e) => updateProp('bold', e.target.checked)}
          className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 bg-white shadow-3xs"
        />
        <span className="text-xs font-medium text-slate-700">Apply Bold Weight</span>
      </label>
    </div>
  );
};

export default TextControls;