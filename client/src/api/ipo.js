import api from './client';

export const fetchIPOs = (status) => api.get('/ipos', { params: { status } });
export const createIPO = (data) => api.post('/ipos', data);
export const markIPOAllotted = (id) => api.put(`/ipos/${id}/allot`);
export const markIPONotAllotted = (id) => api.put(`/ipos/${id}/not-allot`);
export const cancelIPO = (id) => api.delete(`/ipos/${id}`);