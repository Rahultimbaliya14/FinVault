import api from './client';

export const fetchTransactions = (params = {}) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const createTransfer = (data) => api.post('/transactions/transfer', data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);