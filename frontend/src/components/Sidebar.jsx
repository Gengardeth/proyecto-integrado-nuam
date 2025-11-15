import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/calificaciones', icon: '📋', label: 'Calificaciones' },
    { path: '/reportes', icon: '📈', label: 'Reportes' },
    { path: '/carga-masiva', icon: '📦', label: 'Carga Masiva' },
    { path: '/auditoria', icon: '🔍', label: 'Auditoría' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 25 L20 15 L20 35 Z" fill="#FF5722"/>
        </svg>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.rol}</div>
          </div>
        </div>
        <button onClick={logout} className="logout-button" title="Cerrar sesión">
          🚪
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
