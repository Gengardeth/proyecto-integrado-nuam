import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { taxRatingsAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import '../styles/Dashboard.css';

const fadeInStyle = { animation: 'fadeIn 0.7s' };

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentRatings, setRecentRatings] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsResponse = await taxRatingsAPI.estadisticas();
      setStats(statsResponse.data || null);
      const ratingsResponse = await taxRatingsAPI.ultimas(8);
      setRecentRatings(ratingsResponse.data);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingChartData = () => {
    if (!stats?.por_rating) return null;
    return {
      labels: stats.por_rating.map(item => item.rating),
      datasets: [{
        data: stats.por_rating.map(item => item.count),
        backgroundColor: ['#10b981', '#06b6d4', '#0ea5e9', '#f59e0b', '#ef4444', '#dc2626', '#991b1b'],
        borderColor: ['#059669', '#0891b2', '#0284c7', '#d97706', '#dc2626', '#b91c1c', '#7c2d12'],
        borderWidth: 2,
      }],
    };
  };

  const getStatusChartData = () => {
    if (!stats?.por_status) return null;
    const colors = {
      'VIGENTE': '#10b981',
      'VENCIDO': '#ef4444',
      'SUSPENDIDO': '#f59e0b',
      'CANCELADO': '#6b7280',
    };
    return {
      labels: stats.por_status.map(item => item.status),
      datasets: [{
        label: 'Cantidad',
        data: stats.por_status.map(item => item.count),
        backgroundColor: stats.por_status.map(item => colors[item.status] || '#667eea'),
        borderColor: '#fff',
        borderWidth: 2,
      }],
    };
  };

  if (loading) {
    return (
      <div className="dashboard-loading" style={fadeInStyle}>
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  const riskHighCount = stats?.por_rating?.filter(r => ['B', 'CCC', 'CC', 'C', 'D'].includes(r.rating)).reduce((acc, r) => acc + r.count, 0) || 0;

  return (
    <div className="dashboard" style={fadeInStyle}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p className="welcome-text">👋 Bienvenido, <strong>{user?.first_name || user?.username}</strong></p>
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="metrics-grid">
        <div className="metric-card metric-total">
          <div className="metric-header">
            <span className="metric-icon">📊</span>
            <span className="metric-label">Total de Calificaciones</span>
          </div>
          <p className="metric-value">{stats?.total || 0}</p>
        </div>

        <div className="metric-card metric-success">
          <div className="metric-header">
            <span className="metric-icon">✅</span>
            <span className="metric-label">Vigentes</span>
          </div>
          <p className="metric-value">{stats?.vigentes || 0}</p>
        </div>

        <div className="metric-card metric-warning">
          <div className="metric-header">
            <span className="metric-icon">⏰</span>
            <span className="metric-label">Vencidas</span>
          </div>
          <p className="metric-value">{stats?.por_status?.find(s => s.status === 'VENCIDO')?.count || 0}</p>
        </div>

        <div className="metric-card metric-danger">
          <div className="metric-header">
            <span className="metric-icon">⚠️</span>
            <span className="metric-label">Riesgo Alto</span>
          </div>
          <p className="metric-value">{riskHighCount}</p>
        </div>
      </div>

      {/* Sección de gráficos */}
      <div className="charts-section">
        <div className="chart-card chart-rating">
          <div className="chart-header">
            <h3>📈 Distribución de Ratings</h3>
            <p className="chart-subtitle">Calificaciones por tipo de rating</p>
          </div>
          {getRatingChartData() ? (
            <div className="chart-container">
              <Pie data={getRatingChartData()} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          ) : (
            <div className="no-data">No hay datos para mostrar</div>
          )}
        </div>

        <div className="chart-card chart-status">
          <div className="chart-header">
            <h3>📋 Estado de Calificaciones</h3>
            <p className="chart-subtitle">Cantidad por estado actual</p>
          </div>
          {getStatusChartData() ? (
            <div className="chart-container">
              <Bar data={getStatusChartData()} options={{ maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }} />
            </div>
          ) : (
            <div className="no-data">No hay datos para mostrar</div>
          )}
        </div>
      </div>

      {/* Últimas calificaciones */}
      <div className="recent-section">
        <div className="section-header">
          <h2>🆕 Últimas Calificaciones</h2>
          <Link to="/calificaciones" className="btn-view-all">Ver todas →</Link>
        </div>

        {recentRatings.length > 0 ? (
          <div className="ratings-grid">
            {recentRatings.map((rating) => (
              <div key={rating.id} className="rating-card">
                <div className="rating-header">
                  <div className="rating-names">
                    <h4 className="issuer-name">{rating.issuer_nombre}</h4>
                    <p className="instrument-name">{rating.instrument_nombre}</p>
                  </div>
                  <span className={`rating-badge rating-${rating.rating}`}>{rating.rating}</span>
                </div>
                <div className="rating-footer">
                  <span className={`status-badge status-${rating.status}`}>{rating.status}</span>
                  <span className="rating-date">{new Date(rating.valid_from).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data-large">📭 No hay calificaciones recientes</div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="quick-actions-section">
        <h2>⚡ Accesos Rápidos</h2>
        <div className="actions-grid">
          {(user?.rol === 'ADMIN' || user?.rol === 'ANALISTA') && (
            <>
              <Link to="/calificaciones/nueva" className="action-card action-create">
                <span className="action-icon">➕</span>
                <span className="action-label">Nueva Calificación</span>
              </Link>
              <Link to="/carga-masiva" className="action-card action-upload">
                <span className="action-icon">📤</span>
                <span className="action-label">Carga Masiva</span>
              </Link>
            </>
          )}
          <Link to="/reportes" className="action-card action-report">
            <span className="action-icon">📄</span>
            <span className="action-label">Generar Reporte</span>
          </Link>
          <Link to="/auditoria" className="action-card action-audit">
            <span className="action-icon">🔍</span>
            <span className="action-label">Auditoría</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} NUAM | Sistema de Calificación Fiscal</p>
      </footer>
    </div>
  );
};

export default Dashboard;
