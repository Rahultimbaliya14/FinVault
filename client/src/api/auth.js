import api from './client';

export const registerUser = (email, password) =>
  api.post('/auth/register', { email, password });

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

export const refreshAccessToken = (refreshToken) =>
  api.post('/auth/refresh', { refreshToken });

export const logoutUser = (refreshToken) =>
  api.post('/auth/logout', { refreshToken });