import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';

const ProjectDashboard = ({ onSelectProject }) => {
  const { projects, loading, deleteProject, selectProject, createProject } = useProject();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async (projectId) => {
    try {
      await selectProject(projectId);
      if (onSelectProject) onSelectProject(projectId);
    } catch (err) {
      console.error('Failed to select project:', err);
      // Show error but don't prevent navigation
      alert(`Failed to load project: ${err.message}`);
    }
  };

  const handleDelete = async (projectId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
      } catch (err) {
        console.error('Failed to delete project:', err);
        alert(`Failed to delete project: ${err.message}`);
      }
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setError('Project name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const project = await createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim()
      });
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      
      // Auto-select the new project
      await selectProject(project.id);
      if (onSelectProject) onSelectProject(project.id);
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">📊 Report Management</h1>
            <p className="text-slate-500 mt-1">Select or create a project to start designing reports</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Project Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No projects yet</h3>
            <p className="text-slate-500">Create your first project to get started with report design</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelect(project.id)}
                className="group bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
                    Open Workspace →
                  </span>
                  <span className="text-xs text-slate-400">Click to design</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Create New Project</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description (optional)"
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isCreating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;