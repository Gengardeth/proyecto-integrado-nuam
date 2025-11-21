import api from './httpClient';

export const bulkUploadsService = {
  list: (params = {}) => api.get('/bulk-uploads/', { params }),
  get: (id) => api.get(`/bulk-uploads/${id}/`),
  upload: (formData, onProgress) => api.post('/bulk-uploads/', formData, {
    // Importante: no fijar Content-Type manualmente; el navegador añade el boundary
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        const percent = Math.round((evt.loaded * 100) / evt.total);
        onProgress(percent);
      }
    }
  }),
  items: (id, estado) => api.get(`/bulk-uploads/${id}/items/`, { params: estado ? { estado } : {} }),
  procesar: (id) => api.post(`/bulk-uploads/${id}/procesar/`),
  rechazar: (id) => api.post(`/bulk-uploads/${id}/rechazar/`),
  resumenPropio: () => api.get('/bulk-uploads/resumen/'),
};

export default bulkUploadsService;