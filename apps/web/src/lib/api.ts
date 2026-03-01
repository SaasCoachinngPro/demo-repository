import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Create an Axios instance with base configuration
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle global errors like 401 Unauthorized
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Only auto-logout on explicit auth failures (not on data-fetch failures)
            const url = error.config?.url || '';
            const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/refresh');
            if (isAuthEndpoint) {
                useAuthStore.getState().logout();
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error.response?.data || error);
    }
);
