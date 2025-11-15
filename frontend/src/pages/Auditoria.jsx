import React, { useState, useEffect } from 'react';
import { auditLogsAPI } from '../services/api';
import { formatDate } from '../utils/dateFormat';
import '../styles/Auditoria.css';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
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

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        ...filters
      };
      
      const response = await auditLogsAPI.list(params);
      setLogs(response.data.results || response.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.count || response.data.length
      }));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

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
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="audit-table-card">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Modelo</th>
              <th>IP</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No hay logs de auditoría
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.timestamp, true)}</td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-small">
                        {log.usuario_username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {log.usuario_username || 'Sistema'}
                    </div>
                  </td>
                  <td>
                    <span className={`action-badge ${getActionColor(log.accion)}`}>
                      {log.accion}
                    </span>
                  </td>
                  <td><span className="model-name">{log.modelo}</span></td>
                  <td className="ip-cell">{log.ip_address || '-'}</td>
                  <td className="details-cell">
                    {log.descripcion || '-'}
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
