import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import { formatDate } from '../utils/dateFormat';
import { RATING_STATUS_LABELS } from '../utils/constants';
import '../styles/Reportes.css';

const Reportes = () => {
  const [filters, setFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    estado: '',
    issuer: ''
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.generate(filters);
      setReportData(response.data);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);
      const response = await reportsAPI.export({...filters, format});
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Error al exportar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <h1>Reportes</h1>
        <p className="subtitle">Genera reportes de calificaciones con filtros personalizados</p>
      </div>

      <div className="report-filters-card">
        <h2>Filtros</h2>
        <div className="filters-grid">
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
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              name="estado"
              value={filters.estado}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Todos</option>
              {Object.entries(RATING_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="issuer">Issuer</label>
            <input
              type="text"
              id="issuer"
              name="issuer"
              value={filters.issuer}
              onChange={handleFilterChange}
              placeholder="Buscar issuer..."
              className="filter-input"
            />
          </div>
        </div>

        <div className="filter-actions">
          <button
            className="btn-secondary"
            onClick={() => setFilters({ fecha_desde: '', fecha_hasta: '', estado: '', issuer: '' })}
          >
            Limpiar Filtros
          </button>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generando...' : '📊 Generar Reporte'}
          </button>
        </div>
      </div>

      {reportData && (
        <div className="report-results-card">
          <div className="results-header">
            <h2>Resultados</h2>
            <div className="export-buttons">
              <button
                className="btn-export"
                onClick={() => handleExport('csv')}
                disabled={loading}
              >
                📄 Exportar CSV
              </button>
              <button
                className="btn-export"
                onClick={() => handleExport('pdf')}
                disabled={loading}
              >
                📕 Exportar PDF
              </button>
            </div>
          </div>

          <div className="report-stats">
            <div className="stat-card">
              <span className="stat-label">Total Calificaciones</span>
              <span className="stat-value">{reportData.total || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Vigentes</span>
              <span className="stat-value">{reportData.vigentes || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Vencidos</span>
              <span className="stat-value">{reportData.vencidos || 0}</span>
            </div>
          </div>

          {reportData.calificaciones && reportData.calificaciones.length > 0 && (
            <div className="report-table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Issuer</th>
                    <th>Instrumento</th>
                    <th>Rating</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.calificaciones.map((calif, index) => (
                    <tr key={index}>
                      <td>{calif.issuer_name}</td>
                      <td>{calif.instrument_name}</td>
                      <td><span className="rating-badge">{calif.rating}</span></td>
                      <td>
                        <span className={`status-badge status-${calif.estado?.toLowerCase()}`}>
                          {RATING_STATUS_LABELS[calif.estado]}
                        </span>
                      </td>
                      <td>{formatDate(calif.fecha_emision)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!reportData && (
        <div className="empty-state-card">
          <div className="empty-icon">📊</div>
          <h3>No hay reportes generados</h3>
          <p>Configura los filtros y presiona "Generar Reporte" para ver los resultados</p>
        </div>
      )}
    </div>
  );
};

export default Reportes;
