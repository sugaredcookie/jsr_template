import { useState, useCallback } from 'react';
import { buildPreviewHtml } from '../utils/htmlBuilder';

export const useReportGenerator = (csvData, components) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const generatePreview = useCallback(async () => {
    if (!csvData.length) {
      alert('Please upload a CSV file first.');
      return;
    }
    
    setIsGenerating(true);

    // Simulate async generation with delay
    setTimeout(() => {
      const compiledHtml = buildPreviewHtml(components, csvData);
      setPreviewHtml(compiledHtml);
      setIsPreviewMode(true);
      setIsGenerating(false);
    }, 800);
  }, [csvData, components]);

  const exitPreview = useCallback(() => {
    setIsPreviewMode(false);
  }, []);

  const downloadHtml = useCallback(() => {
    if (!previewHtml) {
      alert("Generate preview first");
      return;
    }

    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "report.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [previewHtml]);

  return {
    isGenerating,
    previewHtml,
    isPreviewMode,
    generatePreview,
    exitPreview,
    downloadHtml
  };
};