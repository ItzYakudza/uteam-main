import axios from 'axios';

// Базовый URL для API сервера
export const BASE_URL = 'http://72.56.236.196:3001/api'; 

// Отслеживание текущих запросов для избежания дублирования
const pendingRequests = new Map();

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 300000, // 5 минут для загрузки больших файлов
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Генерируем ключ для отслеживания запроса
const getRequestKey = (config) => {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Добавление токена
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('uteam_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Пропускаем дублирование для загрузок и важных операций
        if (config.method !== 'get' && config.method !== 'head') {
            return config;
        }
        
        // Для GET запросов - проверяем, не отправляется ли уже такой же запрос
        const requestKey = getRequestKey(config);
        if (pendingRequests.has(requestKey)) {
            // Возвращаем результат текущего запроса вместо повторного
            return pendingRequests.get(requestKey);
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Авто-retry при сетевых ошибках (только для GET и допустимых методов)
api.interceptors.response.use(
    response => {
        const requestKey = getRequestKey(response.config);
        pendingRequests.delete(requestKey);
        return response;
    },
    async (error) => {
        const config = error.config || {};
        if (!config._retryCount) config._retryCount = 0;

        // Не повторяем POST/PUT/DELETE запросы
        const isIdempotent = config.method === 'get' || config.method === 'head';
        
        // Не повторяем загрузки файлов
        const isUpload = config.headers?.['Content-Type']?.includes('multipart/form-data');

        const isRetryable = isIdempotent && !isUpload &&
            (!error.response || 
            error.code === 'ECONNABORTED' || 
            error.message.includes('Network Error') ||
            (error.response && error.response.status >= 500));

        if (isRetryable && config._retryCount < 2) { // Максимум 2 повтора
            config._retryCount += 1;
            console.log(`[API] Retry ${config._retryCount}/2 for ${config.url}`);
            
            await new Promise(r => setTimeout(r, 1000 * config._retryCount));
            return api(config);
        }

        const requestKey = getRequestKey(config);
        pendingRequests.delete(requestKey);

        return Promise.reject(error);
    }
);

export default api;