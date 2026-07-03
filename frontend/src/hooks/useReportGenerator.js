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

    // 2. Drill into its internal document content window body segment
    const targetElement = iframeTarget?.contentWindow?.document?.body;

    if (!targetElement) {
      alert("Render pipeline synchronization exception: Could not capture active document frame context.");
      return;
    }

    const options = {
      margin: 12,
      filename: getProfessionalFilename('pdf'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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

  // Format 4: FIXED/ADDED: Zero-Dependency Native Word Document Engine Pipeline
  const downloadDocx = useCallback(async () => {
    const iframeTarget = document.getElementById('report-preview-iframe');
    const iframeDoc = iframeTarget?.contentWindow?.document;

    if (!iframeDoc) {
      alert("Please generate the preview first.");
      return;
    }

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

        // Capture the visual state from the LIVE canvas
        const dataURL = liveCanvas.toDataURL('image/png');

        // Create an image tag
        const img = document.createElement('img');
        img.src = dataURL;
        img.style.width = '100%';
        img.style.maxWidth = '600px';

        // Replace the canvas in the CLONE with the img
        cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
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
  }, [getProfessionalFilename]);

  return {
    isGenerating,
    previewHtml,
    isPreviewMode,
    generatePreview,
    exitPreview,
    downloadHtml,
    downloadPdf,
    downloadXlsx,
    downloadDocx // Exported clean Word file driver
  };
};