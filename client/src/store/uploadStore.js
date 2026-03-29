import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Upload Store - хранилище для отслеживания загрузок в фоне
 * Сохраняется в localStorage, чтобы выжить при смене вкладок
 */
export const useUploadStore = create(
    persist(
        (set, get) => ({
            // Активные загрузки: { uploadId: { progress, status, formData, error } }
            uploads: {},

            // Добавить загрузку
            addUpload: (uploadId, formData) => {
                set((state) => ({
                    uploads: {
                        ...state.uploads,
                        [uploadId]: {
                            progress: 0,
                            status: 'uploading', // uploading, completed, error
                            formData,
                            startTime: Date.now(),
                            error: null
                        }
                    }
                }));
            },

            // Обновить прогресс
            updateProgress: (uploadId, progress) => {
                set((state) => ({
                    uploads: {
                        ...state.uploads,
                        [uploadId]: {
                            ...state.uploads[uploadId],
                            progress: Math.min(Math.round(progress), 100)
                        }
                    }
                }));
            },

            // Завершить загрузку
            completeUpload: (uploadId) => {
                set((state) => ({
                    uploads: {
                        ...state.uploads,
                        [uploadId]: {
                            ...state.uploads[uploadId],
                            status: 'completed',
                            completedTime: Date.now()
                        }
                    }
                }));
            },

            // Ошибка при загрузке
            errorUpload: (uploadId, error) => {
                set((state) => ({
                    uploads: {
                        ...state.uploads,
                        [uploadId]: {
                            ...state.uploads[uploadId],
                            status: 'error',
                            error: error.message || 'Upload failed'
                        }
                    }
                }));
            },

            // Удалить загрузку из истории (по истечении времени)
            removeUpload: (uploadId) => {
                set((state) => {
                    const newUploads = { ...state.uploads };
                    delete newUploads[uploadId];
                    return { uploads: newUploads };
                });
            },

            // Получить загрузку по ID
            getUpload: (uploadId) => {
                return get().uploads[uploadId];
            },

            // Очистить все завершенные загрузки
            clearCompleted: () => {
                set((state) => {
                    const remaining = {};
                    Object.entries(state.uploads).forEach(([id, upload]) => {
                        if (upload.status === 'uploading') {
                            remaining[id] = upload;
                        }
                    });
                    return { uploads: remaining };
                });
            }
        }),
        {
            name: 'uteam-uploads', // Имя в localStorage
            version: 1
        }
    )
);
