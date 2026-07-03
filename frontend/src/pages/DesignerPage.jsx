import React, { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import Canvas from '../components/Canvas';
import PropertiesPanel from '../components/PropertiesPanel';
import PreviewPanel from '../components/PreviewPanel';
import { useReportGenerator } from '../hooks/useReportGenerator';
import { useComponentDrag } from '../hooks/useComponentDrag';
import { useProject } from '../context/ProjectContext';
import DatasourceSetup from '../components/datasource/DatasourceSetup';

const DesignerPage = () => {
  // Project Context
  const { 
    currentProject, 
    currentData, 
    currentHeaders, 
    uploadCSV, 
    refreshData,
    loading: projectLoading,
    hasDatasource,
    selectProject
  } = useProject();

  // CSV State
  const [csvData, setCsvData] = useState(currentData || []);
  const [csvHeaders, setCsvHeaders] = useState(currentHeaders || []);
  const [csvFileName, setCsvFileName] = useState('');

  // UI State
  const [currentTheme, setCurrentTheme] = useState('silicon');
  const [components, setComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [nextId, setNextId] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);

  // Hooks
  const {
    isGenerating,
    previewHtml,
    isPreviewMode,
    generatePreview,
    exitPreview,
    downloadHtml,
    downloadPdf,
    downloadXlsx,
    downloadDocx
  } = useReportGenerator(csvData, components, currentTheme);

  const {
    draggedIdx,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useComponentDrag(components, setComponents);

  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;

  // Update when project data changes
  useEffect(() => {
    if (currentData && currentData.length > 0) {
      setCsvData(currentData);
      setCsvHeaders(currentHeaders || Object.keys(currentData[0] || {}));
    }
  }, [currentData, currentHeaders]);

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle CSV Upload with Project Context
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);

    if (currentProject) {
      try {
        await uploadCSV(file);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload CSV: ' + error.message);
      }
      return;
    }

    // Fallback to local parsing
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          setCsvData(results.data);
          updateComponentsWithHeaders(headers);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  }, [currentProject, uploadCSV]);

  const updateComponentsWithHeaders = (headers) => {
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
  };

  // Add Component Factory
  const addComponent = useCallback((type) => {
    const currentId = nextId;
    let props = {};

    const headers = csvHeaders.length > 0 ? csvHeaders : ['Column 1', 'Column 2', 'Column 3'];

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
        columns: headers, 
        columnMetadata: {}, 
        highlightRule: null,
        repeatHeaderOnPageBreak: false 
      };
    } else if (type === 'spacer') {
      props = { height: 24, variant: 'line' };
    } else if (type === 'page-break') {
      props = {};
    } else if (type === 'grid-row') {
      props = {
        columnsCount: 2,
        gridItems: [
          { id: `metric-1-${currentId}`, title: 'Headcount Summary', column: headers[0] || '', operation: 'COUNT' },
          { id: `metric-2-${currentId}`, title: 'Performance Average', column: headers[0] || '', operation: 'AVG' }
        ]
      };
    } else if (type === 'chart') {
      props = {
        title: 'Analytical Chart Overview',
        chartType: 'bar',
        xAxisColumn: headers[0] || '',
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

  // Handle successful datasource configuration
  const handleDatasourceConfigured = async () => {
    // Refresh project data after datasource is configured
    if (currentProject) {
      await selectProject(currentProject.id);
      if (refreshData) {
        await refreshData();
      }
    }
  };

  // Check if we should show datasource setup
  const showDatasourceSetup = !hasDatasource && currentProject;

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 font-sans antialiased select-none text-slate-800 ${isFullscreen && isPreviewMode ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* Top Toolbar - Only show if datasource is configured */}
      {!showDatasourceSetup && (
        <Topbar
          csvFileName={csvFileName}
          onFileUpload={handleFileUpload}
          onAddComponent={addComponent}
          onGeneratePreview={generatePreview}
          onExitPreview={exitPreview}
          onDownloadHtml={downloadHtml}
          onDownloadPdf={downloadPdf}
          onDownloadXlsx={downloadXlsx}
          onDownloadDocx={downloadDocx}
          isGenerating={isGenerating}
          isPreviewMode={isPreviewMode}
          csvHeaders={csvHeaders}
          componentsCount={components.length}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          hasProject={!!currentProject}
          projectName={currentProject?.name}
        />
      )}

      {/* Main Content */}
      {isPreviewMode && previewHtml ? (
        <PreviewPanel html={previewHtml} />
      ) : showDatasourceSetup ? (
        /* Datasource Setup View */
        <div className="flex-1 overflow-y-auto">
          <DatasourceSetup 
            projectId={currentProject?.id}
            onConfigured={handleDatasourceConfigured}
          />
        </div>
      ) : (
        /* Report Designer View */
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar 
            csvFileName={csvFileName}
            csvHeaders={csvHeaders}
            components={components}
          />

          {/* Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
              currentTheme={currentTheme}
            />
          </div>

          {/* Properties Panel */}
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