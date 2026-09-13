import api from './client';

export const fetchCards = () => api.get('/cards');
export const createCard = (data) => api.post('/cards', data);
export const recordPurchase = (cardId, data) => api.post(`/cards/${cardId}/purchases`, data);
export const fetchBillingCycles = (cardId) => api.get(`/cards/${cardId}/cycles`);
export const payBillingCycle = (cardId, cycleId) => api.put(`/cards/${cardId}/cycles/${cycleId}/pay`);