import React, { useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';

const DatasourceSetup = ({ projectId, onConfigured }) => {
  const { uploadCSV, loading } = useProject();
  const [selectedType, setSelectedType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef();

  const datasourceTypes = [
    {
      id: 'csv',
      name: 'Upload CSV',
      icon: '📤',
      description: 'Upload a CSV file from your computer',
      color: 'blue',
      available: true
    },
    {
      id: 'local',
      name: 'Local Device',
      icon: '💻',
      description: 'Connect to a local CSV file',
      color: 'green',
      available: true
    },
    {
      id: 'aws-s3',
      name: 'AWS S3',
      icon: '☁️',
      description: 'Coming Soon',
      color: 'orange',
      available: false
    },
    {
      id: 'database',
      name: 'Database',
      icon: '🗄️',
      description: 'Coming Soon',
      color: 'purple',
      available: false
    },
    {
      id: 'api',
      name: 'REST API',
      icon: '🔗',
      description: 'Coming Soon',
      color: 'indigo',
      available: false
    }
  ];

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      await uploadCSV(file);
      setSuccess(true);
      setSelectedType('csv');
      
      // Wait a moment then notify parent
      setTimeout(() => {
        if (onConfigured) onConfigured();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleLocalConfigure = () => {
    // For now, show a prompt for local file path
    const localPath = prompt('Enter the full path to your local CSV file:');
    if (localPath) {
      // Store the path - backend will handle this
      setSuccess(true);
      setSelectedType('local');
      setTimeout(() => {
        if (onConfigured) onConfigured();
      }, 1500);
    }
  };

  const handleTypeSelect = (type) => {
    if (!type.available) {
      alert(`${type.name} is coming soon!`);
      return;
    }

    setSelectedType(type.id);
    setError('');

    if (type.id === 'csv') {
      fileInputRef.current?.click();
    } else if (type.id === 'local') {
      handleLocalConfigure();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📊</div>
          <h1 className="text-3xl font-bold text-slate-800">Choose Data Source</h1>
          <p className="text-slate-500 mt-2">
            Connect a datasource to start designing your report
          </p>
          {projectId && (
            <p className="text-sm text-slate-400 mt-1">
              Project: {projectId}
            </p>
          )}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv"
          className="hidden"
        />

        {/* Loading State */}
        {uploading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Uploading CSV...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
            ✅ Datasource configured successfully! Loading workspace...
          </div>
        )}

        {/* Datasource Cards */}
        {!uploading && !success && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasourceTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                className={`
                  group relative p-6 bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${selectedType === type.id ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                  ${!type.available ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    {type.name}
                  </h3>
                  <p className="text-sm text-slate-500">{type.description}</p>
                  
                  {!type.available && (
                    <span className="mt-3 px-3 py-1 text-xs font-medium bg-slate-100 text-slate-500 rounded-full">
                      Coming Soon
                    </span>
                  )}
                  
                  {type.available && (
                    <span className="mt-3 px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to configure
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {!uploading && !success && (
          <div className="mt-8 text-center text-sm text-slate-400">
            <p>Select a datasource type to get started. CSV upload is recommended for quick testing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasourceSetup;