import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ratingsService from '../../services/ratings';
import { formatDate } from '../../utils/dateFormat';
import { RATING_STATUS_LABELS } from '../../utils/constants';
import '../../styles/Calificaciones.css';

const CalificacionesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });

  const fetchCalificaciones = useCallback(async () => {
    try {
      setLoading(true);
      const { fecha_desde, fecha_hasta, ...rest } = filters;
      let response;

      // Si hay filtros de fechas, usar el endpoint específico
      if (fecha_desde || fecha_hasta) {
        response = await ratingsService.porRangoFecha(fecha_desde, fecha_hasta);
        setCalificaciones(response.data);
        setPagination(prev => ({ ...prev, total: response.data.length }));
      } else {
        const params = {
          page: pagination.page,
          page_size: pagination.pageSize,
          ...rest,
        };
        response = await ratingsService.list(params);
        setCalificaciones(response.data.results || response.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }));
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching calificaciones:', err);
      setError('Error al cargar las calificaciones');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchCalificaciones();
  }, [fetchCalificaciones]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta calificación?')) return;
    
    try {
      await ratingsService.remove(id);
      fetchCalificaciones();
    } catch (err) {
      console.error('Error deleting calificacion:', err);
      alert('Error al eliminar la calificación');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  if (loading && calificaciones.length === 0) {
    return (
      <div className="calificaciones-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando calificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calificaciones-container">
      <div className="calificaciones-header">
        <h1>Calificaciones Fiscales</h1>
        {isAdmin && (
          <button 
            className="btn-primary"
            onClick={() => navigate('/calificaciones/nueva')}
          >
            + Nueva Calificación
          </button>
        )}

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            name="search"
            placeholder="Buscar por issuer o instrumento..."
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            {Object.entries(RATING_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <input
            type="date"
            name="fecha_desde"
            value={filters.fecha_desde}
            onChange={handleFilterChange}
            className="filter-input"
            placeholder="Desde"
          />
        </div>

        <div className="filter-group">
          <input
            type="date"
            name="fecha_hasta"
            value={filters.fecha_hasta}
            onChange={handleFilterChange}
            className="filter-input"
            placeholder="Hasta"
          />
        </div>

        <button 
          className="btn-secondary"
          onClick={() => {
            setFilters({ search: '', status: '', fecha_desde: '', fecha_hasta: '' });
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          Limpiar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Tabla */}
      <div className="table-container">
        <table className="calificaciones-table">
          <thead>
            <tr>
              <th>Issuer</th>
              <th>Instrumento</th>
              <th>Rating</th>
              <th>Estado</th>
              <th>Válido desde</th>
              <th>Válido hasta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {calificaciones.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No hay calificaciones registradas
                </td>
              </tr>
            ) : (
              calificaciones.map((calif) => (
                <tr key={calif.id}>
                  <td>{calif.issuer_nombre || calif.issuer}</td>
                  <td>{calif.instrument_nombre || calif.instrument}</td>
                  <td>
                    <span className="rating-badge">{calif.rating}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${calif.status?.toLowerCase()}`}>
                      {RATING_STATUS_LABELS[calif.status] || calif.status}
                    </span>
                  </td>
                  <td>{formatDate(calif.valid_from)}</td>
                  <td>{formatDate(calif.valid_to)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-action btn-view"
                      onClick={() => navigate(`/calificaciones/${calif.id}`)}
                      title="Ver detalle"
                    >
                      👁️
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => navigate(`/calificaciones/${calif.id}/editar`)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(calif.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            ← Anterior
          </button>
          
          <span className="pagination-info">
            Página {pagination.page} de {totalPages}
          </span>
          
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default CalificacionesList;
