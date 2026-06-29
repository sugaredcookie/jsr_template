import React from 'react';

const TableRenderer = ({ columns = [], csvData = [] }) => {
  if (!columns || columns.length === 0) {
    return (
      <div className="p-5 text-center text-gray-400 bg-gray-50 rounded">
        <p>No columns selected</p>
      </div>
    );
  }

  const displayData = csvData.slice(0, 10);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-3 py-2.5 text-left font-semibold text-gray-700 border-b-2 border-gray-200 bg-gray-50">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.length > 0 ? (
            displayData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-3 py-2 border-b border-gray-100 text-gray-600">
                    {row[col] || '-'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center text-gray-400 py-5">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {csvData.length > 10 && (
        <div className="mt-2 text-xs text-gray-400 text-right">
          Showing first 10 of {csvData.length} rows
        </div>
      )}
    </div>
  );
};

export default TableRenderer;