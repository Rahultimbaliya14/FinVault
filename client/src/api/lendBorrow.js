import api from './client';

export const fetchLendBorrowRecords = (params = {}) => api.get('/lend-borrow', { params });
export const createLendBorrowRecord = (data) => api.post('/lend-borrow', data);
export const addRepayment = (id, data) => api.post(`/lend-borrow/${id}/repayments`, data);
export const deleteLendBorrowRecord = (id) => api.delete(`/lend-borrow/${id}`);