import api from './client';

export const fetchSIPs = () => api.get('/sips');
export const createSIP = (data) => api.post('/sips', data);
export const updateSIP = (id, data) => api.put(`/sips/${id}`, data);
export const deleteSIP = (id) => api.delete(`/sips/${id}`);