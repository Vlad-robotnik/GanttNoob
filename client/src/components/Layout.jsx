import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../styles/layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Navbar показывается на всех страницах, содержащих 'current-project' в пути
  const showNavbar = location.pathname.includes('/current-project');

  return (
    <div className="app-layout">
      <Header />
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          {showNavbar && <Navbar />}
          <main className="app-content">
              {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;