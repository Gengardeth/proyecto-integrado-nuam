import api from './httpClient';

// Servicios para Calificaciones Tributarias (TaxRatings)
export const ratingsService = {
  list: (params = {}) => api.get('/tax-ratings/', { params }),
  get: (id) => api.get(`/tax-ratings/${id}/`),
  create: (data) => api.post('/tax-ratings/', data),
  update: (id, data) => api.put(`/tax-ratings/${id}/`, data),
  remove: (id) => api.delete(`/tax-ratings/${id}/`),
  ultimas: (limit = 10) => api.get('/tax-ratings/ultimas/', { params: { limit } }),
  porIssuer: (issuerId, params = {}) => api.get('/tax-ratings/por_issuer/', { params: { issuer_id: issuerId, ...params } }),
  porRangoFecha: (fechaDesde, fechaHasta, extra = {}) => api.get('/tax-ratings/por_rango_fecha/', { params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...extra } }),
  estadisticas: () => api.get('/tax-ratings/estadisticas/'),
  cambiarEstado: (id, status) => api.patch(`/tax-ratings/${id}/cambiar_estado/`, { status }),
};

export default ratingsService;