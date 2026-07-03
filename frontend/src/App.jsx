import React, { useState, useEffect } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import DesignerPage from './pages/DesignerPage';
import ProjectDashboard from './components/projects/ProjectDashboard';

function App() {
  const [showProjectSelector, setShowProjectSelector] = useState(true);
  const [error, setError] = useState(null);

  // Check if API is reachable
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('API not responding');
      } catch (err) {
        console.warn('API check failed:', err);
        // Don't show error to user, just log it
      }
    };
    checkApi();
  }, []);

  const handleSelectProject = (projectId) => {
    setShowProjectSelector(false);
  };

  const handleBackToProjects = () => {
    setShowProjectSelector(true);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <div className="text-6xl mb-4 text-center">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Something went wrong</h2>
          <p className="text-slate-600 text-center mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20">
        {showProjectSelector ? (
          <ProjectDashboard onSelectProject={handleSelectProject} />
        ) : (
          <div className="relative">
            <button
              onClick={handleBackToProjects}
              className="fixed top-4 left-4 z-50 px-4 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200 flex items-center gap-2 text-slate-700 hover:text-indigo-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Projects
            </button>
            <DesignerPage />
          </div>
        )}
      </div>
    </ProjectProvider>
  );
}

export default App;