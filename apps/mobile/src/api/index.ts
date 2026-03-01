import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// In React Native, localhost doesn't work for Android emulators (needs 10.0.2.2). 
// Using a placeholder API URL for now. In production, this would be an env var.
const API_URL = 'http://192.168.29.164:3001/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Auto logout
            useAuthStore.getState().logout();
        }
        return Promise.reject(error.response?.data || error);
    }
);
