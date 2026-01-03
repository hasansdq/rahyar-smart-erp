import axios from 'axios';

const api = axios.create({
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Essential for HttpOnly cookies
  timeout: 15000 
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('اتصال به سرور زمان‌بر شد.'));
    }

    // Capture 401 specifically
    if (error.response && error.response.status === 401) {
        // Return a specific object so db.init knows it's just "Not Logged In" and not a crash
        return Promise.reject({ isAuthError: true });
    }

    return Promise.reject(error);
  }
);

export default api;