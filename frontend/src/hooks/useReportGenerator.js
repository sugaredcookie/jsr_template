import { useState, useCallback } from 'react';
import apiService from '../services/apiService';

export const useReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generateReport = useCallback(async (csvFile, templateJson) => {
    setIsGenerating(true);
    setError(null);
    setProgress({
      status: 'loading',
      message: '🔄 Validating inputs...'
    });

    try {
      // Validate
      if (!csvFile) {
        throw new Error('Please upload a CSV file');
      }

      if (!templateJson || templateJson.components.length === 0) {
        throw new Error('Please add at least one component to the report');
      }

      // Check tables have columns
      const tablesWithoutColumns = templateJson.components
        .filter(c => c.type === 'table')
        .filter(c => !c.props.columns || c.props.columns.length === 0);

      if (tablesWithoutColumns.length > 0) {
        throw new Error(`Table component ${tablesWithoutColumns[0].id} has no columns selected`);
      }

      setProgress({
        status: 'loading',
        message: '🔄 Uploading data and generating report...'
      });

      // Generate report
      const result = await apiService.generateReport(csvFile, templateJson);
      
      setProgress({
        status: 'success',
        message: `✅ Report generated successfully! ${result.rowCount} rows processed`
      });
      
      setResult(result);
      
      // Auto-download
      setTimeout(() => {
        apiService.downloadReport(result.downloadUrl, `report-${result.reportId}.pdf`);
      }, 500);

      return result;
    } catch (error) {
      setError(error.message);
      setProgress({
        status: 'error',
        message: `❌ ${error.message}`
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setError(null);
    setResult(null);
    setIsGenerating(false);
  }, []);

  return {
    generateReport,
    isGenerating,
    progress,
    error,
    result,
    reset
  };
};