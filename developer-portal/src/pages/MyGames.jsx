/**
 * MyGames.jsx - Страница списка игр разработчика
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import './MyGames.css';

function MyGames() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = async () => {
        try {
            const response = await api.get('/submissions/my');
            setGames(response.data || []);
        } catch (error) {
            console.error('Error loading games:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteGame = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту игру?')) {
            return;
        }

        try {
            await api.delete(`/submissions/${id}`);
            setGames(games.filter(g => g._id !== id));
        } catch (error) {
            console.error('Error deleting game:', error);
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved': return 'Опубликована';
            case 'pending': return 'На модерации';
            case 'rejected': return 'Отклонена';
            default: return 'Черновик';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'approved': return 'status-approved';
            case 'pending': return 'status-pending';
            case 'rejected': return 'status-rejected';
            default: return 'status-draft';
        }
    };

    const filteredGames = filter === 'all' 
        ? games 
        : games.filter(g => g.status === filter);

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="my-games">
            <div className="page-header">
                <h1>Мои игры</h1>
                <Link to="/submit" className="btn btn-primary">
                    + Загрузить игру
                </Link>
            </div>

            {/* Фильтры */}
            <div className="filters">
                <button 
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    Все ({games.length})
                </button>
                <button 
                    className={filter === 'approved' ? 'active' : ''}
                    onClick={() => setFilter('approved')}
                >
                    Опубликованные ({games.filter(g => g.status === 'approved').length})
                </button>
                <button 
                    className={filter === 'pending' ? 'active' : ''}
                    onClick={() => setFilter('pending')}
                >
                    На модерации ({games.filter(g => g.status === 'pending').length})
                </button>
                <button 
                    className={filter === 'rejected' ? 'active' : ''}
                    onClick={() => setFilter('rejected')}
                >
                    Отклонённые ({games.filter(g => g.status === 'rejected').length})
                </button>
            </div>

            {/* Список игр */}
            {filteredGames.length === 0 ? (
                <div className="empty-state">
                    <p>
                        {filter === 'all' 
                            ? 'У вас ещё нет загруженных игр' 
                            : 'Нет игр с таким статусом'}
                    </p>
                    {filter === 'all' && (
                        <Link to="/submit" className="btn btn-primary">
                            Загрузить первую игру
                        </Link>
                    )}
                </div>
            ) : (
                <div className="games-list">
                    {filteredGames.map(game => (
                        <div key={game._id} className="game-card">
                            <div className="game-cover">
                                <img 
                                    src={game.coverImage 
                                        ? `${BASE_URL}${game.coverImage}` 
                                        : '/placeholder.png'}
                                    alt={game.title}
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 215"><rect fill="%232a475e" width="460" height="215"/><text x="50%" y="50%" fill="%2366c0f4" font-size="24" text-anchor="middle" dy=".3em">GAME</text></svg>';
                                    }}
                                />
                            </div>
                            <div className="game-info">
                                <h3>{game.title}</h3>
                                <p className="game-description">
                                    {game.shortDescription || game.description?.slice(0, 100)}
                                </p>
                                <div className="game-meta">
                                    <span className={`status ${getStatusClass(game.status)}`}>
                                        {getStatusLabel(game.status)}
                                    </span>
                                    <span className="game-downloads">
                                        {game.downloads || 0} downloads
                                    </span>
                                    <span className="game-date">
                                        {new Date(game.createdAt).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                                {game.status === 'rejected' && game.rejectionReason && (
                                    <div className="rejection-reason">
                                        <strong>Причина отклонения:</strong> {game.rejectionReason}
                                    </div>
                                )}
                            </div>
                            <div className="game-actions">
                                <Link to={`/edit/${game._id}`} className="btn btn-secondary">
                                    Редактировать
                                </Link>
                                <button 
                                    className="btn btn-danger"
                                    onClick={() => deleteGame(game._id)}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyGames;
