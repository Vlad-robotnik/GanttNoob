import React from 'react';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const { projectId } = useParams();
  const location = useLocation();

  // Определяем базовый путь на основе текущего URL
  const getBasePath = () => {
    const currentPath = location.pathname;
    
    // Ищем паттерн /{projectId}/current-project в URL
    const match = currentPath.match(/^\/([^\/]+)\/current-project/);
    
    if (match) {
      // Если найден projectId в URL, используем его
      const extractedProjectId = match[1];
      return `/${extractedProjectId}/current-project`;
    }
    
    // Если projectId есть в параметрах роута
    if (projectId) {
      return `/${projectId}/current-project`;
    }
    
    // Fallback к обычному пути
    return '/current-project';
  };

  const basePath = getBasePath();

  const navItems = [
    { label: "Диаграмма", path: `${basePath}/diagram` },
    { label: "Доска", path: `${basePath}/board` },
    { label: "Список", path: `${basePath}/list` },
    { label: "Календарь", path: `${basePath}/calendar` },
    { label: "Загрузка ресурсов", path: `${basePath}/resource` },
    { label: "Люди", path: `${basePath}/people` },
    { label: "Дашборд", path: `${basePath}/dashboard` },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__content">
        <ul className="navbar__menu">
          {navItems.map((item) => (
            <li key={item.path} className="navbar__item">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                <span className="navbar__label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;