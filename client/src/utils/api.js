import axios from 'axios';

const BASE_URL = "http://72.56.236.196:3001";   // ← Твой сервер

console.log('[API Config] BASE_URL =', BASE_URL);

const api = axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Добавление токена
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('uteam_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Авто-retry при сетевых ошибках
api.interceptors.response.use(
    response => response,
    async (error) => {
        const config = error.config || {};
        if (!config._retryCount) config._retryCount = 0;

        const isRetryable = 
            !error.response || 
            error.code === 'ECONNABORTED' || 
            error.message.includes('Network Error') ||
            (error.response && error.response.status >= 500);

        if (isRetryable && config._retryCount < 3) {
            config._retryCount += 1;
            console.log(`[API] Retry ${config._retryCount}/3 for ${config.url}`);
            
            await new Promise(r => setTimeout(r, 1000 * config._retryCount));
            return api(config);
        }

        return Promise.reject(error);
    }
);

export default api;
export { BASE_URL };