import React, { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import DesignerPage from './pages/DesignerPage';
import ProjectDashboard from './components/projects/ProjectDashboard';

function App() {
  const [showProjectSelector, setShowProjectSelector] = useState(true);

  const handleSelectProject = (projectId) => {
    setShowProjectSelector(false);
  };

  const handleBackToProjects = () => {
    setShowProjectSelector(true);
  };

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20">
        {showProjectSelector ? (
          <ProjectDashboard onSelectProject={handleSelectProject} />
        ) : (
          <DesignerPage onBackToProjects={handleBackToProjects} />
        )}
      </div>
    </ProjectProvider>
  );
}

export default App;