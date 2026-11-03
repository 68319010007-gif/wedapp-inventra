import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const storeApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

storeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('inventra_store_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default storeApi;
