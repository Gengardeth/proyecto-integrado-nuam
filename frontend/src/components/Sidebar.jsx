import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import nuamLogo from '../assets/nuam-logo.svg';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Menú dinámico según el rol del usuario
  const getMenuItems = () => {
    const baseItems = [
      { path: '/', icon: '📊', label: 'Dashboard', roles: ['ADMIN', 'ANALISTA', 'AUDITOR'] },
      { path: '/calificaciones', icon: '📋', label: 'Calificaciones', roles: ['ADMIN', 'ANALISTA', 'AUDITOR'] },
      { path: '/reportes', icon: '📈', label: 'Reportes', roles: ['ADMIN', 'ANALISTA', 'AUDITOR'] },
    ];

    // Agregar opciones específicas por rol
    if (user?.rol === 'ADMIN' || user?.rol === 'ANALISTA') {
      baseItems.push({ path: '/carga-masiva', icon: '📦', label: 'Carga Masiva', roles: ['ADMIN', 'ANALISTA'] });
    }

    if (user?.rol === 'ADMIN' || user?.rol === 'AUDITOR') {
      baseItems.push({ path: '/auditoria', icon: '🔍', label: 'Auditoría', roles: ['ADMIN', 'AUDITOR'] });
    }

    return baseItems.filter(item => !item.roles || item.roles.includes(user?.rol));
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img src={nuamLogo} alt="NUAM" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
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
        <button onClick={handleLogout} className="logout-button" title="Cerrar sesión">
          🚪
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
