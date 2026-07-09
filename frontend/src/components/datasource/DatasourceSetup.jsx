import React, { useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import apiService from '../../services/apiService';

const DatasourceSetup = ({ projectId, onConfigured }) => {
  const { uploadCSV, loading } = useProject();
  const [selectedType, setSelectedType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dbConfig, setDbConfig] = useState({
    type: 'sqlite',
    host: 'localhost',
    port: '',
    database: '',
    table: '',
    user: '',
    password: '',
    filePath: ''
  });
  const [testResult, setTestResult] = useState(null);
  const [tables, setTables] = useState([]);
  const [configuringDb, setConfiguringDb] = useState(false);
  const fileInputRef = useRef();

  const datasourceTypes = [
    {
      id: 'csv',
      name: 'Upload CSV',
      icon: 'fa-file-csv',
      description: 'Upload a CSV file from your computer',
      available: true
    },
    {
      id: 'local',
      name: 'Local Device',
      icon: 'fa-laptop',
      description: 'Connect to a local CSV file',
      available: true
    },
    {
      id: 'database',
      name: 'Database',
      icon: 'fa-database',
      description: 'Connect to a database',
      available: true
    },
    {
      id: 'aws-s3',
      name: 'AWS S3',
      icon: 'fa-cloud',
      description: 'Coming Soon',
      available: false
    },
    {
      id: 'api',
      name: 'REST API',
      icon: 'fa-code',
      description: 'Coming Soon',
      available: false
    }
  ];

  const dbTypes = [
    { id: 'sqlite', label: 'SQLite (File-based)', defaultPort: null, requiresFile: true },
    { id: 'mysql', label: 'MySQL / MariaDB', defaultPort: 3306, requiresFile: false },
    { id: 'postgres', label: 'PostgreSQL', defaultPort: 5432, requiresFile: false },
    { id: 'sqlserver', label: 'SQL Server', defaultPort: 1433, requiresFile: false }
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
    const localPath = prompt('Enter the full path to your local CSV file:');
    if (localPath) {
      setSuccess(true);
      setSelectedType('local');
      setTimeout(() => {
        if (onConfigured) onConfigured();
      }, 1500);
    }
  };

  const handleDbConfigChange = (e) => {
    const { name, value } = e.target;
    setDbConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleDbTypeChange = (type) => {
    const dbType = dbTypes.find(t => t.id === type);
    setDbConfig(prev => ({ 
      ...prev, 
      type: type,
      port: dbType?.defaultPort || '',
      filePath: type === 'sqlite' ? prev.filePath || '' : '',
      host: type === 'sqlite' ? '' : (prev.host || 'localhost'),
      database: type === 'sqlite' ? '' : (prev.database || ''),
      user: type === 'sqlite' ? '' : (prev.user || ''),
      password: type === 'sqlite' ? '' : (prev.password || '')
    }));
    setTestResult(null);
    setTables([]);
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    setError('');
    
    // Validate required fields
    const isSqlite = dbConfig.type === 'sqlite';
    
    if (isSqlite && !dbConfig.filePath) {
        setError('Please provide the SQLite database file path');
        return;
    }
    
    if (!isSqlite) {
        if (!dbConfig.host) { setError('Host is required'); return; }
        if (!dbConfig.database) { setError('Database name is required'); return; }
        if (!dbConfig.user) { setError('Username is required'); return; }
        if (!dbConfig.password) { setError('Password is required'); return; }
    }
    
    if (!dbConfig.table) {
        setError('Table name is required');
        return;
    }
    
    try {
        const result = await apiService.testDatabaseConnection(projectId, dbConfig);
        setTestResult(result);
        
        if (result.success) {
            // Fetch tables using query param
            try {
                const tablesResult = await apiService.getDatabaseTables(projectId, dbConfig.filePath);
                setTables(tablesResult.tables || []);
            } catch (err) {
                console.error('Failed to fetch tables:', err);
                // Don't block the flow if tables can't be fetched
            }
        }
    } catch (err) {
        setError(err.message || 'Failed to test connection');
    }
  };

  const handleConfigureDatabase = async () => {
    setConfiguringDb(true);
    setError('');
    
    try {
        const configToSend = {
            type: dbConfig.type,
            host: dbConfig.host || '',
            port: dbConfig.port || '',
            database: dbConfig.database || '',
            table: dbConfig.table,
            user: dbConfig.user || '',
            password: dbConfig.password || '',
            filePath: dbConfig.filePath || ''
        };
        
        const result = await apiService.configureDatabase(projectId, configToSend);
        setSuccess(true);
        setSelectedType('database');
        setTimeout(() => {
            if (onConfigured) onConfigured();
        }, 1500);
    } catch (err) {
        setError(err.message || 'Failed to configure database');
    } finally {
        setConfiguringDb(false);
    }
  };

  const handleTypeSelect = (type) => {
    if (!type.available) {
      alert(`${type.name} is coming soon!`);
      return;
    }

    setSelectedType(type.id);
    setError('');
    setTestResult(null);
    setTables([]);

    if (type.id === 'csv') {
      fileInputRef.current?.click();
    } else if (type.id === 'local') {
      handleLocalConfigure();
    } else if (type.id === 'database') {
      // Show database form
    }
  };

  const renderDbForm = () => {
    const isSqlite = dbConfig.type === 'sqlite';
    
    return (
      <div className="grid grid-cols-2 gap-4">
        {/* Database Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Database Type *
          </label>
          <select
            value={dbConfig.type}
            onChange={(e) => handleDbTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          >
            {dbTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* SQLite File Path or Host */}
        {isSqlite ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Database File Path *
            </label>
            <input
              type="text"
              name="filePath"
              value={dbConfig.filePath || ''}
              onChange={handleDbConfigChange}
              placeholder="C:/Users/username/data.db or ./database.db"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              Full path to your .db or .sqlite file
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Host *
              </label>
              <input
                type="text"
                name="host"
                value={dbConfig.host}
                onChange={handleDbConfigChange}
                placeholder="localhost or IP address"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Port *
              </label>
              <input
                type="number"
                name="port"
                value={dbConfig.port}
                onChange={handleDbConfigChange}
                placeholder="3306, 5432, etc."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
              />
            </div>
          </>
        )}

        {/* Database Name - Not needed for SQLite */}
        {!isSqlite && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Database Name *
            </label>
            <input
              type="text"
              name="database"
              value={dbConfig.database}
              onChange={handleDbConfigChange}
              placeholder="Database name"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>
        )}

        {/* Username - Not needed for SQLite */}
        {!isSqlite && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              name="user"
              value={dbConfig.user}
              onChange={handleDbConfigChange}
              placeholder="Database username"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>
        )}

        {/* Password - Not needed for SQLite */}
        {!isSqlite && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={dbConfig.password}
              onChange={handleDbConfigChange}
              placeholder="Database password"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>
        )}

        {/* Table Name */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Table Name *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="table"
              value={dbConfig.table}
              onChange={handleDbConfigChange}
              placeholder="Table name"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
            {testResult?.success && tables.length > 0 && (
              <select
                value={dbConfig.table}
                onChange={(e) => setDbConfig(prev => ({ ...prev, table: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
              >
                <option value="">Select table</option>
                {tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <i className="fa-solid fa-database text-white text-2xl"></i>
            </div>
          </div>
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <i className="fa-solid fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
            <i className="fa-solid fa-check-circle mr-2"></i>
            Datasource configured successfully! Loading workspace...
          </div>
        )}

        {/* Database Configuration Form */}
        {selectedType === 'database' && !success && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Database Connection
            </h3>
            
            {renderDbForm()}

            {/* Test Result */}
            {testResult && (
              <div className={`mt-4 p-3 rounded-xl text-sm ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <i className={`fa-solid ${testResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                {testResult.message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleTestConnection}
                disabled={configuringDb}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                <i className="fa-solid fa-plug mr-2"></i>
                Test Connection
              </button>
              <button
                onClick={handleConfigureDatabase}
                disabled={configuringDb || !testResult?.success}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
              >
                {configuringDb ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin mr-2"></i>
                    Configuring...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    Configure Database
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedType(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Datasource Cards */}
        {!selectedType && !uploading && !success && (
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
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-50 transition-colors">
                    <i className={`fa-solid ${type.icon} text-2xl ${type.available ? 'text-indigo-500' : 'text-slate-300'}`}></i>
                  </div>
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
        {!selectedType && !uploading && !success && (
          <div className="mt-8 text-center text-sm text-slate-400">
            <p>Select a datasource type to get started. CSV upload is recommended for quick testing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasourceSetup;