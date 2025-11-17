import api from './httpClient';

export const instrumentsService = {
  list: (params = {}) => api.get('/instruments/', { params }),
  get: (id) => api.get(`/instruments/${id}/`),
  create: (data) => api.post('/instruments/', data),
  update: (id, data) => api.put(`/instruments/${id}/`, data),
  remove: (id) => api.delete(`/instruments/${id}/`),
  listActive: () => api.get('/instruments/?activo=true'),
};

export default instrumentsService;