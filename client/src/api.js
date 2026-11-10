import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('ashadi_jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore localStorage access errors
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Listen for 401 Unauthorized and trigger re-auth if token is invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Check if it's an auth endpoint; don't trigger logout on failed login attempt itself
      if (!error.config.url.includes('/auth/login')) {
        try {
          localStorage.removeItem('ashadi_jwt_token');
          localStorage.removeItem('ashadi_admin_user');
          window.dispatchEvent(new Event('ashadi:auth_expired'));
        } catch (e) {}
      }
    }
    return Promise.reject(error);
  }
);

export default api;
