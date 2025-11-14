import { useState, useEffect } from 'react'
import { logout } from './api'
import Login from './Login'
import Calificaciones from './Calificaciones'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('apiToken')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  function handleLogin() {
    setIsAuthenticated(true)
  }

  function handleLogout() {
    logout()
    setIsAuthenticated(false)
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <div className="logo-placeholder me-3">
              {/* Logo irá aquí: reemplaza este div por <img src="/logo.png" alt="Logo" /> */}
              <div style={{ width: 50, height: 50, background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                LOGO
              </div>
            </div>

            <h1 className="mb-0">Sistema de Calificaciones Tributarias NUAM</h1>

            {isAuthenticated && (
              <button className="btn btn-danger ms-auto logout-btn" onClick={handleLogout}>
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main container my-4">
        {!isAuthenticated ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Calificaciones />
        )}
      </main>

      <footer className="app-footer text-center py-3">
        <p>&copy; 2025 NUAM. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

export default App
