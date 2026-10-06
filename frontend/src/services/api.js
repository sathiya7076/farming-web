import axios from 'axios';

// Dev: VITE_API_URL is empty -> baseURL is '/api' and the Vite proxy forwards it to Express (:5000).
// Prod: VITE_API_URL is the deployed API origin (e.g. https://api.example.com) -> '<origin>/api'.
const origin = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const baseURL = origin ? `${origin}/api` : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // REQUIRED: without this the browser never sends/stores the auth cookie
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// FIX: when the body is FormData (product images), remove the JSON Content-Type so the
// browser sets "multipart/form-data; boundary=..." itself. Otherwise multer gets no files.
api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type'); // axios 1.x (AxiosHeaders)
    } else if (config.headers) {
      delete config.headers['Content-Type']; // axios 0.x (plain object)
    }
  }
  return config;
});

// Turn any axios error into a readable message for toasts / error boxes.
export const errMsg = (err) => {
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that the backend is running.';
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  return err?.response?.data?.message || err?.message || 'Something went wrong';
};

export default api;