/**
 * Store для аутентификации (Zustand)
 * Использует зашифрованное хранилище для токенов
 * ВАЖНО: deviceId хранится как в localStorage так и в secure store для надежности
 */

import { create } from 'zustand';
import api from '../utils/api';

// Таймаут для промисов
const withTimeout = (promise, ms) => {
    const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
    );
    return Promise.race([promise, timeout]);
};

// Генерация ID устройства
const generateDeviceId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Получение deviceId из всех источников
const getDeviceId = async () => {
    // Сначала пробуем secure store (самый надежный)
    if (window.electronAPI?.secure) {
        try {
            const secureDeviceId = await withTimeout(window.electronAPI.secure.get('deviceId'), 1000);
            if (secureDeviceId) {
                // Синхронизируем с localStorage
                localStorage.setItem('uteam_device_id', secureDeviceId);
                return secureDeviceId;
            }
        } catch (e) {}
    }
    
    // Потом localStorage
    const localDeviceId = localStorage.getItem('uteam_device_id');
    if (localDeviceId) {
        // Синхронизируем с secure store если есть
        if (window.electronAPI?.secure) {
            try {
                await window.electronAPI.secure.set('deviceId', localDeviceId);
            } catch (e) {}
        }
        return localDeviceId;
    }
    
    // Генерируем новый
    const newDeviceId = generateDeviceId();
    localStorage.setItem('uteam_device_id', newDeviceId);
    if (window.electronAPI?.secure) {
        try {
            await window.electronAPI.secure.set('deviceId', newDeviceId);
        } catch (e) {}
    }
    return newDeviceId;
};

// Получение информации об устройстве
const getDeviceInfo = async () => {
    const deviceId = await getDeviceId();
    return {
        deviceId,
        deviceName: navigator.platform || 'Unknown',
        platform: navigator.platform || 'Unknown',
        browser: navigator.userAgent || 'Unknown'
    };
};

// Безопасное сохранение токена и deviceId
const saveCredentials = async (token, deviceId) => {
    // Сохраняем в localStorage (fallback)
    localStorage.setItem('uteam_token', token);
    localStorage.setItem('uteam_device_id', deviceId);
    
    // Сохраняем в Electron secure store (основное хранилище)
    if (window.electronAPI?.secure) {
        try {
            await window.electronAPI.secure.set('token', token);
            await window.electronAPI.secure.set('deviceId', deviceId);
        } catch (e) {
            console.error('Secure store save error:', e);
        }
    }
};

// Безопасное получение токена
const getToken = async () => {
    // Сначала пробуем Electron secure store
    if (window.electronAPI?.secure) {
        try {
            const token = await withTimeout(window.electronAPI.secure.get('token'), 2000);
            if (token) {
                // Синхронизируем с localStorage
                localStorage.setItem('uteam_token', token);
                return token;
            }
        } catch (e) {
            console.log('Secure store get failed, trying localStorage');
        }
    }
    // Fallback на localStorage
    return localStorage.getItem('uteam_token');
};

// Удаление всех credentials
const removeCredentials = async () => {
    localStorage.removeItem('uteam_token');
    // НЕ удаляем deviceId - он должен оставаться для этого устройства
    
    if (window.electronAPI?.secure) {
        try {
            await window.electronAPI.secure.delete('token');
            // deviceId НЕ удаляем
        } catch (e) {}
    }
};

export const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    deviceId: null,
    loading: false,
    error: null,
    authChecked: false,

    // Проверка авторизации при запуске (вызывается один раз)
    checkAuth: async () => {
        const state = get();
        // Предотвращаем повторные вызовы
        if (state.authChecked || state.loading) {
            return;
        }
        
        set({ loading: true });
        
        try {
            // Получаем токен и deviceId из всех хранилищ
            const token = await getToken();
            const deviceId = await getDeviceId();

            // Обновляем deviceId в store
            set({ deviceId });

            if (!token) {
                set({ authChecked: true, loading: false });
                return;
            }

            // Пробуем автовход с токеном и deviceId
            try {
                const tokenResponse = await withTimeout(
                    api.post('/auth/token-login', { token, deviceId }),
                    8000
                );
                
                if (tokenResponse.data?.user) {
                    set({ 
                        user: tokenResponse.data.user, 
                        token,
                        deviceId,
                        authChecked: true,
                        loading: false
                    });
                    return;
                }
            } catch (e) {
                console.log('Token-login failed, trying verify');
            }

            // Fallback - проверяем токен напрямую
            try {
                const response = await withTimeout(
                    api.get('/auth/verify', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    8000
                );

                if (response.data?.valid && response.data?.user) {
                    set({ 
                        user: response.data.user, 
                        token,
                        deviceId,
                        authChecked: true,
                        loading: false
                    });
                    return;
                }
            } catch (verifyError) {
                // Токен невалиден
            }
            
            // Не удалось авторизоваться - очищаем токены
            await removeCredentials();
            set({ authChecked: true, loading: false });
            
        } catch (error) {
            console.error('checkAuth error:', error.message);
            await removeCredentials();
            set({ authChecked: true, loading: false });
        }
    },

    // Вход
    login: async (login, password) => {
        set({ loading: true, error: null });
        try {
            const deviceInfo = await getDeviceInfo();
            const response = await api.post('/auth/login', { 
                login, 
                password,
                deviceInfo 
            });
            const { token, user, deviceId } = response.data;

            // Сохраняем credentials в защищённое хранилище
            await saveCredentials(token, deviceId);

            set({ user, token, deviceId, loading: false });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка входа. Проверьте подключение к интернету.';
            set({ loading: false, error: message });
            return { success: false, error: message };
        }
    },

    // Регистрация
    register: async (username, email, password) => {
        set({ loading: true, error: null });
        try {
            const deviceInfo = await getDeviceInfo();
            const response = await api.post('/auth/register', { 
                username, 
                email, 
                password,
                deviceInfo 
            });
            const { token, user, deviceId } = response.data;

            // Сохраняем credentials в защищённое хранилище
            await saveCredentials(token, deviceId);

            set({ user, token, deviceId, loading: false });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка регистрации';
            set({ loading: false, error: message });
            return { success: false, error: message };
        }
    },

    // Выход
    logout: async () => {
        try {
            const { token } = get();
            if (token) {
                await api.post('/auth/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => {});
            }
        } catch (e) {}

        await removeCredentials();
        // deviceId сохраняется для этого устройства
        const deviceId = await getDeviceId();
        set({ user: null, token: null, deviceId, authChecked: true });
    },

    // Получение списка устройств
    getDevices: async () => {
        try {
            const { token, deviceId } = get();
            const response = await api.get('/auth/devices', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'X-Device-Id': deviceId
                }
            });
            return response.data.devices;
        } catch (error) {
            console.error('Get devices error:', error);
            return [];
        }
    },

    // Отключение устройства
    disconnectDevice: async (targetDeviceId) => {
        try {
            const { token, deviceId } = get();
            await api.delete(`/auth/devices/${targetDeviceId}`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'X-Device-Id': deviceId
                }
            });
            return { success: true };
        } catch (error) {
            console.error('Disconnect device error:', error);
            return { success: false, error: error.response?.data?.error || 'Ошибка' };
        }
    },

    // Отключение всех устройств
    disconnectAllDevices: async () => {
        try {
            const { token, deviceId } = get();
            await api.delete('/auth/devices', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'X-Device-Id': deviceId
                }
            });
            return { success: true };
        } catch (error) {
            console.error('Disconnect all devices error:', error);
            return { success: false, error: error.response?.data?.error || 'Ошибка' };
        }
    },

    // Обновление данных пользователя
    updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
    },

    // Очистка ошибки
    clearError: () => {
        set({ error: null });
    }
}));
