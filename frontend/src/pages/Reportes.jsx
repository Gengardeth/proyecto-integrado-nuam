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
  const [filters, setFilters] = useState({
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
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      // Estadísticas agregadas
      const statsResp = await reportsService.estadisticas(filters);
      setStats(statsResp.data);
      // Recuperar datos sin paginar usando ratingsService con filtros básicos (solo para demostración)
      const listResp = await ratingsService.list({ page_size: 200, ...filters });
      const lista = listResp.data.results || listResp.data;
      setRawData(lista);
    } catch (err) {
      console.error('Error generando reporte:', err);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (tipo) => {
    try {
      setExporting(true);
      const servicio = tipo === 'csv' ? reportsService.exportCSV : reportsService.exportPDF;
      const resp = await servicio(filters);
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
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              name="status"
              value={filters.status}
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
              value={filters.issuer_id}
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
              value={filters.instrument_id}
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
            className="btn-secondary"
            onClick={() => setFilters({ fecha_desde: '', fecha_hasta: '', status: '', issuer_id: '', instrument_id: '' })}
          >
            Limpiar Filtros
          </button>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={loading}
            style={loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
          >
            {loading ? 'Generando...' : '📊 Generar Reporte'}
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
