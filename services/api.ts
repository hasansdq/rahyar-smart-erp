import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxy in vite config handles the rest
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Crucial for sending cookies
  timeout: 15000 // 15 seconds timeout
});

// Response interceptor to handle timeouts and auth errors
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