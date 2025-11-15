import React from 'react';
import '../../styles/Dashboard.css';

/**
 * Componente de tarjeta KPI para mostrar estadísticas clave
 */
const KPICard = ({ title, value, subtitle, icon, trend, color = 'primary' }) => {
  return (
    <div className={`kpi-card kpi-card-${color}`}>
      <div className="kpi-card-header">
        <div className="kpi-card-icon">
          {icon || '📊'}
        </div>
        <div className="kpi-card-info">
          <h3 className="kpi-card-title">{title}</h3>
          {subtitle && <p className="kpi-card-subtitle">{subtitle}</p>}
        </div>
      </div>
      
      <div className="kpi-card-body">
        <div className="kpi-card-value">
          {value !== null && value !== undefined ? value : '-'}
        </div>
        
        {trend && (
          <div className={`kpi-card-trend ${trend.direction}`}>
            <span className="trend-icon">
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            </span>
            <span className="trend-value">{trend.value}</span>
            <span className="trend-label">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
