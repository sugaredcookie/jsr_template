import React from 'react';
import { getComponentIcon, getComponentLabel } from '../utils/evaluators.js';
import TextControls from './PropertyControls/TextControls';
import TableControls from './PropertyControls/TableControls';
import GridControls from './PropertyControls/GridControls';
import SpacerControls from './PropertyControls/SpacerControls';

const PropertiesPanel = ({ 
  selectedComponent, 
  onUpdateComponent, 
  onDeleteComponent,
  csvHeaders 
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
        return (
          <TableControls 
            component={selectedComponent} 
            onUpdate={(props) => onUpdateComponent(selectedComponent.id, props)}
            csvHeaders={csvHeaders}
          />
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