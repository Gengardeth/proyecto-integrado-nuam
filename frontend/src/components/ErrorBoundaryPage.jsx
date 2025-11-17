import { useRouteError, Link } from 'react-router-dom';

export function ErrorBoundaryPage() {
  const error = useRouteError();
  console.error('Router error:', error);
  
  return (
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
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: '#e53e3e' }}>¡Oops!</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1a202c' }}>
        Algo salió mal
      </h2>
      <p style={{ color: '#718096', marginBottom: '2rem', maxWidth: '500px' }}>
        {error?.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
      </p>
      <Link
        to="/login"
        style={{
          padding: '0.75rem 1.5rem',
          background: '#3182ce',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '600'
        }}
      >
        Volver al Login
      </Link>
    </div>
  );
}
