import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';  
import { AuthContext } from '../context/AuthContext';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import '../styles/Header.css'; // Подключаем стили

const Header = () => {
  const navigate = useNavigate();
  const { logout, userId, userData } = useContext(AuthContext);

  const handleLogout = (e) => {
    localStorage.removeItem('userData')
    e.preventDefault();
    logout();
    navigate('/login');
  };

  // Вычисляем имя пользователя сразу
  const userDisplayName = (() => {
    console.log('=== Debug getUserDisplayName ===');
    console.log('userData:', userData);
    console.log('userId:', userId);
    
    if (userData) {
      console.log('userData.firstName:', userData.firstName);
      console.log('userData.lastName:', userData.lastName);
      
      if (userData.firstName && userData.lastName) {
        return `${userData.firstName} ${userData.lastName}`;
      }
    }
    
    return `User #${userId}`;
  })();

  return (
    <header className="header">
      <div className="header__left">
        <NavLink to="/" className="header__logo">
          GanttNoob
        </NavLink>
      </div>

      <div className="header__right">
        <div className="header__user">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <span className="user-name">{userDisplayName}</span>
          <ChevronDown size={16} />
        </div>

        <button className="header__settings">
          <Settings size={20} />
        </button>

        <button onClick={handleLogout} className="header__logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};
export default Header;