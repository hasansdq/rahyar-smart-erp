import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxy in vite config handles the rest
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle timeouts explicitly
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('اتصال به سرور زمان‌بر شد. لطفا اینترنت خود را بررسی کنید.'));
    }
    return Promise.reject(error);
  }
);

export default api;