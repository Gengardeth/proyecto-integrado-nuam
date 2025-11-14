import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Calificaciones from './Calificaciones';
import { getStoredToken, logout, getCurrentUser } from './api';

// Context para pasar datos del usuario a componentes hijos
export const UserContext = React.createContext(null);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar, verifica si hay token guardado
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      // Intenta obtener datos del usuario
      getCurrentUser()
        .then((userData) => {
          setUser(userData);
          setIsAuthenticated(true);
        })
        .catch((err) => {
          console.error('Failed to load user:', err);
          logout();
          setIsAuthenticated(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={user}>
      {isAuthenticated ? (
        <div className="d-flex flex-column" style={{ height: '100vh' }}>
          {/* Navbar */}
          <nav className="navbar navbar-dark bg-dark">
            <div className="container-fluid px-4">
              <span className="navbar-brand mb-0 h1">NUAM</span>
              <div className="d-flex align-items-center">
                {user && (
                  <span className="text-light me-3">
                    <strong>{user.first_name || user.username}</strong>
                    {user.groups && user.groups.length > 0 && (
                      <span className="badge bg-info ms-2">{user.groups[0]}</span>
                    )}
                  </span>
                )}
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </nav>

          {/* Main content - takes remaining space */}
          <main className="flex-grow-1 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="container-fluid px-4 py-4">
              <Calificaciones />
            </div>
          </main>
        </div>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </UserContext.Provider>
  );
}

export default App;
