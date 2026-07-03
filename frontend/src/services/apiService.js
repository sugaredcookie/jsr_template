const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseUrl = url;
  }

  // === PROJECT ENDPOINTS ===
  
  async getProjects() {
    const response = await fetch(`${this.baseUrl}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  }

  async createProject(data) {
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  }

  async getProject(projectId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  }

  async updateProject(projectId, data) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
  }

  async deleteProject(projectId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return response.json();
  }

  // === DATASOURCE ENDPOINTS ===

  async uploadCSV(projectId, file) {
    const formData = new FormData();
    formData.append('csv', file);
    
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload CSV');
    return response.json();
  }

  async getProjectData(projectId, fresh = false) {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/data?fresh=${fresh}`
    );
    if (!response.ok) throw new Error('Failed to fetch project data');
    return response.json();
  }

  async getDatasourceConfig(projectId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/datasource`);
    if (!response.ok) throw new Error('Failed to fetch datasource config');
    return response.json();
  }

  async updateDatasourceConfig(projectId, config) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/datasource`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Failed to update datasource config');
    return response.json();
  }

  // === TEMPLATE ENDPOINTS ===

  async getTemplates(projectId) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/templates`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  }

  async createTemplate(projectId, templateData) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData)
    });
    if (!response.ok) throw new Error('Failed to create template');
    return response.json();
  }

  // === REPORT ENDPOINTS ===

  async generateHTML(projectId, template) {
    const response = await fetch(`${this.baseUrl}/reports/html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, template })
    });
    if (!response.ok) throw new Error('Failed to generate HTML');
    return response.json();
  }

  async generatePDF(projectId, template, options = {}) {
    const response = await fetch(`${this.baseUrl}/reports/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, template, options })
    });
    if (!response.ok) throw new Error('Failed to generate PDF');
    return response.json();
  }

  async previewReport(projectId, template) {
    const response = await fetch(`${this.baseUrl}/reports/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, template })
    });
    if (!response.ok) throw new Error('Failed to preview report');
    return response.json();
  }

  async getProjectReports(projectId) {
    const response = await fetch(`${this.baseUrl}/reports/${projectId}/reports`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
  }
}

export default new ApiService();