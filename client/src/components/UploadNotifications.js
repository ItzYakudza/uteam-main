import React, { useEffect, useState } from 'react';
import { useUploadStore } from '../store/uploadStore';

/**
 * Hook для отслеживания завершения загрузок
 */
export function useUploadNotifications() {
    const [notifications, setNotifications] = useState([]);
    const uploads = useUploadStore((state) => state.uploads);

    useEffect(() => {
        // Проверяем недавно завершенные загрузки
        Object.entries(uploads).forEach(([uploadId, upload]) => {
            if (upload.status === 'completed' && upload.completedTime) {
                // Если загрузка завершена менее 30 секунд назад - показываем уведомление
                const timePassed = Date.now() - upload.completedTime;
                if (timePassed < 30000) {
                    // Проверяем, что это уведомление еще не показано
                    if (!notifications.find(n => n.uploadId === uploadId)) {
                        setNotifications(prev => [...prev, {
                            uploadId,
                            title: upload.formData?.title,
                            type: 'success'
                        }]);

                        // Удаляем уведомление через 5 секунд
                        setTimeout(() => {
                            setNotifications(prev => prev.filter(n => n.uploadId !== uploadId));
                        }, 5000);
                    }
                }
            } else if (upload.status === 'error' && upload.error) {
                // Показываем ошибку
                if (!notifications.find(n => n.uploadId === uploadId)) {
                    setNotifications(prev => [...prev, {
                        uploadId,
                        title: upload.formData?.title,
                        error: upload.error,
                        type: 'error'
                    }]);

                    // Удаляем уведомление через 8 секунд
                    setTimeout(() => {
                        setNotifications(prev => prev.filter(n => n.uploadId !== uploadId));
                    }, 8000);
                }
            }
        });
    }, [uploads, notifications]);

    return notifications;
}

/**
 * Компонент для отображения тостов уведомлений
 */
function UploadNotifications() {
    const notifications = useUploadNotifications();

    return (
        <div className="upload-notifications-container">
            {notifications.map((notification) => (
                <div
                    key={notification.uploadId}
                    className={`upload-notification upload-notification-${notification.type}`}
                >
                    <div className="notification-icon">
                        {notification.type === 'success' ? '✓' : '✕'}
                    </div>
                    <div className="notification-content">
                        <div className="notification-title">
                            {notification.type === 'success'
                                ? `Игра "${notification.title}" успешно загружена`
                                : `Ошибка загрузки "${notification.title}"`}
                        </div>
                        {notification.error && (
                            <div className="notification-error">{notification.error}</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default UploadNotifications;
