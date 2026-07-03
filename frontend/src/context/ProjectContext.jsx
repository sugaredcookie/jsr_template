import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [currentData, setCurrentData] = useState([]);
  const [currentHeaders, setCurrentHeaders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasDatasource, setHasDatasource] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await apiService.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectProject = async (projectId) => {
    setLoading(true);
    try {
      // Get project details
      const project = await apiService.getProject(projectId);
      setCurrentProject(project);

      // Check datasource status first
      try {
        const status = await apiService.getDatasourceStatus(projectId);
        setHasDatasource(status.configured);
        
        // Only fetch data if datasource is configured
        if (status.configured) {
          const dataResponse = await apiService.getProjectData(projectId);
          const data = dataResponse.data || [];
          setCurrentData(data);
          setCurrentHeaders(data.length > 0 ? Object.keys(data[0]) : []);
        } else {
          setCurrentData([]);
          setCurrentHeaders([]);
        }
      } catch (err) {
        console.warn('Failed to get datasource status:', err);
        setHasDatasource(false);
        setCurrentData([]);
        setCurrentHeaders([]);
      }

      // Get templates
      try {
        const templatesData = await apiService.getTemplates(projectId);
        setTemplates(templatesData);
      } catch (err) {
        setTemplates([]);
      }

      setError(null);
      return project;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData) => {
    setLoading(true);
    try {
      const newProject = await apiService.createProject(projectData);
      setProjects([...projects, newProject]);
      setError(null);
      return newProject;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    setLoading(true);
    try {
      await apiService.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setCurrentData([]);
        setCurrentHeaders([]);
        setHasDatasource(false);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadCSV = async (file) => {
    if (!currentProject) throw new Error('No project selected');
    
    setLoading(true);
    try {
      const result = await apiService.uploadCSV(currentProject.id, file);
      setHasDatasource(true);
      
      // Refresh data after upload
      const dataResponse = await apiService.getProjectData(currentProject.id, true);
      const data = dataResponse.data || [];
      setCurrentData(data);
      setCurrentHeaders(data.length > 0 ? Object.keys(data[0]) : []);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!currentProject) throw new Error('No project selected');
    
    setLoading(true);
    try {
      if (hasDatasource) {
        const dataResponse = await apiService.getProjectData(currentProject.id, true);
        const data = dataResponse.data || [];
        setCurrentData(data);
        setCurrentHeaders(data.length > 0 ? Object.keys(data[0]) : []);
      }
      setError(null);
      return currentData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (templateData) => {
    if (!currentProject) throw new Error('No project selected');
    
    setLoading(true);
    try {
      const result = await apiService.createTemplate(currentProject.id, templateData);
      const templatesData = await apiService.getTemplates(currentProject.id);
      setTemplates(templatesData);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (template, format = 'html') => {
    if (!currentProject) throw new Error('No project selected');
    
    setLoading(true);
    try {
      let result;
      if (format === 'pdf') {
        result = await apiService.generatePDF(currentProject.id, template);
      } else {
        result = await apiService.generateHTML(currentProject.id, template);
      }
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const configureDatasource = async (type, config) => {
    if (!currentProject) throw new Error('No project selected');
    
    setLoading(true);
    try {
      const result = await apiService.updateDatasourceConfig(currentProject.id, { type, config });
      setHasDatasource(true);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    projects,
    currentProject,
    currentData,
    currentHeaders,
    templates,
    loading,
    error,
    hasDatasource,
    loadProjects,
    selectProject,
    createProject,
    deleteProject,
    uploadCSV,
    refreshData,
    saveTemplate,
    generateReport,
    configureDatasource,
    setCurrentProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};