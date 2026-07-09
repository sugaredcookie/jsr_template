import { useState, useCallback } from 'react';
import { buildPreviewHtml } from '../utils/htmlBuilder';
import html2pdf from 'html2pdf.js';
import apiService from '../services/apiService';

export const useReportGenerator = (csvData, components, currentTheme) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Helper utility to construct polished corporate download strings
  const getProfessionalFilename = useCallback((extension) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const themeLabel = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
    return `Executive_Report_${themeLabel}_${timestamp}.${extension}`;
  }, [currentTheme]);

  // Helper to serialize components for API
  const serializeComponents = useCallback((comps) => {
    return comps.map(comp => ({
      id: comp.id,
      type: comp.type,
      props: {
        value: comp.props?.value || '',
        fontSize: comp.props?.fontSize || 16,
        bold: comp.props?.bold || false,
        align: comp.props?.align || 'left',
        color: comp.props?.color || '#1e293b',
        fontFamily: comp.props?.fontFamily || 'Arial',
        columns: comp.props?.columns || [],
        columnMetadata: comp.props?.columnMetadata || {},
        highlightRule: comp.props?.highlightRule || null,
        repeatHeaderOnPageBreak: comp.props?.repeatHeaderOnPageBreak || false,
        height: comp.props?.height || 24,
        variant: comp.props?.variant || 'line',
        columnsCount: comp.props?.columnsCount || 2,
        gridItems: comp.props?.gridItems || [],
        title: comp.props?.title || '',
        chartType: comp.props?.chartType || 'bar',
        xAxisColumn: comp.props?.xAxisColumn || '',
        yAxisColumn: comp.props?.yAxisColumn || '',
        operation: comp.props?.operation || 'COUNT'
      }
    }));
  }, []);

  // Generate Preview - ORIGINAL WORKING IMPLEMENTATION
  const generatePreview = useCallback(async () => {
    if (!csvData.length) {
      alert('Please upload a CSV file first.');
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const compiledHtml = buildPreviewHtml(components, csvData, currentTheme);
      setPreviewHtml(compiledHtml);
      setIsPreviewMode(true);
      setIsGenerating(false);
    }, 800);
  }, [csvData, components, currentTheme]);

  const exitPreview = useCallback(() => {
    setIsPreviewMode(false);
  }, []);

  // Format 1: Traditional HTML Download
  const downloadHtml = useCallback(() => {
    if (!previewHtml) {
      alert("Generate preview first");
      return;
    }

    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getProfessionalFilename('html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [previewHtml, getProfessionalFilename]);

  // Format 2: Fixed html2pdf Rendering Engine Pipeline capturing iframe DOM streams
  const downloadPdf = useCallback(() => {
    if (!previewHtml) {
      alert("Generate preview first");
      return;
    }

    // Try multiple ways to get the iframe content
    let targetElement = null;
    let iframeTarget = null;
    
    // Try by ID first
    iframeTarget = document.getElementById('report-preview-iframe');
    
    // If not found, try by class or other selectors
    if (!iframeTarget) {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          // Check if this iframe contains our preview content
          const doc = iframe.contentWindow?.document;
          if (doc && doc.body && doc.body.innerHTML.includes('Report Preview')) {
            iframeTarget = iframe;
            break;
          }
        } catch (e) {
          // Skip cross-origin iframes
          continue;
        }
      }
    }

    // If still not found, try to find by checking if there's content
    if (!iframeTarget) {
      // Fallback: get the preview container directly
      const previewContainer = document.querySelector('.preview-container') || 
                              document.querySelector('[class*="preview"]');
      if (previewContainer) {
        // Create a temporary div with the preview content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = previewHtml;
        targetElement = tempDiv;
      } else {
        alert("Could not find preview content. Please generate preview first.");
        return;
      }
    } else {
      // Get the body from the iframe
      try {
        targetElement = iframeTarget.contentWindow?.document?.body;
      } catch (e) {
        console.error("Could not access iframe content:", e);
        alert("Could not access preview content. Please generate preview first.");
        return;
      }
    }

    if (!targetElement) {
      alert("Render pipeline synchronization exception: Could not capture active document frame context.");
      return;
    }

    // If we have a temporary div, we need to convert it
    let elementToRender = targetElement;
    if (targetElement.tagName === 'DIV' && !targetElement.isConnected) {
      // It's a detached div, create a container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.background = 'white';
      container.style.padding = '40px';
      container.style.width = '1000px';
      container.innerHTML = targetElement.innerHTML;
      document.body.appendChild(container);
      elementToRender = container;
      
      // Clean up after a delay
      setTimeout(() => {
        if (container.parentNode) {
          document.body.removeChild(container);
        }
      }, 10000);
    }

    const options = {
      margin: 12,
      filename: getProfessionalFilename('pdf'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        width: 1100
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Fire compiler directly on the isolated internal iframe graphics stream
    html2pdf()
      .from(elementToRender)
      .set(options)
      .save()
      .catch((err) => {
        console.error("PDF generation pipeline encountered an error:", err);
        alert("PDF generation failed. Please try again.");
      });
  }, [previewHtml, getProfessionalFilename]);

  // Format 3: Zero-Dependency Native Excel Workbook Matrix Compilation
  const downloadXlsx = useCallback(() => {
    if (!csvData || csvData.length === 0) {
      alert("No data available to compile.");
      return;
    }

    const tableComponent = components.find(c => c.type === 'table');
    let targetHeaders = Object.keys(csvData[0]);

    if (tableComponent && tableComponent.props?.columns) {
      const { columns, columnMetadata = {} } = tableComponent.props;
      targetHeaders = columns.filter(col => !columnMetadata[col]?.hidden);
    }

    const headerRowStr = targetHeaders.join('\t');
    const dataRowsStr = csvData.map(row => {
      return targetHeaders.map(header => {
        const value = row[header] !== undefined && row[header] !== null ? row[header] : '';
        return String(value).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
      }).join('\t');
    }).join('\n');

    const totalWorkbookContent = `${headerRowStr}\n${dataRowsStr}`;

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), totalWorkbookContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getProfessionalFilename('xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [csvData, components, getProfessionalFilename]);

  // Format 4: Zero-Dependency Native Word Document Engine Pipeline
  const downloadDocx = useCallback(async () => {
    if (!previewHtml) {
      alert("Generate preview first");
      return;
    }

    let iframeTarget = document.getElementById('report-preview-iframe');
    let iframeDoc = null;

    // If not found by ID, try to find any iframe with our content
    if (!iframeTarget) {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          const doc = iframe.contentWindow?.document;
          if (doc && doc.body && doc.body.innerHTML.includes('Report Preview')) {
            iframeTarget = iframe;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Try to get the document
    if (iframeTarget) {
      try {
        iframeDoc = iframeTarget.contentWindow?.document;
      } catch (e) {
        console.error("Could not access iframe document:", e);
      }
    }

    // If we still don't have a document, build from previewHtml
    if (!iframeDoc || !iframeDoc.body) {
      // Create a temporary DOM element with the preview content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = previewHtml;
      
      // Extract body content
      const bodyContent = tempDiv.querySelector('body') || tempDiv;
      
      // Build the Word document directly from the HTML
      const wordDocumentWrapper = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            @page WordSection1 { size: 841.9pt 595.3pt; margin: 36pt; }
            div.WordSection1 { page: WordSection1; }
            table { width: 100% !important; border-collapse: collapse; }
            td, th { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10pt; }
            th { background-color: #f1f5f9; font-weight: bold; }
            img { max-width: 600px; height: auto; display: block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="WordSection1">${bodyContent.innerHTML}</div>
        </body>
        </html>
      `;

      const blob = new Blob([wordDocumentWrapper], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getProfessionalFilename('doc');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    // If we have the iframe document, use the original method
    // 1. Clone the live body
    const clonedBody = iframeDoc.body.cloneNode(true);

    // 2. Select live canvases from the ORIGINAL iframe document
    const liveCanvases = iframeDoc.getElementsByTagName('canvas');
    // 3. Select the target canvases in the CLONE that need to be replaced
    const clonedCanvases = clonedBody.getElementsByTagName('canvas');

    // 4. Iterate through the live canvases to capture their pixel data
    for (let i = 0; i < liveCanvases.length; i++) {
      try {
        const liveCanvas = liveCanvases[i];
        const cloneCanvas = clonedCanvases[i];

        if (liveCanvas && cloneCanvas) {
          // Capture the visual state from the LIVE canvas
          const dataURL = liveCanvas.toDataURL('image/png');

          // Create an image tag
          const img = document.createElement('img');
          img.src = dataURL;
          img.style.width = '100%';
          img.style.maxWidth = '600px';

          // Replace the canvas in the CLONE with the img
          cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
        }
      } catch (e) {
        console.error("Canvas export failed:", e);
      }
    }

    // 5. Build the Word document with the processed clone
    const wordDocumentWrapper = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          @page WordSection1 { size: 841.9pt 595.3pt; margin: 36pt; }
          div.WordSection1 { page: WordSection1; }
          table { width: 100% !important; border-collapse: collapse; }
          td, th { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10pt; }
          th { background-color: #f1f5f9; font-weight: bold; }
          img { max-width: 600px; height: auto; display: block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="WordSection1">${clonedBody.innerHTML}</div>
      </body>
      </html>
    `;

    const blob = new Blob([wordDocumentWrapper], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getProfessionalFilename('doc');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [previewHtml, getProfessionalFilename]);

  // === NEW: SAVE TEMPLATE - Supports both create and update ===
  const saveTemplate = useCallback(async (projectId, name, templateComponents, theme, templateId = null) => {
    if (!projectId) {
      console.warn('No project ID provided for template save');
      return null;
    }
    
    if (!name) {
      alert('Please provide a template name');
      return null;
    }
    
    setIsGenerating(true);
    try {
      const serializedComponents = serializeComponents(templateComponents || components);
      
      let result;
      if (templateId) {
        result = await apiService.updateTemplate(projectId, templateId, {
          name,
          components: serializedComponents,
          theme: theme || currentTheme
        });
        console.log('Template updated:', result);
      } else {
        result = await apiService.createTemplate(projectId, {
          name,
          components: serializedComponents,
          theme: theme || currentTheme
        });
        console.log('Template created:', result);
      }
      
      alert(result.message || 'Template saved successfully!');
      return result;
    } catch (error) {
      console.error('Template save failed:', error);
      alert('Failed to save template: ' + error.message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [components, currentTheme, serializeComponents]);

  return {
    isGenerating,
    previewHtml,
    isPreviewMode,
    generatePreview,
    exitPreview,
    downloadHtml,
    downloadPdf,
    downloadXlsx,
    downloadDocx,
    saveTemplate
  };
};