import api from './client';

export const fetchEMIs = () => api.get('/emis');
export const createEMI = (data) => api.post('/emis', data);
export const updateEMI = (id, data) => api.put(`/emis/${id}`, data);
export const deleteEMI = (id) => api.delete(`/emis/${id}`);