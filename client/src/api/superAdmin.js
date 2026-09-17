import adminApi from './adminClient';

export const loginAdmin = (email, password) => adminApi.post('/superadmin/login', { email, password });
export const fetchDashboardSummary = () => adminApi.get('/superadmin/dashboard');
export const fetchAllUsers = () => adminApi.get('/superadmin/users');
export const updateUserApproval = (userId, isActive) =>
  adminApi.put(`/superadmin/users/${userId}/status`, { isActive });