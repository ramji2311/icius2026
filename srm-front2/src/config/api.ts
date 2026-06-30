import axios from 'axios';

// Always send cookies (including HTTP-only auth cookie) with requests
axios.defaults.withCredentials = true;

// Hosted/local backend configuration
const PRIMARY_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SECONDARY_URL = 'http://localhost:5000';

// Track current working base URL globally
let currentBaseUrl = PRIMARY_URL;

// Simple cookie reader (for non-HTTP-only cookies if ever needed)
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

// Create axios instance with common configuration
const api = axios.create({
  baseURL: currentBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach token from localStorage as fallback
// and sync baseURL dynamically to the currently working backend
api.interceptors.request.use(
  (config) => {
    config.baseURL = currentBaseUrl;

    // 1. Get token from localStorage as a fallback if cookies are blocked
    const token = localStorage.getItem('token');
    if (token) {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: automatically failover to secondary URL if primary server fails
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If request config exists and hasn't been retried yet
    if (originalRequest && !originalRequest._retry) {
      // Treat network errors or server 5xx errors as failover conditions
      const isServerError = !error.response || error.response.status >= 500;

      if (isServerError && currentBaseUrl === PRIMARY_URL) {
        console.warn(`⚠️ Primary backend (${PRIMARY_URL}) failed. Switching to fallback URL (${SECONDARY_URL})...`);
        originalRequest._retry = true;

        // Switch the globally active base URL
        currentBaseUrl = SECONDARY_URL;
        api.defaults.baseURL = currentBaseUrl;
        originalRequest.baseURL = currentBaseUrl;

        // If the original request url was fully resolved to absolute, rewrite it
        if (originalRequest.url?.startsWith(PRIMARY_URL)) {
          originalRequest.url = originalRequest.url.replace(PRIMARY_URL, SECONDARY_URL);
        }

        // Re-run the request using the updated base URL
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// Export API_BASE_URL as primary for initial references, along with dynamic helper
const API_BASE_URL = PRIMARY_URL;
export const getCurrentBaseUrl = () => currentBaseUrl;
export const getSecondaryBaseUrl = () => SECONDARY_URL;

export default api;
export { API_BASE_URL, getCookie };
