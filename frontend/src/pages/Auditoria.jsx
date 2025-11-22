import React, { useState, useEffect, useCallback } from 'react';
import auditService from '../services/audit';
import { groupAuditLogsByDate } from '../utils/audit';
import '../styles/Auditoria.css';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros temporales (en el formulario)
  const [tempFilters, setTempFilters] = useState({
    usuario: '',
    accion: '',
    modelo: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  // Filtros activos (aplicados a la búsqueda)
  const [activeFilters, setActiveFilters] = useState({
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
  const [viewMode, setViewMode] = useState('tabla'); // 'tabla' | 'timeline'

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };
      
      if (activeFilters.usuario && activeFilters.usuario.trim()) {
        params.search = activeFilters.usuario.trim();
      }
      if (activeFilters.accion && activeFilters.accion.trim()) {
        params.accion = activeFilters.accion.trim();
      }
      if (activeFilters.modelo && activeFilters.modelo.trim()) {
        params.modelo = activeFilters.modelo.trim();
      }
      if (activeFilters.fecha_desde && activeFilters.fecha_desde.trim()) {
        params.creado_en__gte = activeFilters.fecha_desde.trim();
      }
      if (activeFilters.fecha_hasta && activeFilters.fecha_hasta.trim()) {
        params.creado_en__lte = activeFilters.fecha_hasta.trim();
      }
      
      const response = await auditService.list(params);
      const payload = response.data;
      const items = payload.results || payload;
      
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
  }, [pagination.page, pagination.pageSize, activeFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(tempFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    const emptyFilters = { usuario: '', accion: '', modelo: '', fecha_desde: '', fecha_hasta: '' };
    setTempFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'LOGIN': return '🔓';
      case 'LOGOUT': return '🔐';
      case 'EXPORT': return '📥';
      case 'UPLOAD': return '📤';
      default: return '•';
    }
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

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const fadeInStyle = { animation: 'fadeIn 0.7s' };

  if (loading && logs.length === 0) {
    return (
      <div className="auditoria-container" style={fadeInStyle}>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando registros de auditoría...</p>
        </div>
        <footer className="auditoria-footer">
          <p>© {new Date().getFullYear()} NUAM | Sistema de Calificación Fiscal</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="auditoria-container" style={fadeInStyle}>
      <div className="auditoria-header">
        <div>
          <h1>Auditoría</h1>
          <p className="subtitle">Registro detallado de todas las acciones realizadas en el sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="audit-filters-card">
        <h2>Filtros</h2>
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              value={tempFilters.usuario}
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
              value={tempFilters.accion}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Todas</option>
              <option value="CREATE">Crear (➕)</option>
              <option value="UPDATE">Actualizar (✏️)</option>
              <option value="DELETE">Eliminar (🗑️)</option>
              <option value="LOGIN">Login (🔓)</option>
              <option value="LOGOUT">Logout (🔐)</option>
              <option value="EXPORT">Exportar (📥)</option>
              <option value="UPLOAD">Subir (📤)</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="modelo">Modelo</label>
            <input
              type="text"
              id="modelo"
              name="modelo"
              value={tempFilters.modelo}
              onChange={handleFilterChange}
              placeholder="Ej: TaxRating, Issuer..."
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="fecha_desde">Desde</label>
            <input
              type="date"
              id="fecha_desde"
              name="fecha_desde"
              value={tempFilters.fecha_desde}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="fecha_hasta">Hasta</label>
            <input
              type="date"
              id="fecha_hasta"
              name="fecha_hasta"
              value={tempFilters.fecha_hasta}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <button
              className="btn-toggle"
              onClick={() => setViewMode(viewMode === 'tabla' ? 'timeline' : 'tabla')}
              disabled={loading}
            >
              {viewMode === 'tabla' ? '📊 Tabla' : '📈 Timeline'}
            </button>
          </div>
        </div>
        <div className="filter-actions">
          <button 
            className="btn-primary"
            onClick={handleApplyFilters}
            disabled={loading}
          >
            🔍 Buscar
          </button>
          <button 
            className="btn-secondary"
            onClick={handleClearFilters}
            disabled={loading}
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Estado vacío */}
      {!loading && logs.length === 0 && (
        <div className="empty-state-card">
          <p className="empty-icon">🔍</p>
          <p>No hay registros de auditoría que coincidan con los filtros aplicados.</p>
        </div>
      )}

      {/* Vista Tabla */}
      {viewMode === 'tabla' && logs.length > 0 && (
        <div className="audit-table-card">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Modelo</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id || idx} className={`log-row ${getActionColor(log.accion)}`}>
                  <td className="fecha-col">{formatDate(log.creado_en)}</td>
                  <td className="usuario-col">
                    <div>
                      <strong>{log.usuario_username || 'Sistema'}</strong>
                      {log.usuario_rol && <div style={{ fontSize: '0.85em', color: '#666' }}>{log.usuario_rol}</div>}
                    </div>
                  </td>
                  <td className="accion-col">
                    <span className="action-badge">
                      {getActionIcon(log.accion)} {log.accion}
                    </span>
                  </td>
                  <td className="modelo-col">{log.modelo || '—'}</td>
                  <td className="descripcion-col">{log.descripcion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista Timeline */}
      {viewMode === 'timeline' && logs.length > 0 && (
        <div className="timeline-wrapper">
          {grouped.map((dayGroup, dayIdx) => (
            <div key={dayIdx} className="timeline-day">
              <div className="timeline-day-header">
                <span className="timeline-date">{dayGroup.fecha_legible}</span>
                <span className="timeline-count">{dayGroup.items.length} eventos</span>
              </div>
              <div className="timeline-items">
                {dayGroup.items.map((log, logIdx) => (
                  <div key={log.id || logIdx} className={`timeline-item ${getActionColor(log.accion)}`}>
                    <div className="timeline-item-dot">
                      <span className="timeline-icon">{getActionIcon(log.accion)}</span>
                    </div>
                    <div className="timeline-item-content">
                      <div className="timeline-item-header">
                        <strong className="timeline-action">{log.accion}</strong>
                        <span className="timeline-time">{new Date(log.creado_en).toLocaleTimeString('es-CL')}</span>
                      </div>
                      <p className="timeline-user">👤 {log.usuario_username || 'Sistema'} {log.usuario_rol && <span style={{ fontSize: '0.85em', color: '#666' }}>({log.usuario_rol})</span>}</p>
                      <p className="timeline-description">{log.descripcion || 'Sin descripción'}</p>
                      {log.modelo && <p className="timeline-model">📋 {log.modelo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {pagination.page} de {totalPages} ({pagination.total} registros)
          </span>
          <button
            className="pagination-btn"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={pagination.page >= totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="auditoria-footer">
        <p>© {new Date().getFullYear()} NUAM | Sistema de Calificación Fiscal</p>
      </footer>
    </div>
  );
};

export default Auditoria;
