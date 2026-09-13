import axios from 'axios';

// Point this to your deployed backend URL once you deploy to Vercel.
// For local development, this hits your Express server running on port 5000.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attaches the JWT to every outgoing request automatically,
// so individual components never need to worry about auth headers.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cashledger_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever returns 401 (expired/invalid token), log the
// user out and send them back to login instead of showing a broken page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('cashledger_token');
      localStorage.removeItem('cashledger_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;