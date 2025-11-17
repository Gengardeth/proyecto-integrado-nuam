import api from './httpClient';

// Servicios para Auditoría
export const auditService = {
  list: (params = {}) => api.get('/audit-logs/', { params }),
  get: (id) => api.get(`/audit-logs/${id}/`),
  estadisticas: () => api.get('/audit-logs/estadisticas/'),
};

export default auditService;