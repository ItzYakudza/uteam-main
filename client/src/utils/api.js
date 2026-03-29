import axios from 'axios';

// Базовый URL для API сервера
export const BASE_URL = 'http://72.56.236.196:3001/api'; 

// Отслеживание текущих запросов для избежания дублирования
const pendingRequests = new Map();

// Таймауты для разных типов операций
const TIMEOUT_CONFIG = {
    default: 30000,        // 30 сек для обычных запросов
    upload: 30 * 60 * 1000, // 30 минут для загрузок больших файлов
    download: 30 * 60 * 1000 // 30 минут для скачивания
};

const api = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_CONFIG.default,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Генерируем ключ для отслеживания запроса
const getRequestKey = (config) => {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Добавление токена и установка таймаутов
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('uteam_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Убираем таймаут для:
        // 1. Загрузки/скачивания файлов (/uploads, /download)
        // 2. Отправки игр (/games/submit, /submissions)
        // 3. FormData запросов (многофайловые загрузки)
        const isFileOperation = config.url?.includes('/uploads') || 
                               config.url?.includes('/download') ||
                               config.url?.includes('/games/submit') ||
                               config.url?.includes('/submissions');
        
        const isFormData = config.data instanceof FormData;
        
        if (isFileOperation || isFormData) {
            config.timeout = 0; // БЕЗ ТАЙМАУТА для больших файлов
        } else if (config.method === 'post' || config.method === 'put') {
            config.timeout = TIMEOUT_CONFIG.upload; // 30 минут для других POST/PUT
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