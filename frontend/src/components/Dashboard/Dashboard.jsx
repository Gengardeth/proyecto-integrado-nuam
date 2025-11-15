import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { taxRatingsAPI, auditLogsAPI } from '../../services/api';
import { formatDate, getRelativeTime } from '../../utils/dateFormat';
import { RATING_STATUS_LABELS, OUTLOOK_LABELS } from '../../utils/constants';
import KPICard from './KPICard';
import '../../styles/Dashboard.css';

/**
 * Componente Dashboard principal
 * Muestra KPIs, estadísticas y últimas acciones del sistema
 */
const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRatings: 0,
    ratingsVigentes: 0,
    ratingsVencidos: 0,
    ultimasCargos: 0,
  });
  const [recentRatings, setRecentRatings] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener últimas calificaciones
      const ratingsResponse = await taxRatingsAPI.getAll({ 
        page_size: 5,
        ordering: '-fecha_rating' 
      });
      setRecentRatings(ratingsResponse.data.results || ratingsResponse.data || []);
      
      // Calcular estadísticas básicas
      const allRatingsResponse = await taxRatingsAPI.getAll({ page_size: 1000 });
      const allRatings = allRatingsResponse.data.results || allRatingsResponse.data || [];
      
      const vigentes = allRatings.filter(r => r.estado === 'VIGENTE').length;
      const vencidos = allRatings.filter(r => r.estado === 'VENCIDO').length;
      
      setStats({
        totalRatings: allRatings.length,
        ratingsVigentes: vigentes,
        ratingsVencidos: vencidos,
        ultimasCargos: ratingsResponse.data.count || 0,
      });
      
      // Obtener auditoría reciente (si el usuario tiene permisos)
      if (user?.rol === 'ADMIN' || user?.rol === 'AUDITOR') {
        try {
          const auditResponse = await auditLogsAPI.getAll({ page_size: 5 });
          setRecentAudits(auditResponse.data.results || auditResponse.data || []);
        } catch (error) {
          console.log('No se pudo cargar auditoría:', error);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
        <p className="welcome-text">
          Bienvenido, <strong>{user?.nombre || user?.username}</strong>
          {user?.rol && ` • ${user.rol}`}
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard
          title="Total Calificaciones"
          value={stats.totalRatings}
          subtitle="Calificaciones totales en el sistema"
          icon="📊"
          color="primary"
        />
        
        <KPICard
          title="Vigentes"
          value={stats.ratingsVigentes}
          subtitle={`${stats.totalRatings > 0 ? ((stats.ratingsVigentes / stats.totalRatings) * 100).toFixed(1) : 0}% del total`}
          icon="✅"
          color="success"
        />
        
        <KPICard
          title="Vencidos"
          value={stats.ratingsVencidos}
          subtitle={`${stats.totalRatings > 0 ? ((stats.ratingsVencidos / stats.totalRatings) * 100).toFixed(1) : 0}% del total`}
          icon="⚠️"
          color="warning"
        />
        
        <KPICard
          title="Últimas Cargas"
          value={recentRatings.length}
          subtitle="Calificaciones recientes"
          icon="📥"
          color="info"
        />
      </div>

      {/* Contenido principal */}
      <div className="dashboard-content">
        {/* Últimas calificaciones */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Últimas Calificaciones</h2>
            <a href="/tax-ratings" className="btn-link">Ver todas →</a>
          </div>
          
          {recentRatings.length === 0 ? (
            <div className="empty-state">
              <p>No hay calificaciones registradas</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emisor</th>
                    <th>Instrumento</th>
                    <th>Rating</th>
                    <th>Outlook</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRatings.map((rating) => (
                    <tr key={rating.id}>
                      <td>{rating.issuer_nombre || rating.issuer}</td>
                      <td>{rating.instrument_nombre || rating.instrument}</td>
                      <td>
                        <span className="badge badge-rating">{rating.rating}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${rating.outlook?.toLowerCase()}`}>
                          {OUTLOOK_LABELS[rating.outlook] || rating.outlook}
                        </span>
                      </td>
                      <td>{formatDate(rating.fecha_rating)}</td>
                      <td>
                        <span className={`badge badge-${rating.estado?.toLowerCase()}`}>
                          {RATING_STATUS_LABELS[rating.estado] || rating.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auditoría reciente (solo para Admin y Auditor) */}
        {(user?.rol === 'ADMIN' || user?.rol === 'AUDITOR') && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Actividad Reciente</h2>
              <a href="/audit" className="btn-link">Ver todas →</a>
            </div>
            
            {recentAudits.length === 0 ? (
              <div className="empty-state">
                <p>No hay actividad reciente</p>
              </div>
            ) : (
              <div className="audit-timeline">
                {recentAudits.map((audit) => (
                  <div key={audit.id} className="audit-item">
                    <div className="audit-icon">{getAuditIcon(audit.accion)}</div>
                    <div className="audit-content">
                      <div className="audit-header">
                        <strong>{audit.usuario_nombre || audit.usuario}</strong>
                        <span className="audit-action">{audit.accion}</span>
                      </div>
                      <p className="audit-description">
                        {audit.modelo} {audit.objeto_id && `#${audit.objeto_id}`}
                      </p>
                      <span className="audit-time">{getRelativeTime(audit.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="dashboard-actions">
        <h2>Acciones Rápidas</h2>
        <div className="action-cards">
          {user?.rol !== 'AUDITOR' && (
            <>
              <a href="/tax-ratings/new" className="action-card">
                <div className="action-icon">➕</div>
                <div className="action-content">
                  <h3>Nueva Calificación</h3>
                  <p>Crear una nueva calificación fiscal</p>
                </div>
              </a>
              
              <a href="/bulk-upload" className="action-card">
                <div className="action-icon">📤</div>
                <div className="action-content">
                  <h3>Carga Masiva</h3>
                  <p>Subir calificaciones desde archivo</p>
                </div>
              </a>
            </>
          )}
          
          <a href="/reports" className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <h3>Reportes</h3>
              <p>Generar y descargar reportes</p>
            </div>
          </a>
          
          {(user?.rol === 'ADMIN' || user?.rol === 'AUDITOR') && (
            <a href="/audit" className="action-card">
              <div className="action-icon">🔍</div>
              <div className="action-content">
                <h3>Auditoría</h3>
                <p>Ver registro de auditoría completo</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper para iconos de auditoría
const getAuditIcon = (accion) => {
  const icons = {
    CREATE: '➕',
    UPDATE: '✏️',
    DELETE: '🗑️',
    LOGIN: '🔓',
    LOGOUT: '🔒',
  };
  return icons[accion] || '📝';
};

export default Dashboard;
