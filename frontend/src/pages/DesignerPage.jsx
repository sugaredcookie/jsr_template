import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import Canvas from '../components/Canvas';
import PropertiesPanel from '../components/PropertiesPanel';
import PreviewPanel from '../components/PreviewPanel';
import apiService from '../services/apiService';

const DesignerPage = () => {
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [nextId, setNextId] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Handle CSV file upload
  const handleFileUpload = useCallback((file) => {
    setCsvFile(file);
    setGenerationProgress(null);
    setPreviewHtml(null);
    setIsPreviewMode(false);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          setCsvData(results.data);
          setGenerationProgress({
            status: 'success',
            message: `✅ Loaded ${results.data.length} rows with ${headers.length} columns`
          });
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setGenerationProgress({
          status: 'error',
          message: `❌ Failed to parse CSV: ${error.message}`
        });
      }
    });
  }, []);

  // Add a new component (text or table)
  const addComponent = useCallback((type) => {
    const newComponent = {
      id: nextId,
      type: type,
      props: type === 'text' 
        ? { value: 'Double click to edit', fontSize: 16, bold: false }
        : { columns: [] }
    };
    setComponents([...components, newComponent]);
    setNextId(nextId + 1);
    setPreviewHtml(null);
    setIsPreviewMode(false);
  }, [components, nextId]);

  // Update component properties
  const updateComponent = useCallback((id, newProps) => {
    setComponents(components.map(comp => 
      comp.id === id ? { ...comp, props: { ...comp.props, ...newProps } } : comp
    ));
    setPreviewHtml(null);
    setIsPreviewMode(false);
  }, [components]);

  // Delete a component
  const deleteComponent = useCallback((id) => {
    setComponents(components.filter(comp => comp.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
    setPreviewHtml(null);
    setIsPreviewMode(false);
  }, [components, selectedComponent]);

  // Select a component
  const handleSelectComponent = useCallback((component) => {
    setSelectedComponent(component);
  }, []);

  // Edit text component content
  const handleTextEdit = useCallback((id, newValue) => {
    setComponents(components.map(comp =>
      comp.id === id && comp.type === 'text'
        ? { ...comp, props: { ...comp.props, value: newValue } }
        : comp
    ));
    setPreviewHtml(null);
    setIsPreviewMode(false);
  }, [components]);

  // Generate HTML preview
  const handleGeneratePreview = useCallback(async () => {
    // Validate
    if (!csvFile) {
      setGenerationProgress({
        status: 'error',
        message: '❌ Please upload a CSV file first'
      });
      return;
    }

    if (components.length === 0) {
      setGenerationProgress({
        status: 'error',
        message: '❌ Please add at least one component to the report'
      });
      return;
    }

    // Check if any table component has columns selected
    const tableComponents = components.filter(c => c.type === 'table');
    const tablesWithoutColumns = tableComponents.filter(c => 
      !c.props.columns || c.props.columns.length === 0
    );

    if (tablesWithoutColumns.length > 0) {
      setGenerationProgress({
        status: 'error',
        message: `❌ Table component ${tablesWithoutColumns[0].id} has no columns selected`
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({
      status: 'loading',
      message: '🔄 Generating preview... Please wait'
    });

    try {
      // Prepare template JSON
      const template = { components };
      
      // Generate preview
      const result = await apiService.generatePreview(csvFile, template);
      
      console.log('Preview HTML received:', result.html.substring(0, 200) + '...');
      
      setPreviewHtml(result.html);
      setIsPreviewMode(true);
      
      setGenerationProgress({
        status: 'success',
        message: `✅ Preview generated successfully! ${result.rowCount} rows displayed`
      });

      return result;
    } catch (error) {
      console.error('Preview generation error:', error);
      setGenerationProgress({
        status: 'error',
        message: `❌ Failed to generate preview: ${error.message}`
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [csvFile, components]);

  // Go back to design mode
  const handleBackToDesign = useCallback(() => {
    setIsPreviewMode(false);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Topbar 
        onFileUpload={handleFileUpload}
        onAddText={() => addComponent('text')}
        onAddTable={() => addComponent('table')}
        onGeneratePreview={handleGeneratePreview}
        onBackToDesign={handleBackToDesign}
        csvHeaders={csvHeaders}
        isGenerating={isGenerating}
        generationProgress={generationProgress}
        componentsCount={components.length}
        isPreviewMode={isPreviewMode}
        hasPreview={!!previewHtml}
      />
      
      {isPreviewMode && previewHtml ? (
        <PreviewPanel 
          html={previewHtml}
          onBack={handleBackToDesign}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            csvHeaders={csvHeaders}
            components={components}
            onAddComponent={addComponent}
          />
          <Canvas 
            components={components}
            csvData={csvData}
            csvHeaders={csvHeaders}
            onSelectComponent={handleSelectComponent}
            selectedComponent={selectedComponent}
            onTextEdit={handleTextEdit}
            onDeleteComponent={deleteComponent}
          />
          <PropertiesPanel 
            selectedComponent={selectedComponent}
            csvHeaders={csvHeaders}
            onUpdateComponent={updateComponent}
            onDeleteComponent={deleteComponent}
          />
        </div>
      )}
    </div>
  );
};

export default DesignerPage;