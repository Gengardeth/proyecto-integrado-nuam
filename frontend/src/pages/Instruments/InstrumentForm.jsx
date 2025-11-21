import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { instrumentsAPI } from '../../services/api';
import '../../styles/SharedCRUD.css';

const InstrumentForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const isEdit = !!id;
  const isAdmin = user?.rol === 'ADMIN';

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'BONO',
    issuer: '',
    activo: true
  });

  const [issuers, setIssuers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tiposInstrumento = [
    'BONO',
    'ACCION',
    'FONDO_MUTUO',
    'DERIVADO',
    'OTRO'
  ];

  const fetchIssuers = useCallback(async () => {
    try {
      const response = await issuersAPI.listActive();
      setIssuers(response.data);
    } catch (err) {
      console.error('Error fetching issuers:', err);
    }
  }, []);

  const fetchInstrument = useCallback(async () => {
    try {
      setLoading(true);
      const response = await instrumentsAPI.get(id);
      setFormData(response.data);
    } catch (err) {
      console.error('Error fetching instrument:', err);
      setError('Error al cargar el instrumento');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Solo ADMIN puede acceder a este formulario
    if (!isAdmin) {
      alert('No tienes permiso para acceder a esta página. Solo administradores pueden crear o editar instrumentos.');
      navigate('/instrumentos');
      return;
    }

    fetchIssuers();
    if (isEdit) {
      fetchInstrument();
    }
  }, [isEdit, fetchIssuers, fetchInstrument, isAdmin, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await instrumentsAPI.update(id, formData);
      } else {
        await instrumentsAPI.create(formData);
      }
      navigate('/instruments');
    } catch (err) {
      console.error('Error saving instrument:', err);
      setError(err.response?.data?.detail || 'Error al guardar el instrumento');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="crud-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <div className="form-header">
        <h1>{isEdit ? 'Editar Instrumento' : 'Nuevo Instrumento'}</h1>
        <button className="btn-secondary" onClick={() => navigate('/instruments')}>
          ← Volver
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="crud-form">
        <div className="form-grid">
          <div className="form-group full-width">
            <label htmlFor="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Nombre del instrumento"
              className="form-control"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tipo">Tipo *</label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              className="form-control"
            >
              {tiposInstrumento.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="issuer">Issuer *</label>
            <select
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              required
              className="form-control"
            >
              <option value="">Seleccionar issuer...</option>
              {issuers.map(issuer => (
                <option key={issuer.id} value={issuer.id}>
                  {issuer.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
              />
              <span>Activo</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/instruments')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstrumentForm;
