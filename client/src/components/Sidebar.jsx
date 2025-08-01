import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentProject } from '../context/CurrentProjectContext'; // Импортируем контекст
import '../styles/Sidebar.css';

import { 
  Users as TeamIcon, 
  FolderOpen, 
  Folders,
  Briefcase,
  CheckSquare,
  Users as ResourceIcon,
  MessageSquare,
  Settings as SettingsIcon
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProjectId } = useCurrentProject(); // Получаем текущий проект
  
  console.log('Sidebar - currentProjectId:', currentProjectId); // Отладка

  const handleCurrentProjectClick = (e) => {
    e.preventDefault(); // Предотвращаем стандартное поведение NavLink
    
    if (currentProjectId) {
      // Если есть текущий проект, переходим к нему
      navigate(`/${currentProjectId}/current-project/diagram`);
    } else {
      // Если нет текущего проекта, переходим к списку всех проектов
      navigate('/all-projects');
    }
  };

  const menuItems = [
    { 
      icon: FolderOpen, 
      label: "Текущий проект", 
      path: "/current-project",
      onClick: handleCurrentProjectClick // Добавляем обработчик клика
    },
    { icon: TeamIcon, label: "My team", path: "/team" },
    { icon: Folders, label: "Все проекты", path: "/all-projects" },
    { icon: Briefcase, label: "Портфели", path: "/portfolios" },
    { icon: CheckSquare, label: "Мои задачи", path: "/tasks" },
    { icon: ResourceIcon, label: "Загрузка ресурсов", path: "/resource" },
    { icon: MessageSquare, label: "Комментарии", path: "/comments" },
  ];

  return (
    <aside className="sidebar">
      {menuItems.map((item) => (
        <li key={item.path} className="sidebaritem">
          {item.onClick ? (
            // Для "Текущий проект" используем обычную ссылку с обработчиком
            <a
              href="#"
              onClick={item.onClick}
              className={`sidebarlink ${
                location.pathname.includes('/current-project') ? 'sidebarlink--active' : ''
              }`}
            >
              <item.icon size={18} className="sidebaricon" />
              <span className="sidebarlabel">
                {item.label}
                {!currentProjectId && (
                  <span className="text-gray-400 text-xs ml-1">(выберите проект)</span>
                )}
              </span>
            </a>
          ) : (
            // Для остальных пунктов используем NavLink как обычно
            <NavLink
              to={item.path}
              className={({ isActive }) => 
                `sidebarlink ${isActive ? 'sidebarlink--active' : ''}`
              }
            >
              <item.icon size={18} className="sidebaricon" />
              <span className="sidebarlabel">{item.label}</span>
            </NavLink>
          )}
        </li>
      ))}

      <div className="sidebarfooter">
        <NavLink 
          to="/settings" 
          className="sidebarlink"
        >
          <SettingsIcon size={18} className="sidebaricon" />
          <span className="sidebar__label">Настройки</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;