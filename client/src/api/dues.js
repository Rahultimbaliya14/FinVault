import api from './client';

export const fetchDues = (month, year) => api.get('/dues', { params: { month, year } });
export const markDuePaid = (refType, refId, month, year) =>
  api.post(`/dues/${refType}/${refId}/pay`, { month, year });
export const markDueSkipped = (refType, refId, month, year) =>
  api.post(`/dues/${refType}/${refId}/skip`, { month, year });