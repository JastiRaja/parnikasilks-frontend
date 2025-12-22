import axios from 'axios';
import { API_URL } from '../config';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Validate API URL
if (!API_URL) {
  console.warn('VITE_API_URL is not set. API calls may fail.');
}

const instance = axios.create({
  baseURL: API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for regular requests
});

// Separate instance for file uploads with longer timeout
export const uploadInstance = axios.create({
  baseURL: API_URL || 'http://localhost:5000',
  timeout: 120000, // 2 minutes timeout for file uploads
});

// Add a request interceptor to add the auth token to requests
const addAuthToken = (config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

instance.interceptors.request.use(addAuthToken, (error) => {
  return Promise.reject(error);
});

// Add auth token to upload instance as well
uploadInstance.interceptors.request.use(addAuthToken, (error) => {
  return Promise.reject(error);
});

// Response interceptor
const handleResponseError = (error: any) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  // Suppress logging for 404 errors to avoid exposing backend URLs
  // 404s are expected for optional resources like slides
  if (error.response?.status === 404) {
    // Silently handle 404 errors - don't log backend URLs
    return Promise.reject(error);
  }
  
  // Better error logging for other errors (without exposing full URLs)
  if (error.code === 'ECONNABORTED') {
    console.error('Request timeout');
  } else if (error.response) {
    // Only log status code, not the full URL or backend details
    console.error('API Error:', error.response.status);
  } else if (error.request) {
    console.error('Network Error');
  } else {
    console.error('Error:', error.message);
  }
  
  return Promise.reject(error);
};

instance.interceptors.response.use(
  (response) => response,
  handleResponseError
);

uploadInstance.interceptors.response.use(
  (response) => response,
  handleResponseError
);

export default instance; 