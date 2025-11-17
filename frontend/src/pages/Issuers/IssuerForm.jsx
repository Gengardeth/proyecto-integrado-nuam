import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issuersAPI } from '../../services/api';
import '../../styles/SharedCRUD.css';

const IssuerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    rut: '',
    pais: 'Chile',
    activo: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIssuer = useCallback(async () => {
    try {
      setLoading(true);
      const response = await issuersAPI.get(id);
      setFormData(response.data);
    } catch (err) {
      console.error('Error fetching issuer:', err);
      setError('Error al cargar el issuer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchIssuer();
    }
  }, [isEdit, fetchIssuer]);

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
        await issuersAPI.update(id, formData);
      } else {
        await issuersAPI.create(formData);
      }
      navigate('/issuers');
    } catch (err) {
      console.error('Error saving issuer:', err);
      setError(err.response?.data?.detail || 'Error al guardar el issuer');
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
        <h1>{isEdit ? 'Editar Issuer' : 'Nuevo Issuer'}</h1>
        <button className="btn-secondary" onClick={() => navigate('/issuers')}>
          ← Volver
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="crud-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="codigo">Código *</label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
              placeholder="Ej: ISS001"
              className="form-control"
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rut">RUT *</label>
            <input
              type="text"
              id="rut"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              required
              placeholder="Ej: 76.123.456-7"
              className="form-control"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Nombre del issuer"
              className="form-control"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pais">País *</label>
            <input
              type="text"
              id="pais"
              name="pais"
              value={formData.pais}
              onChange={handleChange}
              required
              placeholder="Ej: Chile"
              className="form-control"
              maxLength={100}
            />
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
            onClick={() => navigate('/issuers')}
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

export default IssuerForm;
