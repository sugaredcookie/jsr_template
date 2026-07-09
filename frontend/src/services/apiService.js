const url = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseUrl = url;
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || errorJson.message || `HTTP error! status: ${response.status}`);
      } catch (e) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    return response.json();
  }

  // === PROJECT ENDPOINTS ===
  
  async getProjects() {
    const response = await fetch(`${this.baseUrl}/projects`);
    return this.handleResponse(response);
  }

  async createProject(data) {
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getProject(projectId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`);
    return this.handleResponse(response);
  }

  async updateProject(projectId, data) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async deleteProject(projectId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'DELETE'
    });
    return this.handleResponse(response);
  }

  // === TEMPLATE ENDPOINTS ===

  async getTemplates(projectId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/templates`);
    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error('Failed to fetch templates');
    }
    return response.json();
  }

  async createTemplate(projectId, templateData) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData)
    });
    return this.handleResponse(response);
  }

  async getTemplate(projectId, templateId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/templates/${templateId}`);
    return this.handleResponse(response);
  }

  async updateTemplate(projectId, templateId, templateData) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/templates/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData)
    });
    return this.handleResponse(response);
  }

  async deleteTemplate(projectId, templateId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/templates/${templateId}`, {
      method: 'DELETE'
    });
    return this.handleResponse(response);
  }

  // === DATASOURCE ENDPOINTS ===

  async uploadCSV(projectId, file) {
    const formData = new FormData();
    formData.append('csv', file);
    
    const response = await fetch(`${this.baseUrl}/${projectId}/upload`, {
      method: 'POST',
      body: formData
    });
    return this.handleResponse(response);
  }

  async getProjectData(projectId, fresh = false) {
    const response = await fetch(
      `${this.baseUrl}/${projectId}/data?fresh=${fresh}`
    );
    return this.handleResponse(response);
  }

  async getDatasourceConfig(projectId) {
    const response = await fetch(`${this.baseUrl}/${projectId}/datasource`);
    return this.handleResponse(response);
  }

  async updateDatasourceConfig(projectId, config) {
    const response = await fetch(`${this.baseUrl}/${projectId}/datasource`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return this.handleResponse(response);
  }

  async getDatasourceStatus(projectId) {
    const response = await fetch(`${this.baseUrl}/${projectId}/datasource/status`);
    return this.handleResponse(response);
  }

  // === REPORT ENDPOINTS ===

  async generateHTML(projectId, template, templateId = null, reportName = null) {
    // Ensure template is serializable
    const serializableTemplate = JSON.parse(JSON.stringify(template));
    
    const response = await fetch(`${this.baseUrl}/reports/html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectId, 
        template: serializableTemplate,
        templateId,
        reportName: reportName || `Report ${new Date().toISOString()}`
      })
    });
    return this.handleResponse(response);
  }

  async generatePDF(projectId, template, templateId = null, reportName = null, options = {}) {
    // Ensure template is serializable
    const serializableTemplate = JSON.parse(JSON.stringify(template));
    
    const response = await fetch(`${this.baseUrl}/reports/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectId, 
        template: serializableTemplate,
        templateId,
        reportName: reportName || `Report ${new Date().toISOString()}`,
        options 
      })
    });
    return this.handleResponse(response);
  }

  async generatePDFFromHTML(projectId, html) {
    const response = await fetch(`${this.baseUrl}/reports/pdf-from-html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, html })
    });
    return this.handleResponse(response);
  }

  async previewReport(projectId, template) {
    // Ensure template is serializable
    const serializableTemplate = JSON.parse(JSON.stringify(template));
    
    const response = await fetch(`${this.baseUrl}/reports/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectId, 
        template: serializableTemplate 
      })
    });
    return this.handleResponse(response);
}

  async getProjectReports(projectId) {
    const response = await fetch(`${this.baseUrl}/reports/${projectId}/reports`);
    return this.handleResponse(response);
  }

  async getReport(projectId, reportId) {
    const response = await fetch(`${this.baseUrl}/reports/${projectId}/reports/${reportId}`);
    return this.handleResponse(response);
  }

  async deleteReport(projectId, reportId) {
    const response = await fetch(`${this.baseUrl}/reports/${projectId}/reports/${reportId}`, {
      method: 'DELETE'
    });
    return this.handleResponse(response);
  }

  // === DATABASE ENDPOINTS ===

async testDatabaseConnection(projectId, config) {
  try {
    const response = await fetch(`${this.baseUrl}/${projectId}/datasource/database/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    console.error('Test database connection error:', error);
    throw error;
  }
}

  async getDatabaseTables(projectId, filePath) {
    try {
      const url = `${this.baseUrl}/${projectId}/datasource/database/tables${filePath ? `?filePath=${encodeURIComponent(filePath)}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      console.error('Get database tables error:', error);
      throw error;
    }
  }

  async configureDatabase(projectId, config) {
    try {
      const response = await fetch(`${this.baseUrl}/${projectId}/datasource/database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      console.error('Configure database error:', error);
      throw error;
    }
  }
}

export default new ApiService();