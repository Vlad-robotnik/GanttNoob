import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useRoutes } from './routes';
import { useAuth } from './hooks/auth.hook';
import { AuthContext } from './context/AuthContext';
import  {CurrentProjectProvider}  from './context/CurrentProjectContext'; // Добавляем импорт
import  Layout  from './components/Layout';
import 'materialize-css';


function App() {
  const { token, login, logout, userId, userData } = useAuth(); // Добавляем userData
  const isAuthenticated = !!token;
  const routes = useRoutes(isAuthenticated);

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        userId,
        userData, // Добавляем userData
        isAuthenticated,
      }}
    >
      <CurrentProjectProvider>
        <Router>
          {isAuthenticated ? (
            <Layout> 
              {routes}
            </Layout>
          ) : (
            <>{routes}</> 
          )}
        </Router>
      </CurrentProjectProvider>
    </AuthContext.Provider>
  );
}

export default App;