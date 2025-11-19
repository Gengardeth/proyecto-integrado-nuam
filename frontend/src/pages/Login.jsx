import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import nuamLogo from '../assets/nuam-logo.svg';
import '../styles/Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-decoration-left"></div>
      <div className="login-decoration-right"></div>
      <div className="login-box">
        <div className="login-logo" style={{ animation: 'fadeIn 0.7s' }}>
          <img src={nuamLogo} alt="NUAM Exchange" style={{ filter: 'drop-shadow(0 6px 16px #FF5722)' }} />
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <span style={{fontSize: '18px', marginRight: '8px'}}>⚠️</span>
              {error}
            </div>
          )}
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Usuario"
              value={credentials.username}
              onChange={handleChange}
              required
              autoComplete="username"
              style={{ fontWeight: 500, letterSpacing: '0.5px' }}
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={credentials.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              style={{ fontWeight: 500, letterSpacing: '0.5px' }}
            />
          </div>
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
            style={{ boxShadow: loading ? 'none' : '0 4px 15px #FF5722' }}
          >
            {loading ? <span>⏳ Ingresando...</span> : <span>Ingresar</span>}
          </button>
        </form>
        <div style={{marginTop: 32, textAlign: 'center', color: '#bbb', fontSize: 13}}>
          <span>© NUAM Exchange 2025</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
