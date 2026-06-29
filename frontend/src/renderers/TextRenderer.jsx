import React from 'react';

const TextRenderer = ({ value, fontSize = 16, bold = false }) => {
  return (
    <div 
      className="py-1 leading-relaxed text-gray-800 break-words min-h-[24px]"
      style={{
        fontSize: `${fontSize}px`,
        fontWeight: bold ? 'bold' : 'normal'
      }}
    >
      {value || 'Empty text'}
    </div>
  );
};

export default TextRenderer;