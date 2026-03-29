/**
 * Sidebar - Боковая панель с библиотекой игр
 */

import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../utils/i18n';
import api, { BASE_URL } from '../utils/api';
import './Sidebar.css';

function Sidebar() {
    const { t } = useTranslation();
    const [library, setLibrary] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, favorites, installed

    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        try {
            const response = await api.get('/library');
            setLibrary(response.data.library || []);
        } catch (error) {
            console.error('Error loading library:', error);
        }
    };

    // Фильтрация по поиску и категории
    const filteredLibrary = library.filter(item => {
        const matchesSearch = item.game?.title?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = 
            filter === 'all' ? true :
            filter === 'favorites' ? item.isFavorite :
            filter === 'installed' ? item.installed : true;
        return matchesSearch && matchesFilter;
    });

    // Запуск игры
    const handleLaunchGame = (item) => {
        const game = item.game;
        
        if (window.electronAPI?.game) {
            // HTML/Web игры запускаем в отдельном окне
            window.electronAPI.game.launchWeb({
                gameId: game._id,
                title: game.title,
                gameUrl: game.gameUrl,
                gamePath: game.gamePath
            });
        } else {
            // Браузер - открываем в новой вкладке
            const gameUrl = game.gameUrl || `${BASE_URL}/games${game.gamePath}/index.html`;
            window.open(gameUrl, '_blank');
        }
    };

    return (
        <div className="sidebar">
            {/* Поиск */}
            <div className="sidebar-search">
                <input
                    type="text"
                    placeholder={t('library.search') || 'Search library...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="sidebar-search-input"
                />
            </div>

            {/* Категории */}
            <div className="sidebar-categories">
                <div 
                    className={`sidebar-category ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    <span className="sidebar-category-icon">ALL</span>
                    <span>{t('library.all') || 'All Games'}</span>
                    <span className="sidebar-category-count">{library.length}</span>
                </div>
                <div 
                    className={`sidebar-category ${filter === 'favorites' ? 'active' : ''}`}
                    onClick={() => setFilter('favorites')}
                >
                    <span className="sidebar-category-icon">FAV</span>
                    <span>{t('library.favorites') || 'Favorites'}</span>
                    <span className="sidebar-category-count">
                        {library.filter(l => l.isFavorite).length}
                    </span>
                </div>
                <div 
                    className={`sidebar-category ${filter === 'installed' ? 'active' : ''}`}
                    onClick={() => setFilter('installed')}
                >
                    <span className="sidebar-category-icon">DL</span>
                    <span>{t('library.installed') || 'Installed'}</span>
                    <span className="sidebar-category-count">
                        {library.filter(l => l.installed).length}
                    </span>
                </div>
            </div>

            <div className="sidebar-divider" />

            {/* Список игр */}
            <div className="sidebar-games">
                {filteredLibrary.length === 0 ? (
                    <div className="sidebar-empty">
                        {search ? (t('library.nothingFound') || 'Nothing found') : (t('library.emptyLibrary') || 'Library is empty')}
                    </div>
                ) : (
                    filteredLibrary.map(item => (
                        <div 
                            key={item._id}
                            className="sidebar-game"
                            onClick={() => handleLaunchGame(item)}
                        >
                            <img 
                                src={item.game.coverImage?.startsWith('http') ? item.game.coverImage : `${BASE_URL}${item.game.coverImage}`}
                                alt={item.game.title}
                                className="sidebar-game-icon"
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%232a475e" width="40" height="40"/><text x="50%" y="50%" fill="%2366c0f4" font-size="14" text-anchor="middle" dy=".3em">GAME</text></svg>';
                                }}
                            />
                            <div className="sidebar-game-info">
                                <div className="sidebar-game-title">{item.game.title}</div>
                                {item.installed && (
                                    <div className="sidebar-game-status">{t('library.installed') || 'Installed'}</div>
                                )}
                            </div>
                            {item.isFavorite && (
                                <span className="sidebar-game-favorite">*</span>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Нижняя панель */}
            <div className="sidebar-footer">
                <NavLink to="/store" className="sidebar-footer-btn">
                    + {t('library.addGames') || 'Add games from store'}
                </NavLink>
            </div>
        </div>
    );
}

export default Sidebar;
