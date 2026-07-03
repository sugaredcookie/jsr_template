import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import Canvas from '../components/Canvas';
import PropertiesPanel from '../components/PropertiesPanel';
import PreviewPanel from '../components/PreviewPanel';
import { useReportGenerator } from '../hooks/useReportGenerator';
import { useComponentDrag } from '../hooks/useComponentDrag';

const DesignerPage = () => {
  // CSV State
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');

  // Global Workspace Theme Presets Engine State
  const [currentTheme, setCurrentTheme] = useState('silicon'); // Options: 'silicon' | 'corporate' | 'editorial'

  // Components State
  const [components, setComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [nextId, setNextId] = useState(1);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hooks (Pass global theme variable context directly into the HTML Compiler Hook pipeline)
  const {
    isGenerating,
    previewHtml,
    isPreviewMode,
    generatePreview,
    exitPreview,
    downloadHtml
  } = useReportGenerator(csvData, components, currentTheme);

  const {
    draggedIdx,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useComponentDrag(components, setComponents);

  // Get selected component
  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle CSV Upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          setCsvData(results.data);

          // Update components with new headers
          setComponents(prev => prev.map(comp => {
            if (comp.type === 'table') {
              return { ...comp, props: { ...comp.props, columns: headers, columnMetadata: {} } };
            }
            if (comp.type === 'grid-row') {
              const updatedItems = comp.props.gridItems.map(item => ({
                ...item,
                column: item.column || headers[0]
              }));
              return { ...comp, props: { ...comp.props, gridItems: updatedItems } };
            }
            if (comp.type === 'chart') {
              return {
                ...comp,
                props: {
                  ...comp.props,
                  xAxisColumn: comp.props.xAxisColumn || headers[0] || '',
                  yAxisColumn: comp.props.operation !== 'COUNT' ? (comp.props.yAxisColumn || headers[0] || '') : ''
                }
              };
            }
            return comp;
          }));
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  }, []);

  // Add Component Factory Orchestration Engine
  const addComponent = useCallback((type) => {
    const currentId = nextId;
    let props = {};

    if (type === 'text') {
      props = { 
        value: 'Double click to edit me', 
        fontSize: 16, 
        bold: false,
        align: 'left',
        color: '#1e293b', 
        fontFamily: 'Arial'
      };
    } else if (type === 'table') {
      props = { 
        columns: csvHeaders.length > 0 ? csvHeaders : ['Column 1', 'Column 2', 'Column 3'], 
        columnMetadata: {}, 
        highlightRule: null 
      };
    } else if (type === 'spacer') {
      props = { height: 24, variant: 'line' };
    } else if (type === 'page-break') {
      props = {};
    } else if (type === 'grid-row') {
      props = {
        columnsCount: 2,
        gridItems: [
          { id: `metric-1-${currentId}`, title: 'Headcount Summary', column: csvHeaders[0] || '', operation: 'COUNT' },
          { id: `metric-2-${currentId}`, title: 'Performance Average', column: csvHeaders[0] || '', operation: 'AVG' }
        ]
      };
    } else if (type === 'chart') {
      props = {
        title: 'Analytical Chart Overview',
        chartType: 'bar',
        xAxisColumn: csvHeaders[0] || '',
        yAxisColumn: '',
        operation: 'COUNT'
      };
    }

    const newComponent = { id: currentId, type, props };
    setComponents(prev => [...prev, newComponent]);
    setNextId(prev => prev + 1);
    setSelectedComponentId(currentId);
  }, [nextId, csvHeaders]);

  // Update Component
  const updateComponent = useCallback((id, newProps) => {
    setComponents(prev => prev.map(comp =>
      comp.id === id ? { ...comp, props: { ...comp.props, ...newProps } } : comp
    ));
  }, []);

  // Delete Component
  const deleteComponent = useCallback((id) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    if (selectedComponentId === id) setSelectedComponentId(null);
    if (editingId === id) setEditingId(null);
  }, [selectedComponentId, editingId]);

  // Text Edit
  const handleTextEdit = useCallback((id, newValue) => {
    setComponents(prev => prev.map(comp =>
      comp.id === id && comp.type === 'text' ? { ...comp, props: { ...comp.props, value: newValue } } : comp
    ));
  }, []);

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 font-sans antialiased select-none text-slate-800 ${isFullscreen && isPreviewMode ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* Top Toolbar Shell Hook */}
      <Topbar
        csvFileName={csvFileName}
        onFileUpload={handleFileUpload}
        onAddComponent={addComponent}
        onGeneratePreview={generatePreview}
        onExitPreview={exitPreview}
        onDownloadHtml={downloadHtml}
        isGenerating={isGenerating}
        isPreviewMode={isPreviewMode}
        csvHeaders={csvHeaders}
        componentsCount={components.length}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        currentTheme={currentTheme} // 👈 Added theme state binding
        onThemeChange={setCurrentTheme} // 👈 Added theme control event hook
      />

      {/* Main Framework Content Panel Area */}
      {isPreviewMode && previewHtml ? (
        <PreviewPanel 
          html={previewHtml} 
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar */}
          <Sidebar 
            csvFileName={csvFileName}
            csvHeaders={csvHeaders}
            components={components}
          />

          {/* Canvas Component Stack Workspace */}
          <Canvas
            components={components}
            csvData={csvData}
            csvHeaders={csvHeaders}
            selectedComponentId={selectedComponentId}
            editingId={editingId}
            draggedIdx={draggedIdx}
            onSelectComponent={setSelectedComponentId}
            onEditComponent={setEditingId}
            onTextEdit={handleTextEdit}
            onDeleteComponent={deleteComponent}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            currentTheme={currentTheme} // 👈 Injected active workspace preset context
          />

          {/* Properties Panel Configuration Shell */}
          <PropertiesPanel
            selectedComponent={selectedComponent}
            onUpdateComponent={updateComponent}
            onDeleteComponent={deleteComponent}
            csvHeaders={csvHeaders}
            csvData={csvData}
            currentTheme={currentTheme}
          />
          
        </div>
      )}
    </div>
  );
};

export default DesignerPage;