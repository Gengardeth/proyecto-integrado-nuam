import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ratingsService from '../../services/ratings';
import { formatDate } from '../../utils/dateFormat';
import { RATING_STATUS_LABELS } from '../../utils/constants';
import '../../styles/Calificaciones.css';

const CalificacionDetail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const isAdmin = user?.rol === 'ADMIN';
  const [calificacion, setCalificacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCalificacion = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ratingsService.get(id);
      setCalificacion(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching calificacion:', err);
      setError('Error al cargar la calificación');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCalificacion();
  }, [fetchCalificacion]);

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta calificación?')) return;
    
    try {
      await ratingsService.remove(id);
      navigate('/calificaciones');
    } catch (err) {
      console.error('Error deleting calificacion:', err);
      alert('Error al eliminar la calificación');
    }
  };

  if (loading) {
    return (
      <div className="calificaciones-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !calificacion) {
    return (
      <div className="calificaciones-container">
        <div className="error-message">{error || 'Calificación no encontrada'}</div>
        <button className="btn-secondary" onClick={() => navigate('/calificaciones')}>
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <div className="calificaciones-container">
      <div className="detail-header">
        <div>
          <h1>Detalle de Calificación</h1>
          <p className="detail-subtitle">ID: {calificacion.id}</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/calificaciones')}
          >
            ← Volver
          </button>
          {isAdmin && (
            <>
              <button 
                className="btn-primary"
                onClick={() => navigate(`/calificaciones/${id}/editar`)}
              >
                ✏️ Editar
              </button>
              <button 
                className="btn-danger"
                onClick={handleDelete}
              >
                🗑️ Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h2>Información General</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Issuer</label>
              <p>{calificacion.issuer_nombre || calificacion.issuer}</p>
            </div>
            <div className="detail-item">
              <label>Instrumento</label>
              <p>{calificacion.instrument_nombre || calificacion.instrument}</p>
            </div>
            <div className="detail-item">
              <label>Rating</label>
              <p><span className="rating-badge large">{calificacion.rating}</span></p>
            </div>
            <div className="detail-item">
              <label>Estado</label>
              <p>
                <span className={`status-badge status-${calificacion.status?.toLowerCase()}`}>
                  {RATING_STATUS_LABELS[calificacion.status] || calificacion.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Fechas</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Válido desde</label>
              <p>{formatDate(calificacion.valid_from)}</p>
            </div>
            <div className="detail-item">
              <label>Válido hasta</label>
              <p>{formatDate(calificacion.valid_to)}</p>
            </div>
            <div className="detail-item">
              <label>Creado</label>
              <p>{formatDate(calificacion.creado_en)}</p>
            </div>
            <div className="detail-item">
              <label>Última actualización</label>
              <p>{formatDate(calificacion.actualizado_en)}</p>
            </div>
          </div>
        </div>

        {calificacion.comments && (
          <div className="detail-section">
            <h2>Comentarios</h2>
            <p className="detail-notes">{calificacion.comments}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalificacionDetail;
