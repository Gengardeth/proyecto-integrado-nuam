import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { taxRatingsAPI, issuersAPI, instrumentsAPI } from '../../services/api';
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
    estado: 'VIGENTE',
    fecha_emision: '',
    fecha_vigencia: '',
    notas: ''
  });

  const [issuers, setIssuers] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [filteredInstruments, setFilteredInstruments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIssuers();
    fetchInstruments();
    if (isEdit) {
      fetchCalificacion();
    }
  }, [id]);

  useEffect(() => {
    if (formData.issuer) {
      const filtered = instruments.filter(
        inst => inst.issuer === parseInt(formData.issuer)
      );
      setFilteredInstruments(filtered);
    } else {
      setFilteredInstruments(instruments);
    }
  }, [formData.issuer, instruments]);

  const fetchIssuers = async () => {
    try {
      const response = await issuersAPI.listActive();
      setIssuers(response.data);
    } catch (err) {
      console.error('Error fetching issuers:', err);
    }
  };

  const fetchInstruments = async () => {
    try {
      const response = await instrumentsAPI.listActive();
      setInstruments(response.data);
    } catch (err) {
      console.error('Error fetching instruments:', err);
    }
  };

  const fetchCalificacion = async () => {
    try {
      setLoading(true);
      const response = await taxRatingsAPI.get(id);
      const data = response.data;
      setFormData({
        issuer: data.issuer,
        instrument: data.instrument,
        rating: data.rating,
        estado: data.estado,
        fecha_emision: data.fecha_emision,
        fecha_vigencia: data.fecha_vigencia,
        notas: data.notas || ''
      });
    } catch (err) {
      console.error('Error fetching calificacion:', err);
      setError('Error al cargar la calificación');
    } finally {
      setLoading(false);
    }
  };

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
        await taxRatingsAPI.update(id, formData);
      } else {
        await taxRatingsAPI.create(formData);
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
              disabled={!formData.issuer}
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
            <label htmlFor="estado">Estado *</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
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
            <label htmlFor="fecha_emision">Fecha de Emisión *</label>
            <input
              type="date"
              id="fecha_emision"
              name="fecha_emision"
              value={formData.fecha_emision}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fecha_vigencia">Fecha de Vigencia *</label>
            <input
              type="date"
              id="fecha_vigencia"
              name="fecha_vigencia"
              value={formData.fecha_vigencia}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notas">Notas</label>
          <textarea
            id="notas"
            name="notas"
            value={formData.notas}
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
