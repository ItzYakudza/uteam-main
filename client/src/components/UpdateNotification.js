/**
 * Update Notification Component
 * Shows in-app notification when update is available
 */

import React, { useState, useEffect } from 'react';
import './UpdateNotification.css';

const UpdateNotification = () => {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // Подписываемся на события обновления
        if (window.electron?.updater) {
            const removeUpdateListener = window.electron.updater.onUpdateAvailable((info) => {
                console.log('[UpdateNotification] Update available:', info);
                setUpdateInfo(info);
                setDismissed(false);
            });

            const removeProgressListener = window.electron.updater.onDownloadProgress((progress) => {
                console.log('[UpdateNotification] Download progress:', progress);
                setDownloadProgress(progress);
            });

            // Проверяем обновления при монтировании
            window.electron.updater.checkForUpdates().then((result) => {
                if (result?.updateAvailable) {
                    setUpdateInfo({
                        currentVersion: result.currentVersion,
                        newVersion: result.newVersion,
                        releaseNotes: result.manifest?.releaseNotes,
                        size: result.manifest?.size
                    });
                }
            });

            return () => {
                if (removeUpdateListener) removeUpdateListener();
                if (removeProgressListener) removeProgressListener();
            };
        }
    }, []);

    const handleUpdate = async () => {
        if (isDownloading) return;
        
        setIsDownloading(true);
        try {
            await window.electron.updater.downloadUpdate();
        } catch (error) {
            console.error('Download failed:', error);
            setIsDownloading(false);
        }
    };

    const handleInstall = () => {
        window.electron.updater.installUpdate();
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatSpeed = (bytesPerSecond) => {
        return formatBytes(bytesPerSecond) + '/s';
    };

    if (!updateInfo || dismissed) {
        return null;
    }

    return (
        <div className={`update-notification ${isExpanded ? 'expanded' : ''}`}>
            <div className="update-notification-main">
                <div className="update-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                    </svg>
                </div>
                
                <div className="update-content">
                    <div className="update-title">
                        Update Available
                        <span className="version-badge">{updateInfo.newVersion}</span>
                    </div>
                    
                    {!isDownloading && !downloadProgress?.complete && (
                        <div className="update-info">
                            {updateInfo.currentVersion} → {updateInfo.newVersion}
                            {updateInfo.size && (
                                <span className="update-size"> • {formatBytes(updateInfo.size)}</span>
                            )}
                        </div>
                    )}
                    
                    {isDownloading && downloadProgress && (
                        <div className="download-progress">
                            <div className="progress-bar-container">
                                <div 
                                    className="progress-bar-fill" 
                                    style={{ width: `${downloadProgress.percent || 0}%` }}
                                />
                            </div>
                            <div className="progress-info">
                                <span>{formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}</span>
                                <span>{formatSpeed(downloadProgress.bytesPerSecond)}</span>
                            </div>
                        </div>
                    )}
                    
                    {downloadProgress?.complete && (
                        <div className="update-ready">
                            Update downloaded. Restart to apply.
                        </div>
                    )}
                </div>
                
                <div className="update-actions">
                    {!isDownloading && !downloadProgress?.complete && (
                        <>
                            <button className="btn-dismiss" onClick={handleDismiss} title="Dismiss">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                            <button className="btn-update" onClick={handleUpdate}>
                                Update
                            </button>
                        </>
                    )}
                    
                    {isDownloading && !downloadProgress?.complete && (
                        <div className="downloading-indicator">
                            <div className="spinner"></div>
                        </div>
                    )}
                    
                    {downloadProgress?.complete && (
                        <button className="btn-restart" onClick={handleInstall}>
                            Restart Now
                        </button>
                    )}
                </div>
            </div>
            
            {updateInfo.releaseNotes && (
                <div className="update-expand" onClick={() => setIsExpanded(!isExpanded)}>
                    <span>{isExpanded ? 'Hide' : 'Show'} Release Notes</span>
                    <svg viewBox="0 0 24 24" fill="currentColor" className={isExpanded ? 'rotated' : ''}>
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                </div>
            )}
            
            {isExpanded && updateInfo.releaseNotes && (
                <div className="release-notes">
                    <pre>{updateInfo.releaseNotes}</pre>
                </div>
            )}
        </div>
    );
};

export default UpdateNotification;
