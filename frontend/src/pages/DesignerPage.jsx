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
import CSVUploader from '../components/datasource/CSVUploader';
import DataPreview from '../components/datasource/DataPreview';

const DesignerPage = () => {
  // Project Context
  const { 
    currentProject, 
    currentData, 
    currentHeaders, 
    uploadCSV, 
    refreshData,
    loading: projectLoading 
  } = useProject();

  // CSV State - use project data if available
  const [csvData, setCsvData] = useState(currentData || []);
  const [csvHeaders, setCsvHeaders] = useState(currentHeaders || []);
  const [csvFileName, setCsvFileName] = useState('');

  // Update when project data changes
  useEffect(() => {
    if (currentData && currentData.length > 0) {
      setCsvData(currentData);
      setCsvHeaders(currentHeaders || Object.keys(currentData[0] || {}));
    }
  }, [currentData, currentHeaders]);

  // Global Workspace Theme Presets Engine State
  const [currentTheme, setCurrentTheme] = useState('silicon');

  // Components State
  const [components, setComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [nextId, setNextId] = useState(1);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hooks (Destructure the Word export pipeline alongside PDF and Excel formats here)
  const {
    isGenerating,
    previewHtml,
    isPreviewMode,
    generatePreview,
    exitPreview,
    downloadHtml,
    downloadPdf,   
    downloadXlsx,
    downloadDocx // 👈 Extracted native Word processing compiler pipeline
  } = useReportGenerator(csvData, components, currentTheme);

  const {
    draggedIdx,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useComponentDrag(components, setComponents);

  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle CSV Upload with Project Context
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);

    // Use project upload if project is selected
    if (currentProject) {
      try {
        await uploadCSV(file);
        // Data will be updated via context
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload CSV: ' + error.message);
      }
      return;
    }

    // Fallback to local parsing (backward compatibility)
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

  // Handle manual CSV upload for project
  const handleCSVUpload = async (file) => {
    try {
      await uploadCSV(file);
      setCsvFileName(file.name);
      alert('CSV uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload CSV: ' + error.message);
    }
  };

  // Determine if we should show project info
  const hasProject = !!currentProject;

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 font-sans antialiased select-none text-slate-800 ${isFullscreen && isPreviewMode ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* Top Toolbar */}
      <Topbar
        csvFileName={csvFileName}
        onFileUpload={handleFileUpload}
        onAddComponent={addComponent}
        onGeneratePreview={generatePreview}
        onExitPreview={exitPreview}
        onDownloadHtml={downloadHtml}
        onDownloadPdf={downloadPdf}   
        onDownloadXlsx={downloadXlsx} 
        onDownloadDocx={downloadDocx} // 👈 FIXED: Successfully wired Word document compilation parameter trigger link
        isGenerating={isGenerating}
        isPreviewMode={isPreviewMode}
        csvHeaders={csvHeaders}
        componentsCount={components.length}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        hasProject={hasProject}
        projectName={currentProject?.name}
        onToggleDataSource={() => setActiveTab(activeTab === 'designer' ? 'datasource' : 'designer')}
        showDataSource={activeTab === 'datasource'}
      />

      {/* Main Content */}
      {isPreviewMode && previewHtml ? (
        <PreviewPanel html={previewHtml} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar */}
          <Sidebar 
            csvFileName={csvFileName}
            csvHeaders={csvHeaders}
            components={components}
          />

          {/* Main Area - Designer or Data Source */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'designer' ? (
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
            ) : (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Project Info */}
                  {hasProject && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-500">Current Project</div>
                        <div className="text-lg font-semibold text-slate-800">{currentProject.name}</div>
                      </div>
                      <button
                        onClick={() => refreshData()}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                      </button>
                    </div>
                  )}

                  {/* CSV Uploader */}
                  <CSVUploader 
                    onUpload={handleCSVUpload}
                    loading={projectLoading}
                    currentHeaders={csvHeaders}
                  />

                  {/* Data Statistics */}
                  {csvData.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-slate-500">Total Records</div>
                        <div className="text-2xl font-bold text-slate-800">{csvData.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Columns</div>
                        <div className="text-2xl font-bold text-slate-800">{csvHeaders.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Project</div>
                        <div className="text-2xl font-bold text-slate-800">{hasProject ? '✅' : '❌'}</div>
                      </div>
                    </div>
                  )}

                  {/* Data Preview Toggle */}
                  {csvData.length > 0 && (
                    <button
                      onClick={() => setShowDataPreview(!showDataPreview)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-700">
                        {showDataPreview ? 'Hide' : 'Show'} Data Preview
                      </span>
                      <svg className={`w-5 h-5 text-slate-400 transition-transform ${showDataPreview ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Data Preview */}
                  {showDataPreview && <DataPreview data={csvData} />}
                </div>
              </div>
            )}
          </div>

          {/* Properties Panel */}
          {activeTab === 'designer' && (
            <PropertiesPanel
              selectedComponent={selectedComponent}
              onUpdateComponent={updateComponent}
              onDeleteComponent={deleteComponent}
              csvHeaders={csvHeaders}
              csvData={csvData}
              currentTheme={currentTheme}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DesignerPage;