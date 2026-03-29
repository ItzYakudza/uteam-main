import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../utils/i18n';
import api, { BASE_URL } from '../utils/api';
import './Library.css';

// Default fallback images as data URI
const DEFAULT_GAME_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0Ij48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMxYjI4MzgiLz48dGV4dCB4PSIzMiIgeT0iMzYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NmMwZjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfjq48L3RleHQ+PC9zdmc+';
const DEFAULT_COVER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NjAiIGhlaWdodD0iMjE1IiB2aWV3Qm94PSIwIDAgNDYwIDIxNSI+PHJlY3Qgd2lkdGg9IjQ2MCIgaGVpZ2h0PSIyMTUiIGZpbGw9IiMxYjI4MzgiLz48dGV4dCB4PSIyMzAiIHk9IjExNSIgZm9udC1zaXplPSI0OCIgZmlsbD0iIzY2YzBmNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+Orizwn46uPC90ZXh0Pjwvc3ZnPg==';

function Library() {
    const { token } = useAuthStore();
    const { t } = useTranslation();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [downloadProgress, setDownloadProgress] = useState({});
    const [runningGames, setRunningGames] = useState({});

    useEffect(() => {
        fetchLibrary();
    }, [token]);

    useEffect(() => {
        if (window.electronAPI) {
            const removeListener = window.electronAPI.game.onDownloadProgress((progress) => {
                setDownloadProgress(prev => ({
                    ...prev,
                    [progress.gameId]: progress
                }));
                if (progress.status === 'completed' || progress.status === 'error') {
                    setTimeout(() => {
                        setDownloadProgress(prev => {
                            const newProgress = { ...prev };
                            delete newProgress[progress.gameId];
                            return newProgress;
                        });
                        fetchLibrary();
                    }, 1500);
                }
            });
            return () => removeListener && removeListener();
        }
    }, []);

    const fetchLibrary = async () => {
        try {
            const response = await api.get('/library', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const libraryData = response.data.library || response.data;
            // Фильтруем записи с null game (игра была удалена из БД)
            const validLibrary = libraryData.filter(item => item && item.game && item.game._id);
            setGames(validLibrary);
            if (!selectedGame && validLibrary.length > 0) {
                setSelectedGame(validLibrary[0]);
            } else if (selectedGame && selectedGame.game) {
                const updated = validLibrary.find(g => g.game && g.game._id === selectedGame.game._id);
                if (updated) setSelectedGame(updated);
                else if (validLibrary.length > 0) setSelectedGame(validLibrary[0]);
                else setSelectedGame(null);
            }
        } catch (error) {
            console.error('Error fetching library:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInstall = async (libraryItem) => {
        if (!window.electronAPI) {
            alert('Install only available in desktop app');
            return;
        }
        if (!libraryItem.game) {
            alert('Game data not available');
            return;
        }
        const game = libraryItem.game;
        // Приоритет: externalDownloadUrl > gameArchive > downloadUrl
        const archiveUrl = game.externalDownloadUrl || game.gameArchive || game.downloadUrl;
        if (!archiveUrl) {
            alert('No download available');
            return;
        }
        try {
            const downloadUrl = archiveUrl.startsWith('http') ? archiveUrl : `${BASE_URL}${archiveUrl}`;
            const result = await window.electronAPI.game.install({
                gameId: game._id,
                downloadUrl: downloadUrl,
                title: game.title,
                token: token
            });
            if (result.success) {
                await api.put(`/library/${game._id}/install`, {
                    installPath: result.installPath,
                    executablePath: result.executablePath
                }, { headers: { Authorization: `Bearer ${token}` } });
                fetchLibrary();
            }
        } catch (error) {
            console.error('Install error:', error);
            alert('Install failed: ' + (error.message || 'Unknown error'));
        }
    };

    const handleUninstall = async (libraryItem) => {
        if (!window.electronAPI) return;
        if (!libraryItem.game || !libraryItem.game._id) return;
        if (!window.confirm('Uninstall this game?')) return;
        try {
            await window.electronAPI.game.uninstall(libraryItem.game._id);
            await api.put(`/library/${libraryItem.game._id}/uninstall`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLibrary();
        } catch (error) {
            console.error('Uninstall error:', error);
        }
    };

    const handlePlay = async (libraryItem) => {
        if (!window.electronAPI) return;
        if (!libraryItem.game) return;
        const game = libraryItem.game;
        try {
            const exePath = libraryItem.executablePath;
            if (!exePath) {
                alert('Game executable not found');
                return;
            }
            setRunningGames(prev => ({ ...prev, [game._id]: true }));
            window.electronAPI.game.launch({
                executablePath: exePath,
                title: game.title,
                gameId: game._id
            });
            setTimeout(() => {
                setRunningGames(prev => ({ ...prev, [game._id]: false }));
            }, 5000);
        } catch (error) {
            console.error('Launch error:', error);
            setRunningGames(prev => ({ ...prev, [game._id]: false }));
        }
    };

    const handleOpenFolder = async (libraryItem) => {
        if (!window.electronAPI) return;
        if (!libraryItem.game || !libraryItem.game._id) return;
        try {
            await window.electronAPI.game.openFolder(libraryItem.game._id);
        } catch (error) {
            console.error('Open folder error:', error);
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return null;
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const formatPlayTime = (minutes) => {
        if (!minutes || minutes < 1) return t('library.notPlayed') || 'Not played';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}${t('library.hours') || 'h'} ${mins}${t('library.minutes') || 'm'}`;
        return `${mins}${t('library.minutes') || 'm'}`;
    };

    const getGameImage = (game, type = 'cover') => {
        if (!game) return null;
        const field = type === 'cover' ? game.coverImage : (game.gameIcon || game.coverImage);
        if (!field) return null;
        if (field.startsWith('http')) return field;
        return `${BASE_URL}${field}`;
    };

    const filteredGames = games.filter(item => 
        item.game && item.game.title && item.game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="library">
                <div className="library-loading">
                    <div className="library-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="library">
            <div className="library-sidebar">
                <div className="library-sidebar-header">
                    <h2>{t('library.title') || 'Library'}</h2>
                    <div className="library-search">
                        <span className="library-search-icon"></span>
                        <input
                            type="text"
                            placeholder={t('library.search') || 'Search games...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="library-games-list">
                    {filteredGames.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#8f98a0' }}>
                            {games.length === 0 ? (t('library.emptyLibrary') || 'No games in library') : (t('library.nothingFound') || 'No games found')}
                        </div>
                    ) : (
                        filteredGames.map(item => {
                            if (!item.game) return null;
                            const isInstalled = item.installed;
                            const isRunning = runningGames[item.game._id];
                            const progress = downloadProgress[item.game._id];
                            return (
                                <div
                                    key={item._id}
                                    className={`library-game-item ${selectedGame?._id === item._id ? 'active' : ''} ${isInstalled ? 'installed' : ''}`}
                                    onClick={() => setSelectedGame(item)}
                                >
                                    <img
                                        src={getGameImage(item.game, 'icon') || DEFAULT_GAME_ICON}
                                        alt=""
                                        className="library-game-item-icon"
                                        onError={(e) => e.target.src = DEFAULT_GAME_ICON}
                                    />
                                    <div className="library-game-item-info">
                                        <div className="library-game-item-title">{item.game.title || 'Unknown Game'}</div>
                                        <div className={`library-game-item-status ${isRunning ? 'playing' : isInstalled ? 'installed' : ''}`}>
                                            {progress ? `${progress.progress || 0}%` : isRunning ? t('library.running') || 'Running' : isInstalled ? t('library.installed') || 'Installed' : t('library.notInstalled') || 'Not installed'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="library-main">
                {!selectedGame ? (
                    <div className="library-no-selection">
                        <div className="library-no-selection-icon"></div>
                        <h3>{t('library.selectGame') || 'Select a game'}</h3>
                        <p>{t('library.selectGameDesc') || 'Choose a game from your library to view details'}</p>
                    </div>
                ) : !selectedGame.game ? (
                    <div className="library-no-selection">
                        <div className="library-no-selection-text">{t('library.gameNotAvailable') || 'Game data not available'}</div>
                    </div>
                ) : (
                    <>
                        <div
                            className="library-game-hero"
                            style={{ backgroundImage: `url(${getGameImage(selectedGame.game, 'cover') || DEFAULT_COVER})` }}
                        >
                            <div className="library-game-hero-content">
                                <h1 className="library-game-hero-title">{selectedGame.game.title || 'Unknown Game'}</h1>
                                <div className="library-game-hero-meta">
                                    <span> {selectedGame.game.developerName || (t('library.unknown') || 'Unknown')}</span>
                                    <span> {formatPlayTime(selectedGame.playTime)}</span>
                                    {selectedGame.lastPlayed && (
                                        <span> {t('library.lastPlayedShort') || 'Last'}: {new Date(selectedGame.lastPlayed).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="library-game-content">
                            {selectedGame.game._id && downloadProgress[selectedGame.game._id] && (
                                <div className="library-progress-container">
                                    <div className="library-progress-info">
                                        <span>{t('library.downloading') || 'Downloading...'}</span>
                                        <span>{downloadProgress[selectedGame.game._id].progress || 0}%</span>
                                    </div>
                                    <div className="library-progress-bar">
                                        <div
                                            className="library-progress-fill"
                                            style={{ width: `${downloadProgress[selectedGame.game._id].progress || 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="library-progress-details">
                                        <span>{downloadProgress[selectedGame.game._id].speed || '0 B/s'}</span>
                                        <span>{downloadProgress[selectedGame.game._id].downloaded || '0 B'} / {downloadProgress[selectedGame.game._id].total || '0 B'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="library-game-actions">
                                {selectedGame.installed ? (
                                    <>
                                        <button
                                            className="library-game-btn play"
                                            onClick={() => handlePlay(selectedGame)}
                                            disabled={selectedGame.game._id && runningGames[selectedGame.game._id]}
                                        >
                                            {selectedGame.game._id && runningGames[selectedGame.game._id] ? (t('library.running') || 'Running...') : (t('library.play') || 'Play')}
                                        </button>
                                        <button
                                            className="library-game-btn secondary"
                                            onClick={() => handleOpenFolder(selectedGame)}
                                        >
                                            {t('library.openFolder') || 'Open Folder'}
                                        </button>
                                        <button
                                            className="library-game-btn danger"
                                            onClick={() => handleUninstall(selectedGame)}
                                        >
                                            {t('library.uninstall') || 'Uninstall'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="library-game-btn primary"
                                        onClick={() => handleInstall(selectedGame)}
                                        disabled={selectedGame.game._id && !!downloadProgress[selectedGame.game._id]}
                                    >
                                        {selectedGame.game._id && downloadProgress[selectedGame.game._id] ? (t('library.installing') || 'Installing...') : (t('library.install') || 'Install')}
                                    </button>
                                )}
                            </div>

                            <div className="library-game-info-grid">
                                <div className="library-game-info-card">
                                    <h4>{t('library.playTime') || 'Play Time'}</h4>
                                    <p>{formatPlayTime(selectedGame.playTime)}</p>
                                </div>
                                <div className="library-game-info-card">
                                    <h4>{t('library.added') || 'Added'}</h4>
                                    <p>{new Date(selectedGame.addedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="library-game-info-card">
                                    <h4>{t('library.genre') || 'Genre'}</h4>
                                    <p>{selectedGame.game.categories?.join(', ') || (t('library.notSpecified') || 'Not specified')}</p>
                                </div>
                                <div className="library-game-info-card">
                                    <h4>{t('library.developer') || 'Developer'}</h4>
                                    <p>{selectedGame.game.developerName || (t('library.unknown') || 'Unknown')}</p>
                                </div>
                            </div>

                            {selectedGame.installed && (
                                <div className="library-game-properties">
                                    <h3>{t('library.properties') || 'Properties'}</h3>
                                    <div className="library-properties-grid">
                                        <div className="library-property-item">
                                            <span className="property-label">{t('library.version') || 'Version'}</span>
                                            <span className="property-value">{selectedGame.game.version || '1.0'}</span>
                                        </div>
                                        <div className="library-property-item">
                                            <span className="property-label">{t('library.size') || 'Size'}</span>
                                            <span className="property-value">{formatSize(selectedGame.game.size) || (t('library.unknown') || 'Unknown')}</span>
                                        </div>
                                        <div className="library-property-item">
                                            <span className="property-label">{t('library.installDate') || 'Install Date'}</span>
                                            <span className="property-value">{selectedGame.installedAt ? new Date(selectedGame.installedAt).toLocaleDateString() : (t('library.unknown') || 'Unknown')}</span>
                                        </div>
                                        <div className="library-property-item">
                                            <span className="property-label">{t('library.lastPlayed') || 'Last Played'}</span>
                                            <span className="property-value">{selectedGame.lastPlayed ? new Date(selectedGame.lastPlayed).toLocaleDateString() : (t('library.never') || 'Never')}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedGame.game.description && (
                                <div className="library-game-description">
                                    <h3>{t('library.about') || 'About'}</h3>
                                    <p>{selectedGame.game.description}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Library;