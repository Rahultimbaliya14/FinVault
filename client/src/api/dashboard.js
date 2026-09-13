import api from './client';

export const fetchDashboard = () => api.get('/dashboard');