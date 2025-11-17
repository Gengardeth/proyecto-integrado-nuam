import api from './httpClient';

export const issuersService = {
  list: (params = {}) => api.get('/issuers/', { params }),
  get: (id) => api.get(`/issuers/${id}/`),
  create: (data) => api.post('/issuers/', data),
  update: (id, data) => api.put(`/issuers/${id}/`, data),
  remove: (id) => api.delete(`/issuers/${id}/`),
  listActive: () => api.get('/issuers/?activo=true'), // suponiendo filtro activo
};

export default issuersService;