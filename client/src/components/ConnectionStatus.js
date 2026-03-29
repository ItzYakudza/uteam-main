/**
 * Connection Status Component
 * Shows notification when server connection is lost
 */

import React, { useState, useEffect } from 'react';
import './ConnectionStatus.css';
import api from '../utils/api';

const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [isChecking, setIsChecking] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Проверка соединения с сервером
    const checkConnection = async () => {
        try {
            setIsChecking(true);
            await api.get('/health', { timeout: 5000, _retryCount: 3 }); // Не retry для health check
            setIsOnline(true);
            setRetryCount(0);
        } catch (error) {
            setIsOnline(false);
            setRetryCount(prev => prev + 1);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        // Проверяем соединение каждые 30 секунд
        const interval = setInterval(checkConnection, 30000);
        
        // Слушаем события браузера
        const handleOnline = () => checkConnection();
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Проверяем при монтировании
        checkConnection();
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Автоматическая повторная проверка при потере соединения
    useEffect(() => {
        if (!isOnline && !isChecking) {
            const retryTimeout = setTimeout(() => {
                checkConnection();
            }, Math.min(5000 * retryCount, 30000)); // Макс 30 сек между попытками
            
            return () => clearTimeout(retryTimeout);
        }
    }, [isOnline, isChecking, retryCount]);

    if (isOnline) return null;

    return (
        <div className="connection-status">
            <div className="connection-status-content">
                <div className="connection-icon">
                    {isChecking ? (
                        <div className="spinner"></div>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"/>
                        </svg>
                    )}
                </div>
                <div className="connection-text">
                    <div className="connection-title">
                        {isChecking ? 'Reconnecting...' : 'Connection Lost'}
                    </div>
                    <div className="connection-subtitle">
                        {isChecking 
                            ? 'Please wait...' 
                            : 'Server is updating. Retrying automatically...'}
                    </div>
                </div>
                <button 
                    className="connection-retry-btn" 
                    onClick={checkConnection}
                    disabled={isChecking}
                >
                    Retry Now
                </button>
            </div>
        </div>
    );
};

export default ConnectionStatus;
