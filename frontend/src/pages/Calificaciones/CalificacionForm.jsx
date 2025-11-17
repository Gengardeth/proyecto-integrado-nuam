import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ratingsService from '../../services/ratings';
import issuersService from '../../services/issuers';
import instrumentsService from '../../services/instruments';
import { RATING_STATUS_LABELS } from '../../utils/constants';
import '../../styles/Calificaciones.css';

const CalificacionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    issuer: '',
    instrument: '',
    rating: '',
    status: 'VIGENTE',
    valid_from: '',
    valid_to: '',
    comments: ''
  });

  const [issuers, setIssuers] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [filteredInstruments, setFilteredInstruments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCalificacion = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ratingsService.get(id);
      const data = response.data;
      setFormData({
        issuer: data.issuer,
        instrument: data.instrument,
        rating: data.rating,
        status: data.status,
        valid_from: data.valid_from,
        valid_to: data.valid_to,
        comments: data.comments || ''
      });
    } catch (err) {
      console.error('Error fetching calificacion:', err);
      setError('Error al cargar la calificación');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssuers();
    fetchInstruments();
    if (isEdit) {
      fetchCalificacion();
    }
  }, [fetchCalificacion, isEdit]);

  useEffect(() => {
    // Sin relación directa entre Instrument e Issuer, mostramos todos
    setFilteredInstruments(instruments);
  }, [instruments]);

  const fetchIssuers = async () => {
    try {
      const response = await issuersService.listActive();
      setIssuers(response.data);
    } catch (err) {
      console.error('Error fetching issuers:', err);
    }
  };

  const fetchInstruments = async () => {
    try {
      const response = await instrumentsService.listActive();
      setInstruments(response.data);
    } catch (err) {
      console.error('Error fetching instruments:', err);
    }
  };

  // fetchCalificacion definido arriba con useCallback

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await ratingsService.update(id, formData);
      } else {
        await ratingsService.create(formData);
      }
      navigate('/calificaciones');
    } catch (err) {
      console.error('Error saving calificacion:', err);
      setError(err.response?.data?.detail || 'Error al guardar la calificación');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="calificaciones-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calificaciones-container">
      <div className="form-header">
        <h1>{isEdit ? 'Editar Calificación' : 'Nueva Calificación'}</h1>
        <button className="btn-secondary" onClick={() => navigate('/calificaciones')}>
          ← Volver
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="calificacion-form">
        <div className="form-grid">
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
            <label htmlFor="instrument">Instrumento *</label>
            <select
              id="instrument"
              name="instrument"
              value={formData.instrument}
              onChange={handleChange}
              required
              className="form-control"
            >
              <option value="">Seleccionar instrumento...</option>
              {filteredInstruments.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.nombre} - {inst.tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rating">Rating *</label>
            <input
              type="text"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              required
              placeholder="Ej: AAA, AA+, BBB-"
              className="form-control"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Estado *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="form-control"
            >
              {Object.entries(RATING_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="valid_from">Válido desde *</label>
            <input
              type="date"
              id="valid_from"
              name="valid_from"
              value={formData.valid_from}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="valid_to">Válido hasta *</label>
            <input
              type="date"
              id="valid_to"
              name="valid_to"
              value={formData.valid_to}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comments">Comentarios</label>
          <textarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows={4}
            placeholder="Notas adicionales sobre la calificación..."
            className="form-control"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/calificaciones')}
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

export default CalificacionForm;
