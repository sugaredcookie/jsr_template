import { useState, useCallback } from 'react';
import { buildPreviewHtml } from '../utils/htmlBuilder';
// Import html2pdf traditionally (ensure you run: npm install html2pdf.js)
import html2pdf from 'html2pdf.js';

export const useReportGenerator = (csvData, components, currentTheme) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Helper utility to construct polished corporate download strings
  const getProfessionalFilename = useCallback((extension) => {
    const timestamp = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const themeLabel = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
    return `Executive_Report_${themeLabel}_${timestamp}.${extension}`;
  }, [currentTheme]);

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

    // 1. Locate the sandboxed iframe element channel from the active viewport tree
    const iframeTarget = document.getElementById('report-preview-iframe');
    
    // 2. FIXED: Drill into its internal document content window body segment
    // This allows html2canvas to scrape layout vectors and painted charts directly from the active viewport.
    const targetElement = iframeTarget?.contentWindow?.document?.body;

    if (!targetElement) {
      alert("Render pipeline synchronization exception: Could not capture active document frame context.");
      return;
    }

    const options = {
      margin:       12,
      filename:     getProfessionalFilename('pdf'),
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 3. Fire compiler directly on the isolated internal iframe graphics stream
    html2pdf()
      .from(targetElement)
      .set(options)
      .save()
      .catch((err) => {
        console.error("PDF generation pipeline encountered an error:", err);
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

  return {
    isGenerating,
    previewHtml,
    isPreviewMode,
    generatePreview,
    exitPreview,
    downloadHtml,
    downloadPdf,
    downloadXlsx
  };
};