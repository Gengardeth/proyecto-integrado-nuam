import { Link } from 'react-router-dom';

export function NotFoundPage() {
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
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1a202c' }}>
        Página no encontrada
      </h2>
      <p style={{ color: '#718096', marginBottom: '2rem' }}>
        La página que buscas no existe.
      </p>
      <Link
        to="/"
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
}
