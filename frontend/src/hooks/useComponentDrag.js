import { useState, useCallback } from 'react';

export const useComponentDrag = (components, setComponents) => {
  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleDragStart = useCallback((idx) => {
    setDraggedIdx(idx);
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const updatedList = [...components];
    const itemToMove = updatedList[draggedIdx];
    updatedList.splice(draggedIdx, 1);
    updatedList.splice(idx, 0, itemToMove);

    setDraggedIdx(idx);
    setComponents(updatedList);
  }, [components, setComponents, draggedIdx]);

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null);
  }, []);

  return {
    draggedIdx,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  };
};