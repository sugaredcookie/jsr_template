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

const DesignerPage = ({ onBackToProjects }) => {
  // Project Context
  const { 
    currentProject, 
    currentData, 
    currentHeaders, 
    uploadCSV, 
    refreshData,
    loading: projectLoading,
    hasDatasource,
    selectProject,
    templates: savedTemplates,
    loadTemplates,
    csvFileName, // Directly from context
    setCsvFileName // Setter for context
  } = useProject();

  // CSV State
  const [csvData, setCsvData] = useState(currentData || []);
  const [csvHeaders, setCsvHeaders] = useState(currentHeaders || []);

  // Template State
  const [templateName, setTemplateName] = useState('');
  const [currentTemplateId, setCurrentTemplateId] = useState(null);

  // UI State
  const [currentTheme, setCurrentTheme] = useState('silicon');
  const [components, setComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [nextId, setNextId] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

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
    downloadDocx,
    saveTemplate: saveTemplateHook,
  } = useReportGenerator(csvData, components, currentTheme);

  const {
    draggedIdx,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useComponentDrag(components, setComponents);

  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;

  // Load templates when project opens
  useEffect(() => {
    if (currentProject?.id) {
      loadTemplates(currentProject.id);
    }
  }, [currentProject?.id]);

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

  // Handle CSV Upload
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentProject) {
      try {
        await uploadCSV(file);
        // Set the filename in context
        setCsvFileName(file.name);
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
          setCsvFileName(file.name);
          updateComponentsWithHeaders(headers);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  }, [currentProject, uploadCSV, setCsvFileName]);

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

  // Add Component
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

  // Load Template
  const handleLoadTemplate = useCallback((template) => {
    if (!template) return;
    
    setIsLoadingTemplate(true);
    try {
      const loadedComponents = template.components || [];
      setComponents(loadedComponents);
      
      if (template.theme) {
        setCurrentTheme(template.theme);
      }
      
      setCurrentTemplateId(template.id);
      setTemplateName(template.name || '');
      
      const maxId = loadedComponents.reduce((max, comp) => Math.max(max, comp.id || 0), 0);
      setNextId(maxId + 1);
      
      setSelectedComponentId(null);
      setEditingId(null);
      
      console.log(`Loaded template: ${template.name} with ${loadedComponents.length} components`);
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('Failed to load template: ' + error.message);
    } finally {
      setIsLoadingTemplate(false);
    }
  }, []);

  // New Template
  const handleNewTemplate = useCallback(() => {
    if (components.length > 0 && !window.confirm('This will clear the current design. Continue?')) {
      return;
    }
    
    setComponents([]);
    setCurrentTheme('silicon');
    setCurrentTemplateId(null);
    setTemplateName('');
    setNextId(1);
    setSelectedComponentId(null);
    setEditingId(null);
  }, [components]);

  // Save Template
  const handleSaveTemplate = useCallback(async () => {
    if (!currentProject) {
      alert('No project selected');
      return;
    }

    const name = templateName.trim() || 'Untitled Template';
    const result = await saveTemplateHook(
      currentProject.id,
      name,
      components,
      currentTheme,
      currentTemplateId
    );

    if (result) {
      if (!currentTemplateId && result.template) {
        setCurrentTemplateId(result.template.id);
        setTemplateName(result.template.name);
      }
      await loadTemplates(currentProject.id);
    }
  }, [currentProject, templateName, components, currentTheme, currentTemplateId, saveTemplateHook, loadTemplates]);

  // Generate Preview
  const handleGeneratePreview = useCallback(() => {
    if (!currentProject) {
      alert('No project selected');
      return;
    }

    generatePreview(currentProject.id);
  }, [currentProject, generatePreview]);

  // Download HTML
  const handleDownloadHtml = useCallback(() => {
    if (!currentProject) return;
    downloadHtml(currentProject.id);
  }, [currentProject, downloadHtml]);

  // Download PDF
  const handleDownloadPdf = useCallback(() => {
    if (!currentProject) return;
    downloadPdf(currentProject.id);
  }, [currentProject, downloadPdf]);

  // Handle datasource configured
  const handleDatasourceConfigured = async () => {
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
      
      {/* Top Toolbar */}
      {!showDatasourceSetup && (
        <Topbar
          csvFileName={csvFileName}
          onFileUpload={handleFileUpload}
          onAddComponent={addComponent}
          onGeneratePreview={handleGeneratePreview}
          onExitPreview={exitPreview}
          onDownloadHtml={handleDownloadHtml}
          onDownloadPdf={handleDownloadPdf}
          onDownloadXlsx={downloadXlsx}
          onDownloadDocx={downloadDocx}
          isGenerating={isGenerating || isLoadingTemplate}
          isPreviewMode={isPreviewMode}
          componentsCount={components.length}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          hasProject={!!currentProject}
          projectName={currentProject?.name}
          onSaveTemplate={handleSaveTemplate}
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          templates={savedTemplates || []}
          onLoadTemplate={handleLoadTemplate}
          onNewTemplate={handleNewTemplate}
          currentTemplateId={currentTemplateId}
          onBackToProjects={onBackToProjects}
        />
      )}

      {/* Main Content */}
      {isPreviewMode && previewHtml ? (
        <PreviewPanel html={previewHtml} />
      ) : showDatasourceSetup ? (
        <div className="flex-1 overflow-y-auto">
          <DatasourceSetup 
            projectId={currentProject?.id}
            onConfigured={handleDatasourceConfigured}
          />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            csvFileName={csvFileName}
            csvHeaders={csvHeaders}
            components={components}
            csvData={csvData}
          />

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