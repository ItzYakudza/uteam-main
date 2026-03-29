/**
 * api.js - API клиент
 */

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Базовый URL сервера (без /api)
const BASE_URL = import.meta.env.PROD 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';

// API URL (с /api)
const API_URL = `${BASE_URL}/api`;

const api = axios.create({
    baseURL: API_URL
});

// Добавление токена к запросам
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Обработка ошибок авторизации
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export { API_URL, BASE_URL };
export default api;
