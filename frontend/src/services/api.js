import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para enviar cookies de sesión
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  getRoles: () => api.get('/roles'),
};

// ==================== TAX RATINGS ====================
export const taxRatingsAPI = {
  getAll: (params) => api.get('/calificacionfiscal/tax-ratings/', { params }),
  getById: (id) => api.get(`/calificacionfiscal/tax-ratings/${id}/`),
  create: (data) => api.post('/calificacionfiscal/tax-ratings/', data),
  update: (id, data) => api.put(`/calificacionfiscal/tax-ratings/${id}/`, data),
  delete: (id) => api.delete(`/calificacionfiscal/tax-ratings/${id}/`),
  porIssuer: (issuerId) => api.get('/calificacionfiscal/tax-ratings/por_issuer/', { params: { issuer_id: issuerId } }),
  ultimas: (limit = 10) => api.get('/calificacionfiscal/tax-ratings/ultimas/', { params: { limit } }),
  porRangoFecha: (fechaDesde, fechaHasta) => 
    api.get('/calificacionfiscal/tax-ratings/por_rango_fecha/', { 
      params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta } 
    }),
  cambiarEstado: (id, activo) => api.patch(`/calificacionfiscal/tax-ratings/${id}/cambiar_estado/`, { activo }),
};

// ==================== ISSUERS ====================
export const issuersAPI = {
  getAll: (params) => api.get('/parametros/issuers/', { params }),
  getById: (id) => api.get(`/parametros/issuers/${id}/`),
  create: (data) => api.post('/parametros/issuers/', data),
  update: (id, data) => api.put(`/parametros/issuers/${id}/`, data),
  delete: (id) => api.delete(`/parametros/issuers/${id}/`),
  activar: (id) => api.post(`/parametros/issuers/${id}/activar/`),
  desactivar: (id) => api.post(`/parametros/issuers/${id}/desactivar/`),
};

// ==================== INSTRUMENTS ====================
export const instrumentsAPI = {
  getAll: (params) => api.get('/parametros/instruments/', { params }),
  getById: (id) => api.get(`/parametros/instruments/${id}/`),
  create: (data) => api.post('/parametros/instruments/', data),
  update: (id, data) => api.put(`/parametros/instruments/${id}/`, data),
  delete: (id) => api.delete(`/parametros/instruments/${id}/`),
  agruparPorTipo: () => api.get('/parametros/instruments/agrupar_por_tipo/'),
};

// ==================== BULK UPLOADS ====================
export const bulkUploadsAPI = {
  getAll: (params) => api.get('/calificacionfiscal/bulk-uploads/', { params }),
  getById: (id) => api.get(`/calificacionfiscal/bulk-uploads/${id}/`),
  upload: (formData) => api.post('/calificacionfiscal/bulk-uploads/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getItems: (id, estado) => api.get(`/calificacionfiscal/bulk-uploads/${id}/items/`, { params: { estado } }),
  procesar: (id) => api.post(`/calificacionfiscal/bulk-uploads/${id}/procesar/`),
  resumen: () => api.get('/calificacionfiscal/bulk-uploads/resumen/'),
};

// ==================== REPORTS ====================
export const reportsAPI = {
  estadisticas: (params) => api.get('/calificacionfiscal/reports/estadisticas/', { params }),
  exportarCSV: (params) => api.get('/calificacionfiscal/reports/exportar_csv/', { 
    params, 
    responseType: 'blob' 
  }),
  exportarPDF: (params) => api.get('/calificacionfiscal/reports/exportar_pdf/', { 
    params, 
    responseType: 'blob' 
  }),
};

// ==================== AUDIT LOGS ====================
export const auditLogsAPI = {
  getAll: (params) => api.get('/cuentas/audit-logs/', { params }),
  getById: (id) => api.get(`/cuentas/audit-logs/${id}/`),
  resumen: () => api.get('/cuentas/audit-logs/resumen/'),
};

export default api;
