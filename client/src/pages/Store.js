/**
 * Store - Страница магазина с локализацией
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import { useTranslation } from '../utils/i18n';
import './Store.css';

function Store() {
    const [featuredData, setFeaturedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        loadStoreData();
    }, []);

    // Автопрокрутка слайдера
    useEffect(() => {
        if (featuredData?.featured?.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide(prev => 
                    (prev + 1) % featuredData.featured.length
                );
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [featuredData]);

    const loadStoreData = async () => {
        try {
            const featuredRes = await api.get('/games/featured');
            setFeaturedData(featuredRes.data);
        } catch (error) {
            console.error('Error loading store:', error);
        } finally {
            setLoading(false);
        }
    };

    const goToGame = (gameId) => {
        navigate(`/game/${gameId}`);
    };

    if (loading) {
        return (
            <div className="store-loading">
                <div className="loading-spinner"></div>
                <p>{t('common.loading') || 'Loading...'}</p>
            </div>
        );
    }

    return (
        <div className="store">
            {/* Слайдер рекомендуемых */}
            {featuredData?.featured?.length > 0 && (
                <section className="store-featured">
                    <div className="featured-slider">
                        {featuredData.featured.map((game, index) => (
                            <div 
                                key={game._id}
                                className={`featured-slide ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => goToGame(game._id)}
                            >
                                <img 
                                    src={`${BASE_URL}${game.bannerImage || game.coverImage}`}
                                    alt={game.title}
                                    className="featured-image"
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><rect fill="%231b2838" width="800" height="400"/><text x="50%" y="50%" fill="%2366c0f4" font-size="48" text-anchor="middle" dy=".3em">' + game.title + '</text></svg>';
                                    }}
                                />
                                <div className="featured-info">
                                    <h2 className="featured-title">{game.title}</h2>
                                    <p className="featured-desc">{game.shortDescription}</p>
                                    <div className="featured-price">
                                        {game.price === 0 ? (
                                            <span className="price-free">{t('store.free_label') || 'Free'}</span>
                                        ) : (
                                            <>
                                                {game.discount > 0 && (
                                                    <span className="badge badge-discount">-{game.discount}%</span>
                                                )}
                                                <span className="price">{game.price} ₽</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Индикаторы слайдера */}
                    <div className="featured-dots">
                        {featuredData.featured.map((_, index) => (
                            <button
                                key={index}
                                className={`featured-dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(index)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Новинки */}
            {featuredData?.new?.length > 0 && (
                <section className="store-section">
                    <h2 className="section-title">
                        <span className="badge badge-new">NEW</span>
                        {t('store.newReleases') || 'New Releases'}
                    </h2>
                    <div className="games-grid">
                        {featuredData.new.map(game => (
                            <GameCard key={game._id} game={game} onClick={() => goToGame(game._id)} t={t} />
                        ))}
                    </div>
                </section>
            )}

            {/* Популярное */}
            {featuredData?.popular?.length > 0 && (
                <section className="store-section">
                    <h2 className="section-title">{t('store.popular') || 'Popular'}</h2>
                    <div className="games-grid">
                        {featuredData.popular.map(game => (
                            <GameCard key={game._id} game={game} onClick={() => goToGame(game._id)} t={t} />
                        ))}
                    </div>
                </section>
            )}

            {/* Бесплатные игры */}
            {featuredData?.free?.length > 0 && (
                <section className="store-section">
                    <h2 className="section-title">{t('store.free') || 'Free to Play'}</h2>
                    <div className="games-grid">
                        {featuredData.free.map(game => (
                            <GameCard key={game._id} game={game} onClick={() => goToGame(game._id)} t={t} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

// Компонент карточки игры
function GameCard({ game, onClick, t }) {
    if (!game || !game._id) return null;
    
    const getImageUrl = () => {
        if (!game.coverImage) return null;
        if (game.coverImage.startsWith('http')) return game.coverImage;
        return `${BASE_URL}${game.coverImage}`;
    };
    
    return (
        <div className="game-card" onClick={onClick}>
            <div className="game-card-image">
                <img 
                    src={getImageUrl() || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280"><rect fill="%232a475e" width="200" height="280"/><text x="50%" y="50%" fill="%2366c0f4" font-size="24" text-anchor="middle" dy=".3em">GAME</text></svg>'}
                    alt={game.title || 'Game'}
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280"><rect fill="%232a475e" width="200" height="280"/><text x="50%" y="50%" fill="%2366c0f4" font-size="24" text-anchor="middle" dy=".3em">GAME</text></svg>';
                    }}
                />
                {game.discount > 0 && (
                    <span className="game-card-discount">-{game.discount}%</span>
                )}
            </div>
            <div className="game-card-info">
                <h3 className="game-card-title">{game.title || 'Unknown Game'}</h3>
                <div className="game-card-price">
                    {game.price === 0 ? (
                        <span className="price-free">{t('store.free_label') || 'Free'}</span>
                    ) : (
                        <span className="price">{game.price || 0} ₽</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Store;
