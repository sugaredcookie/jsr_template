import { useState, useCallback } from 'react';
import { buildPreviewHtml } from '../utils/htmlBuilder';
// Import html2pdf traditionally (ensure you run: npm install html2pdf.js)
import html2pdf from 'html2pdf.js';

export const useReportGenerator = (csvData, components, currentTheme) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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
    link.download = `report-${currentTheme}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [previewHtml, currentTheme]);

  // Format 2: Traditional html2pdf Rendering Engine Pipeline
  const downloadPdf = useCallback(() => {
    if (!previewHtml) {
      alert("Generate preview first");
      return;
    }

    // Create a sandbox wrapper element to cleanly mount our compiled markup string
    const element = document.createElement('div');
    element.innerHTML = previewHtml;
    document.body.appendChild(element);

    const options = {
      margin:       10,
      filename:     `compiled-report-${currentTheme}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Execute the runner and cleanly tear down the temporary element node afterward
    html2pdf()
      .from(element)
      .set(options)
      .save()
      .then(() => {
        document.body.removeChild(element);
      })
      .catch((err) => {
        console.error("PDF generation pipeline encountered an error:", err);
        document.body.removeChild(element);
      });
  }, [previewHtml, currentTheme]);

  // Format 3: Zero-Dependency Native Excel Workbook Matrix Compilation
  const downloadXlsx = useCallback(() => {
    if (!csvData || csvData.length === 0) {
      alert("No data available to compile.");
      return;
    }

    // Identify if there is an active table layout component to respect user visibility filters
    const tableComponent = components.find(c => c.type === 'table');
    let targetHeaders = Object.keys(csvData[0]);

    if (tableComponent && tableComponent.props?.columns) {
      const { columns, columnMetadata = {} } = tableComponent.props;
      // Filter down to visibility-approved columns matching your Canvas rules
      targetHeaders = columns.filter(col => !columnMetadata[col]?.hidden);
    }

    // Construct a standard, type-safe clean Tab-Separated Values string payload stream
    const headerRowStr = targetHeaders.join('\t');
    const dataRowsStr = csvData.map(row => {
      return targetHeaders.map(header => {
        const value = row[header] !== undefined && row[header] !== null ? row[header] : '';
        // Sanitize inner tabs/breaks to safeguard spreadsheet line geometry records
        return String(value).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
      }).join('\t');
    }).join('\n');

    const totalWorkbookContent = `${headerRowStr}\n${dataRowsStr}`;

    // Wrap with the formal UTF-16/Excel-friendly application/vnd.ms-excel blob signature
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), totalWorkbookContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report_dataset.xls`; // Native .xls format allows Excel to map vectors instantly
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [csvData, components]);

  return {
    isGenerating,
    previewHtml,
    isPreviewMode,
    generatePreview,
    exitPreview,
    downloadHtml,
    downloadPdf, // 👈 Exported clean PDF download stream driver
    downloadXlsx // 👈 Exported clean spreadsheet data driver
  };
};