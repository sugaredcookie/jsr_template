const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  async generatePreview(csvFile, templateJson) {
    try {
      // Validate inputs
      if (!csvFile) {
        throw new Error('CSV file is required');
      }
      
      if (!templateJson || !templateJson.components) {
        throw new Error('Valid template with components is required');
      }

      // Validate file type
      if (!csvFile.name.endsWith('.csv') && csvFile.type !== 'text/csv') {
        throw new Error('File must be a CSV');
      }

      // Validate file size (10MB limit)
      if (csvFile.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('templateJson', JSON.stringify(templateJson));

      const response = await fetch(`${API_BASE_URL}/report/generate`, {
        method: 'POST',
        body: formData,
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate preview');
      }

      if (!data.html) {
        throw new Error('No HTML received from server');
      }

      console.log('✅ Preview received, HTML length:', data.html.length);
      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Rethrow with user-friendly message
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to the server. Please ensure the backend is running.');
      }
      
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new ApiService();