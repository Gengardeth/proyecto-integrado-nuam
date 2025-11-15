import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './components/Dashboard/Dashboard';
import CalificacionesList from './pages/Calificaciones/CalificacionesList';
import CalificacionForm from './pages/Calificaciones/CalificacionForm';
import CalificacionDetail from './pages/Calificaciones/CalificacionDetail';
import IssuersList from './pages/Issuers/IssuersList';
import IssuerForm from './pages/Issuers/IssuerForm';
import InstrumentsList from './pages/Instruments/InstrumentsList';
import InstrumentForm from './pages/Instruments/InstrumentForm';
import Reportes from './pages/Reportes';
import Auditoria from './pages/Auditoria';
import CargaMasiva from './pages/CargaMasiva';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas con Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/* Redirigir / a /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Calificaciones */}
            <Route path="calificaciones" element={<CalificacionesList />} />
            <Route path="calificaciones/nueva" element={<CalificacionForm />} />
            <Route path="calificaciones/:id" element={<CalificacionDetail />} />
            <Route path="calificaciones/:id/editar" element={<CalificacionForm />} />

            {/* Issuers */}
            <Route path="issuers" element={<IssuersList />} />
            <Route path="issuers/nuevo" element={<IssuerForm />} />
            <Route path="issuers/:id/editar" element={<IssuerForm />} />

            {/* Instruments */}
            <Route path="instruments" element={<InstrumentsList />} />
            <Route path="instruments/nuevo" element={<InstrumentForm />} />
            <Route path="instruments/:id/editar" element={<InstrumentForm />} />

            {/* Reportes */}
            <Route path="reportes" element={<Reportes />} />

            {/* Auditoría */}
            <Route path="auditoria" element={<Auditoria />} />

            {/* Carga Masiva */}
            <Route path="carga-masiva" element={<CargaMasiva />} />
          </Route>

          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Componente temporal para páginas no implementadas
const PlaceholderPage = ({ title }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '2rem',
    textAlign: 'center'
  }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1a202c' }}>{title}</h1>
    <p style={{ color: '#718096', fontSize: '1rem' }}>
      Esta página se implementará próximamente en el Sprint 3.
    </p>
  </div>
);

// Componente 404
const NotFound = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center',
    background: '#f7fafc'
  }}>
    <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1a202c' }}>
      Página no encontrada
    </h2>
    <p style={{ color: '#718096', marginBottom: '2rem' }}>
      La página que buscas no existe.
    </p>
    <Link
      to="/dashboard"
      style={{
        padding: '0.75rem 1.5rem',
        background: '#3182ce',
        color: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: '600'
      }}
    >
      Volver al Dashboard
    </Link>
  </div>
);

export default App;
