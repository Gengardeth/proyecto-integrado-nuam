import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { taxRatingsAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import '../styles/Dashboard.css';

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
      
      // Obtener estadísticas
      const statsResponse = await taxRatingsAPI.estadisticas();
      setStats(statsResponse.data || null);
      
      // Obtener últimas calificaciones
      const ratingsResponse = await taxRatingsAPI.ultimas(5);
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
      datasets: [
        {
          data: stats.por_rating.map(item => item.count),
          backgroundColor: [
            '#28a745',
            '#20c997',
            '#17a2b8',
            '#ffc107',
            '#fd7e14',
            '#dc3545',
            '#e83e8c',
          ],
        },
      ],
    };
  };

  const getStatusChartData = () => {
    if (!stats?.por_status) return null;

    return {
      labels: stats.por_status.map(item => item.status),
      datasets: [
        {
          label: 'Calificaciones por Estado',
          data: stats.por_status.map(item => item.count),
          backgroundColor: '#007bff',
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="welcome-text">Bienvenido, {user?.first_name || user?.username}</p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#e3f2fd' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976d2">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Total Calificaciones</h3>
            <p className="metric-value">{stats?.total || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#e8f5e9' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#388e3c">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Vigentes</h3>
            <p className="metric-value">{stats?.vigentes || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#fff3e0' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f57c00">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Por Vencer</h3>
            <p className="metric-value">
              {stats?.por_status?.find(s => s.status === 'VENCIDO')?.count || 0}
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#fce4ec' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c2185b">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Riesgo Alto</h3>
            <p className="metric-value">
              {stats?.por_rating?.filter(r => ['B', 'CCC', 'CC', 'C', 'D'].includes(r.rating)).reduce((acc, r) => acc + r.count, 0) || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Distribución por Rating</h3>
          {getRatingChartData() && (
            <div className="chart-container">
              <Pie data={getRatingChartData()} options={{ maintainAspectRatio: false }} />
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>Calificaciones por Estado</h3>
          {getStatusChartData() && (
            <div className="chart-container">
              <Bar 
                data={getStatusChartData()} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Últimas calificaciones */}
      <div className="recent-ratings">
        <div className="recent-ratings-header">
          <h3>Últimas Calificaciones</h3>
          <Link to="/calificaciones" className="btn-view-all">Ver todas</Link>
        </div>
        
        {recentRatings.length > 0 ? (
          <div className="ratings-list">
            {recentRatings.map((rating) => (
              <div key={rating.id} className="rating-item">
                <div className="rating-info">
                  <h4>{rating.issuer_nombre}</h4>
                  <p>{rating.instrument_nombre}</p>
                </div>
                <div className="rating-badge" data-rating={rating.rating}>
                  {rating.rating}
                </div>
                <div className="rating-date">
                  {new Date(rating.valid_from).toLocaleDateString('es-ES')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No hay calificaciones recientes</p>
        )}
      </div>

      {/* Atajos rápidos */}
      <div className="quick-actions">
        <h3>Accesos Rápidos</h3>
        <div className="actions-grid">
          {(user?.rol === 'ADMIN' || user?.rol === 'ANALISTA') && (
            <>
              <Link to="/calificaciones/nueva" className="action-card">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Nueva Calificación</span>
              </Link>
              
              <Link to="/carga-masiva" className="action-card">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Carga Masiva</span>
              </Link>
            </>
          )}
          
          <Link to="/reportes" className="action-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generar Reporte</span>
          </Link>
          
          <Link to="/auditoria" className="action-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Auditoría</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
