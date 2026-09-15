import api from './client';

export const fetchDues = (month, year) => api.get('/dues', { params: { month, year } });