import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('inventra_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/login') && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('inventra_token');
      localStorage.removeItem('inventra_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
