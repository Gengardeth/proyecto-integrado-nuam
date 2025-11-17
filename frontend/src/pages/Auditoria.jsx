import React, { useState, useEffect, useCallback } from 'react';
import auditService from '../services/audit';
import { formatDate } from '../utils/dateFormat';
import { groupAuditLogsByDate } from '../utils/audit';
import '../styles/Auditoria.css';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    usuario: '',
    accion: '',
    modelo: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'tabla'

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      let endpointFn = auditService.list;
      let params = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };
      // Filtrado por acción via endpoint especializado
      if (filters.accion) {
        endpointFn = (p) => auditService.list({ ...p, accion: filters.accion });
      }
      // Filtrado por modelo via endpoint especializado
      if (filters.modelo) {
        endpointFn = (p) => auditService.list({ ...p, modelo: filters.modelo });
      }
      // Búsqueda por usuario (username) usando search filter DRF
      if (filters.usuario) {
        params.search = filters.usuario;
      }
      // Filtros de fecha ahora soportados en backend (creado_en rango inclusivo)
      if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
      if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
      const response = await endpointFn(params);
      const payload = response.data;
      const items = payload.results || payload; // soporta paginado DRF o lista directa
      setLogs(items);
      setGrouped(groupAuditLogsByDate(items));
      setPagination(prev => ({
        ...prev,
        total: payload.count || items.length
      }));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'action-create';
      case 'UPDATE': return 'action-update';
      case 'DELETE': return 'action-delete';
      case 'LOGIN': return 'action-login';
      case 'LOGOUT': return 'action-logout';
      default: return 'action-other';
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  if (loading && logs.length === 0) {
    return (
      <div className="auditoria-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auditoria-container">
      <div className="auditoria-header">
        <div>
          <h1>Auditoría</h1>
          <p className="subtitle">Registro de todas las acciones realizadas en el sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="audit-filters-card">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              value={filters.usuario}
              onChange={handleFilterChange}
              placeholder="Buscar usuario..."
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="accion">Acción</label>
            <select
              id="accion"
              name="accion"
              value={filters.accion}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Todas</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="modelo">Modelo</label>
            <input
              type="text"
              id="modelo"
              name="modelo"
              value={filters.modelo}
              onChange={handleFilterChange}
              placeholder="Ej: TaxRating, Issuer..."
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="fecha_desde">Fecha Desde</label>
            <input
              type="date"
              id="fecha_desde"
              name="fecha_desde"
              value={filters.fecha_desde}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="fecha_hasta">Fecha Hasta</label>
            <input
              type="date"
              id="fecha_hasta"
              name="fecha_hasta"
              value={filters.fecha_hasta}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <button
              className="btn-secondary"
              onClick={() => {
                setFilters({ usuario: '', accion: '', modelo: '', fecha_desde: '', fecha_hasta: '' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              Limpiar
            </button>
          </div>
          <div className="filter-group">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode(viewMode === 'timeline' ? 'tabla' : 'timeline')}
            >
              Vista: {viewMode === 'timeline' ? 'Tabla' : 'Timeline'}
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'tabla' && (
        <div className="audit-table-card">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Modelo</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">No hay logs de auditoría</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td>{formatDate(log.creado_en, true)}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {log.usuario_username?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        {log.usuario_username || 'Sistema'}
                      </div>
                    </td>
                    <td><span className={`action-badge ${getActionColor(log.accion)}`}>{log.accion}</span></td>
                    <td><span className="model-name">{log.modelo}</span></td>
                    <td className="details-cell">{log.descripcion || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="timeline-wrapper">
          {grouped.length === 0 ? (
            <div className="empty-state">No hay logs de auditoría</div>
          ) : (
            grouped.map(day => (
              <div key={day.fecha} className="timeline-day">
                <div className="timeline-date">{day.fecha_legible}</div>
                <div className="timeline-items">
                  {day.items.map(item => (
                    <div key={item.id} className="timeline-item">
                      <div className="timeline-time">{formatDate(item.creado_en, true).split(' ')[1]}</div>
                      <div className="timeline-content">
                        <div className="timeline-row">
                          <div className="user-avatar-small mini">{item.usuario_username?.charAt(0).toUpperCase() || 'S'}</div>
                          <span className={`action-badge ${getActionColor(item.accion)}`}>{item.accion}</span>
                          <span className="model-name inline">{item.modelo}</span>
                        </div>
                        <div className="timeline-desc">{item.descripcion || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            ← Anterior
          </button>
          
          <span className="pagination-info">
            Página {pagination.page} de {totalPages} ({pagination.total} registros)
          </span>
          
          <button
            className="pagination-btn"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default Auditoria;
