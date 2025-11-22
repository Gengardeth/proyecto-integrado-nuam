import React, { useState, useEffect } from 'react';
import reportsService from '../services/reports';
import ratingsService from '../services/ratings';
import issuersService from '../services/issuers';
import instrumentsService from '../services/instruments';
import { formatDate } from '../utils/dateFormat';
import { RATING_STATUS_LABELS } from '../utils/constants';
import '../styles/Reportes.css';

// Animación fade-in para la pantalla de reportes
const fadeInStyle = {
  animation: 'fadeIn 0.7s',
};

const Reportes = () => {
  // Filtros temporales (en el formulario)
  const [tempFilters, setTempFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    status: '',
    issuer_id: '',
    instrument_id: ''
  });

  // Filtros activos (aplicados a la búsqueda)
  const [activeFilters, setActiveFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    status: '',
    issuer_id: '',
    instrument_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [issuers, setIssuers] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [iss, inst] = await Promise.all([
          issuersService.list(),
          instrumentsService.list(),
        ]);
        setIssuers(iss.data.results || iss.data);
        setInstruments(inst.data.results || inst.data);
      } catch (e) {
        console.error('Error cargando listas base:', e);
      }
    })();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      setActiveFilters(tempFilters);
      
      // Preparar filtros para la API
      const apiFilters = {};
      if (tempFilters.fecha_desde) apiFilters.valid_from_range_after = tempFilters.fecha_desde;
      if (tempFilters.fecha_hasta) apiFilters.valid_from_range_before = tempFilters.fecha_hasta;
      if (tempFilters.status) apiFilters.status = tempFilters.status;
      if (tempFilters.issuer_id) apiFilters.issuer_id = tempFilters.issuer_id;
      if (tempFilters.instrument_id) apiFilters.instrument_id = tempFilters.instrument_id;

      // Estadísticas agregadas
      const statsResp = await reportsService.estadisticas(apiFilters);
      setStats(statsResp.data);
      
      // Recuperar datos sin paginar usando ratingsService con filtros básicos
      const listResp = await ratingsService.list({ page_size: 200, ...apiFilters });
      const lista = listResp.data.results || listResp.data;
      setRawData(lista);
    } catch (err) {
      console.error('Error generando reporte:', err);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    const emptyFilters = { fecha_desde: '', fecha_hasta: '', status: '', issuer_id: '', instrument_id: '' };
    setTempFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setStats(null);
    setRawData([]);
  };

  const handleExport = async (tipo) => {
    try {
      setExporting(true);
      // Preparar filtros para la API
      const apiFilters = {};
      if (activeFilters.fecha_desde) apiFilters.valid_from_range_after = activeFilters.fecha_desde;
      if (activeFilters.fecha_hasta) apiFilters.valid_from_range_before = activeFilters.fecha_hasta;
      if (activeFilters.status) apiFilters.status = activeFilters.status;
      if (activeFilters.issuer_id) apiFilters.issuer_id = activeFilters.issuer_id;
      if (activeFilters.instrument_id) apiFilters.instrument_id = activeFilters.instrument_id;

      const servicio = tipo === 'csv' ? reportsService.exportCSV : reportsService.exportPDF;
      const resp = await servicio(apiFilters);
      const blob = new Blob([resp.data], { type: tipo === 'csv' ? 'text/csv' : 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${Date.now()}.${tipo}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando reporte:', err);
      alert('No se pudo exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="reportes-container" style={fadeInStyle}>
      <div className="reportes-header">
        <h1>Reportes</h1>
        <p className="subtitle">Genera reportes de calificaciones con filtros personalizados</p>
      </div>

      <div className="report-filters-card">
        <h2>Filtros</h2>
        <div className="filters-grid">
          {/* ...existing code... */}
          <div className="filter-group">
            <label htmlFor="fecha_desde">Fecha Desde</label>
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
            <label htmlFor="fecha_hasta">Fecha Hasta</label>
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
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              name="status"
              value={tempFilters.status}
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
            <label htmlFor="issuer_id">Issuer</label>
            <select
              id="issuer_id"
              name="issuer_id"
              value={tempFilters.issuer_id}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Todos</option>
              {issuers.map(i => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="instrument_id">Instrumento</label>
            <select
              id="instrument_id"
              name="instrument_id"
              value={tempFilters.instrument_id}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Todos</option>
              {instruments.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button
            className="btn-primary"
            onClick={handleApplyFilters}
            disabled={loading}
            style={loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
          >
            {loading ? 'Generando...' : '🔍 Generar Reporte'}
          </button>
          <button
            className="btn-secondary"
            onClick={handleClearFilters}
            disabled={loading}
          >
            🗑️ Limpiar Filtros
          </button>
        </div>
      </div>

      {stats && (
        <div className="report-results-card">
          <div className="results-header">
            <h2>Resultados</h2>
            <div className="export-buttons">
              <button
                className="btn-export"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                style={exporting ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
              >
                {exporting ? 'Exportando...' : '📄 Exportar CSV'}
              </button>
              <button
                className="btn-export"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                style={exporting ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
              >
                {exporting ? 'Exportando...' : '📕 Exportar PDF'}
              </button>
            </div>
          </div>
          {/* ...existing code... */}
          <div className="report-stats">
            <div className="stat-card">
              <span className="stat-label">Total Calificaciones</span>
              <span className="stat-value">{stats.total || stats.total_calificaciones || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Vigentes</span>
              <span className="stat-value">{stats.vigentes || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Por Rating</span>
              <span className="stat-value-mini">{(stats.por_rating || []).length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Por Estado</span>
              <span className="stat-value-mini">{(stats.por_status || []).length}</span>
            </div>
          </div>
          <div className="breakdown-grid">
            <div className="breakdown-section">
              <h3>Distribución Rating</h3>
              <ul className="breakdown-list">
                {(stats.por_rating || []).map(r => (
                  <li key={r.rating}>{r.rating}: {r.count}</li>
                ))}
              </ul>
            </div>
            <div className="breakdown-section">
              <h3>Distribución Estado</h3>
              <ul className="breakdown-list">
                {(stats.por_status || []).map(s => (
                  <li key={s.status}>{s.status}: {s.count}</li>
                ))}
              </ul>
            </div>
            <div className="breakdown-section">
              <h3>Nivel de Riesgo</h3>
              <ul className="breakdown-list">
                {(stats.por_risk_level || []).map(rl => (
                  <li key={rl.risk_level}>{rl.risk_level}: {rl.count}</li>
                ))}
              </ul>
            </div>
          </div>
          {rawData && rawData.length > 0 && (
            <div className="report-table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Issuer</th>
                    <th>Instrumento</th>
                    <th>Rating</th>
                    <th>Estado</th>
                    <th>Válido desde</th>
                    <th>Válido hasta</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.map((calif) => (
                    <tr key={calif.id}>
                      <td>{calif.issuer_nombre || calif.issuer}</td>
                      <td>{calif.instrument_nombre || calif.instrument}</td>
                      <td><span className="rating-badge">{calif.rating}</span></td>
                      <td>
                        <span className={`status-badge status-${calif.status?.toLowerCase()}`}>
                          {RATING_STATUS_LABELS[calif.status] || calif.status}
                        </span>
                      </td>
                      <td>{formatDate(calif.valid_from)}</td>
                      <td>{formatDate(calif.valid_to)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!stats && (
        <div className="empty-state-card">
          <div className="empty-icon">📊</div>
          <h3>No hay reportes generados</h3>
          <p>Configura los filtros y presiona "Generar Reporte" para ver los resultados</p>
        </div>
      )}

      {/* Footer */}
      <footer className="reportes-footer">
        <p>© {new Date().getFullYear()} NUAM | Sistema de Calificación Fiscal</p>
      </footer>
    </div>
  );
};

export default Reportes;
