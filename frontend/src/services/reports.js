import api from './httpClient';

// Servicios para Reportes
export const reportsService = {
  estadisticas: (params = {}) => api.get('/reports/estadisticas/', { params }),
  exportCSV: (params = {}) => api.get('/reports/exportar_csv/', { params, responseType: 'blob' }),
  exportPDF: (params = {}) => api.get('/reports/exportar_pdf/', { params, responseType: 'blob' }),
};

export default reportsService;