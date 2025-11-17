import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

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
  getAll: (params) => api.get('/tax-ratings/', { params }),
  getById: (id) => api.get(`/tax-ratings/${id}/`),
  create: (data) => api.post('/tax-ratings/', data),
  update: (id, data) => api.put(`/tax-ratings/${id}/`, data),
  delete: (id) => api.delete(`/tax-ratings/${id}/`),
  porIssuer: (issuerId) => api.get('/tax-ratings/por_issuer/', { params: { issuer_id: issuerId } }),
  ultimas: (limit = 10) => api.get('/tax-ratings/ultimas/', { params: { limit } }),
  porRangoFecha: (fechaDesde, fechaHasta) => 
    api.get('/tax-ratings/por_rango_fecha/', { 
      params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta } 
    }),
  estadisticas: () => api.get('/tax-ratings/estadisticas/'),
  cambiarStatus: (id, status) => api.patch(`/tax-ratings/${id}/cambiar_estado/`, { status }),
  // Alias para compatibilidad con componentes existentes
  list: (params) => api.get('/tax-ratings/', { params }),
  get: (id) => api.get(`/tax-ratings/${id}/`),
};

// ==================== ISSUERS ====================
export const issuersAPI = {
  getAll: (params) => api.get('/issuers/', { params }),
  getById: (id) => api.get(`/issuers/${id}/`),
  create: (data) => api.post('/issuers/', data),
  update: (id, data) => api.put(`/issuers/${id}/`, data),
  delete: (id) => api.delete(`/issuers/${id}/`),
  listActive: () => api.get('/issuers/activos/'),
  // Alias de compatibilidad
  list: (params) => api.get('/issuers/', { params }),
};

// ==================== INSTRUMENTS ====================
export const instrumentsAPI = {
  getAll: (params) => api.get('/instruments/', { params }),
  getById: (id) => api.get(`/instruments/${id}/`),
  create: (data) => api.post('/instruments/', data),
  update: (id, data) => api.put(`/instruments/${id}/`, data),
  delete: (id) => api.delete(`/instruments/${id}/`),
  porTipo: () => api.get('/instruments/por_tipo/'),
  listActive: () => api.get('/instruments/activos/'),
  // Alias de compatibilidad
  list: (params) => api.get('/instruments/', { params }),
};

// ==================== BULK UPLOADS ====================
export const bulkUploadsAPI = {
  getAll: (params) => api.get('/bulk-uploads/', { params }),
  getById: (id) => api.get(`/bulk-uploads/${id}/`),
  upload: (formData) => api.post('/bulk-uploads/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getItems: (id, estado) => api.get(`/bulk-uploads/${id}/items/`, { params: { estado } }),
  procesar: (id) => api.post(`/bulk-uploads/${id}/procesar/`),
  resumen: () => api.get('/bulk-uploads/resumen/'),
};

// ==================== REPORTS ====================
export const reportsAPI = {
  estadisticas: (params) => api.get('/reports/estadisticas/', { params }),
  exportarCSV: (params) => api.get('/reports/exportar_csv/', { 
    params, 
    responseType: 'blob' 
  }),
  exportarPDF: (params) => api.get('/reports/exportar_pdf/', { 
    params, 
    responseType: 'blob' 
  }),
};

// ==================== AUDIT LOGS ====================
export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs/', { params }),
  getById: (id) => api.get(`/audit-logs/${id}/`),
  estadisticas: () => api.get('/audit-logs/estadisticas/'),
  // Alias de compatibilidad
  resumen: () => api.get('/audit-logs/estadisticas/'),
};

export default api;
