import React, { createContext, useContext, useState } from 'react';

const CurrentProjectContext = createContext(null);

export const useCurrentProject = () => {
  const context = useContext(CurrentProjectContext);
  if (!context) {
    throw new Error('useCurrentProject must be used within CurrentProjectProvider');
  }
  return context;
};

export const CurrentProjectProvider = ({ children }) => {
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // Функция для обновления текущего проекта
  const updateCurrentProject = (projectId) => {
    console.log('Setting current project to:', projectId); // Добавляем логирование
    setCurrentProjectId(projectId);
    
   
  };

  const value = {
    currentProjectId,
    setCurrentProjectId: updateCurrentProject,
  };

  console.log('CurrentProjectProvider value:', value); // Добавляем логирование

  return (
    <CurrentProjectContext.Provider value={value}>
      {children}
    </CurrentProjectContext.Provider>
  );
};