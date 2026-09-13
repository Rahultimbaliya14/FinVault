import api from './client';

export const fetchDues = () => api.get('/dues');