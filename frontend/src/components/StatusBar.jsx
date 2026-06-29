import React from 'react';

const StatusBar = ({ progress, error, onDismiss }) => {
  if (!progress && !error) return null;

  const getStatusClass = () => {
    if (error || progress?.status === 'error') return 'bg-red-100 text-red-700 border-red-300';
    if (progress?.status === 'success') return 'bg-green-100 text-green-700 border-green-300';
    if (progress?.status === 'loading') return 'bg-blue-100 text-blue-700 border-blue-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getIcon = () => {
    if (error || progress?.status === 'error') return '❌';
    if (progress?.status === 'success') return '✅';
    if (progress?.status === 'loading') return '⏳';
    return 'ℹ️';
  };

  return (
    <div className={`px-4 py-3 border rounded-md ${getStatusClass()} flex justify-between items-center`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{getIcon()}</span>
        <span className="font-medium">
          {error || progress?.message || 'Processing...'}
        </span>
      </div>
      <button 
        onClick={onDismiss}
        className="text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>
    </div>
  );
};

export default StatusBar;