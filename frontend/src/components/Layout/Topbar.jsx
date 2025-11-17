import { useAuth } from '../../hooks/useAuth';
import '../../styles/Topbar.css';

const Topbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="page-title">NUAM - Calificaciones Tributarias</h2>
      </div>
      <div className="topbar-right">
        <div className="user-info">
          <span className="user-name">{user?.username}</span>
          <span className="user-role">{user?.rol_display || user?.rol}</span>
        </div>
        <button onClick={logout} className="btn-logout" title="Cerrar Sesión">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
