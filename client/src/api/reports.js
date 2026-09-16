import api from './client';

export const fetchReport = (month, year) => api.get('/reports', { params: { month, year } });