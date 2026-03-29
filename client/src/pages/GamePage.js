/**
 * GamePage - Game details page with localization
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import { useTranslation } from '../utils/i18n';
import './GamePage.css';

function GamePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, getLanguage } = useTranslation();
    const [game, setGame] = useState(null);
    const [inLibrary, setInLibrary] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [similar, setSimilar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentScreenshot, setCurrentScreenshot] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        loadGame();
    }, [id]);

    useEffect(() => {
        // Проверяем установлена ли игра
        if (game && inLibrary && window.electronAPI?.game?.checkInstalled) {
            window.electronAPI.game.checkInstalled(game._id).then(result => {
                setIsInstalled(result?.installed || false);
            }).catch(() => setIsInstalled(false));
        }
    }, [game, inLibrary]);

    const loadGame = async () => {
        try {
            const token = localStorage.getItem('uteam_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await api.get(`/games/${id}`, { headers });
            setGame(response.data.game);
            setInLibrary(response.data.inLibrary);
            setReviews(response.data.reviews || []);
            setSimilar(response.data.similar || []);
            setIsAdmin(response.data.isAdmin || false);
        } catch (error) {
            console.error('Error loading game:', error);
            navigate('/store');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToLibrary = async () => {
        try {
            const token = localStorage.getItem('uteam_token');
            await api.post(`/library/add/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setInLibrary(true);
        } catch (error) {
            alert(error.response?.data?.error || t('gamePage.addError') || 'Error adding to library');
        }
    };

    const handleInstallGame = async () => {
        if (!window.electronAPI?.game?.install) {
            alert('Installation only available in desktop app');
            return;
        }
        setInstalling(true);
        try {
            // Используем externalDownloadUrl если есть, иначе gameArchive
            const downloadUrl = game.externalDownloadUrl || `${BASE_URL}${game.gameArchive}`;
            const token = localStorage.getItem('uteam_token');
            
            const result = await window.electronAPI.game.install({
                gameId: game._id,
                title: game.title,
                downloadUrl: downloadUrl,
                gameType: game.gameType,
                token: token
            });
            if (result?.success) {
                setIsInstalled(true);
            } else {
                alert(result?.error || 'Installation failed');
            }
        } catch (e) {
            console.error('Install error:', e);
            alert('Installation failed');
        } finally {
            setInstalling(false);
        }
    };

    const handleDeleteGame = async () => {
        if (!window.confirm(t('gamePage.confirmDelete') || 'Are you sure you want to delete this game? This cannot be undone.')) {
            return;
        }
        try {
            const token = localStorage.getItem('uteam_token');
            await api.delete(`/games/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            alert(t('gamePage.deleted') || 'Game deleted');
            navigate('/store');
        } catch (error) {
            alert(error.response?.data?.error || 'Error deleting game');
        }
    };

    const handlePlayGame = () => {
        if (!window.electronAPI) {
            // В браузере открываем игру в новом окне (если это HTML/Web игра)
            const gameUrl = game.gameUrl || `${BASE_URL}/games${game.gamePath}/index.html`;
            window.open(gameUrl, '_blank');
            return;
        }

        // Определяем тип игры и запускаем соответственно
        if (game.gameType === 'executable') {
            // EXE игра - передаём gameId чтобы главный процесс рассчитал путь
            window.electronAPI.game.launch({
                gameId: game._id,
                title: game.title,
                executablePath: game.executablePath || 'game.exe'
            });
        } else {
            // HTML/Web игра
            window.electronAPI.game.launchWeb({
                gameId: game._id,
                title: game.title,
                gameUrl: game.gameUrl,
                gamePath: game.gamePath
            });
        }
    };

    if (loading) {
        return (
            <div className="game-page-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!game) {
        return <div>{t('gamePage.notFound') || 'Game not found'}</div>;
    }

    const positivePercent = game.rating && (game.rating.positive + game.rating.negative) > 0
        ? Math.round((game.rating.positive / (game.rating.positive + game.rating.negative)) * 100)
        : 0;
    
    const currentLang = getLanguage();
    
    // Helper для безопасного получения URL изображения
    const getImageUrl = (imagePath, fallback = '') => {
        if (!imagePath) return fallback;
        if (imagePath.startsWith('http')) return imagePath;
        return `${BASE_URL}${imagePath}`;
    };

    return (
        <div className="game-page">
            {/* Шапка с баннером */}
            <div className="game-header">
                <img 
                    src={getImageUrl(game.bannerImage || game.coverImage)}
                    alt={game.title}
                    className="game-header-bg"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
                <div className="game-header-overlay" />
                <div className="game-header-content">
                    <h1 className="game-title">{game.title}</h1>
                    <p className="game-developer">
                        {t('gamePage.developer') || 'Developer'}: <span>{game.developerName || 'Unknown'}</span>
                    </p>
                </div>
            </div>

            <div className="game-content">
                {/* Левая колонка */}
                <div className="game-main">
                    {/* Скриншоты */}
                    {game.screenshots?.length > 0 && (
                        <div className="game-screenshots">
                            <div className="screenshot-main">
                                <img 
                                    src={`${BASE_URL}${game.screenshots[currentScreenshot]}`}
                                    alt="Screenshot"
                                />
                            </div>
                            <div className="screenshot-thumbs">
                                {game.screenshots.map((ss, idx) => (
                                    <img 
                                        key={idx}
                                        src={`${BASE_URL}${ss}`}
                                        alt={`Screenshot ${idx + 1}`}
                                        className={idx === currentScreenshot ? 'active' : ''}
                                        onClick={() => setCurrentScreenshot(idx)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Описание */}
                    <div className="game-description">
                        <h2>{t('gamePage.about') || 'About'}</h2>
                        <p>{game.description}</p>
                    </div>

                    {/* Системные требования */}
                    <div className="game-requirements">
                        <h2>{t('gamePage.requirements') || 'System Requirements'}</h2>
                        <div className="requirements-grid">
                            <div className="requirements-col">
                                <h3>{t('gamePage.minimum') || 'Minimum'}</h3>
                                <ul>
                                    <li><strong>{t('gamePage.os') || 'OS'}:</strong> {game.requirements?.minimum?.os}</li>
                                    <li><strong>{t('gamePage.processor') || 'Processor'}:</strong> {game.requirements?.minimum?.processor}</li>
                                    <li><strong>{t('gamePage.memory') || 'Memory'}:</strong> {game.requirements?.minimum?.memory}</li>
                                    <li><strong>{t('gamePage.graphics') || 'Graphics'}:</strong> {game.requirements?.minimum?.graphics}</li>
                                    <li><strong>{t('gamePage.storage') || 'Storage'}:</strong> {game.requirements?.minimum?.storage}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Отзывы */}
                    <div className="game-reviews">
                        <h2>{t('gamePage.reviews') || 'Reviews'}</h2>
                        {reviews.length === 0 ? (
                            <p className="no-reviews">{t('gamePage.noReviews') || 'No reviews yet'}</p>
                        ) : (
                            reviews.map(review => (
                                <div key={review._id} className="review-card">
                                    <div className="review-header">
                                        <img 
                                            src={`${BASE_URL}${review.user.avatar}`}
                                            alt={review.user.username}
                                            className="review-avatar"
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="%232a475e" width="32" height="32"/></svg>';
                                            }}
                                        />
                                        <div>
                                            <div className="review-username">{review.user.username}</div>
                                            <div className="review-meta">
                                                {t('gamePage.level') || 'Level'} {review.user.level}
                                            </div>
                                        </div>
                                        <div className={`review-rating ${review.recommended ? 'positive' : 'negative'}`}>
                                            {review.recommended 
                                                ? (t('gamePage.recommended') || 'Recommended')
                                                : (t('gamePage.notRecommended') || 'Not Recommended')}
                                        </div>
                                    </div>
                                    <p className="review-content">{review.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Правая колонка - информация */}
                <div className="game-sidebar">
                    {/* Обложка и кнопки */}
                    <div className="game-sidebar-top">
                        <img 
                            src={`${BASE_URL}${game.coverImage}`}
                            alt={game.title}
                            className="game-cover"
                        />
                        
                        <div className="game-price-block">
                            {game.price === 0 ? (
                                <span className="price-free">{t('store.free_label') || 'Free'}</span>
                            ) : (
                                <span className="price">{game.price} ₽</span>
                            )}
                        </div>

                        {/* Кнопки действий */}
                        {inLibrary ? (
                            isInstalled ? (
                                <button className="btn btn-primary game-btn" onClick={handlePlayGame}>
                                    {t('library.play') || 'PLAY'}
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-primary game-btn" 
                                    onClick={handleInstallGame}
                                    disabled={installing}
                                >
                                    {installing 
                                        ? (t('library.installing') || 'Installing...') 
                                        : (t('library.install') || 'Download')}
                                </button>
                            )
                        ) : (
                            <button className="btn btn-primary game-btn" onClick={handleAddToLibrary}>
                                {game.price === 0 
                                    ? (t('store.addToLibrary') || 'Add to Library')
                                    : (t('gamePage.buy') || 'Buy')}
                            </button>
                        )}

                        {/* Кнопка удаления для админа */}
                        {isAdmin && (
                            <button className="btn btn-danger game-btn-delete" onClick={handleDeleteGame}>
                                {t('gamePage.delete') || 'Delete Game'}
                            </button>
                        )}
                    </div>

                    {/* Метаданные */}
                    <div className="game-meta">
                        <div className="meta-item">
                            <span className="meta-label">{t('gamePage.releaseDate') || 'Release Date'}</span>
                            <span className="meta-value">
                                {new Date(game.releaseDate).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US')}
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">{t('gamePage.developer') || 'Developer'}</span>
                            <span className="meta-value">{game.developerName}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">{t('gamePage.downloads') || 'Downloads'}</span>
                            <span className="meta-value">{game.downloads}</span>
                        </div>
                        {(game.rating.positive + game.rating.negative) > 0 && (
                            <div className="meta-item">
                                <span className="meta-label">{t('gamePage.rating') || 'Rating'}</span>
                                <span className={`meta-value rating-${positivePercent >= 70 ? 'positive' : positivePercent >= 40 ? 'mixed' : 'negative'}`}>
                                    {positivePercent}% {t('gamePage.positive') || 'positive'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Теги */}
                    {game.tags?.length > 0 && (
                        <div className="game-tags">
                            {game.tags.map(tag => (
                                <span key={tag} className="tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Похожие игры */}
            {similar.length > 0 && (
                <div className="similar-games">
                    <h2>{t('gamePage.similarGames') || 'Similar Games'}</h2>
                    <div className="similar-grid">
                        {similar.map(g => (
                            <div 
                                key={g._id} 
                                className="similar-card"
                                onClick={() => navigate(`/game/${g._id}`)}
                            >
                                <img 
                                    src={`${BASE_URL}${g.coverImage}`}
                                    alt={g.title}
                                />
                                <span>{g.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GamePage;
