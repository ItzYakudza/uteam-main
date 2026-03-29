/**
 * Dashboard.jsx - Панель управления разработчика
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api, { BASE_URL } from '../utils/api';
import './Dashboard.css';

function Dashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        totalGames: 0,
        publishedGames: 0,
        pendingGames: 0,
        totalDownloads: 0
    });
    const [recentGames, setRecentGames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            // Загрузка статистики
            const gamesResponse = await api.get('/submissions/my');
            const games = gamesResponse.data || [];
            
            setRecentGames(games.slice(0, 5));
            setStats({
                totalGames: games.length,
                publishedGames: games.filter(g => g.status === 'approved').length,
                pendingGames: games.filter(g => g.status === 'pending').length,
                totalDownloads: games.reduce((sum, g) => sum + (g.downloads || 0), 0)
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Добро пожаловать, {user?.username}!</h1>
                <Link to="/submit" className="btn btn-primary">
                    + Загрузить новую игру
                </Link>
            </div>

            {/* Статистика */}
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="stat-icon">GAMES</span>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalGames}</span>
                        <span className="stat-label">Всего игр</span>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">LIVE</span>
                    <div className="stat-info">
                        <span className="stat-value">{stats.publishedGames}</span>
                        <span className="stat-label">Опубликовано</span>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">WAIT</span>
                    <div className="stat-info">
                        <span className="stat-value">{stats.pendingGames}</span>
                        <span className="stat-label">На модерации</span>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">DL</span>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalDownloads}</span>
                        <span className="stat-label">Загрузок</span>
                    </div>
                </div>
            </div>

            {/* Последние игры */}
            <div className="recent-games">
                <div className="section-header">
                    <h2>Последние игры</h2>
                    <Link to="/my-games">Все игры →</Link>
                </div>

                {recentGames.length === 0 ? (
                    <div className="empty-state">
                        <p>У вас ещё нет загруженных игр</p>
                        <Link to="/submit" className="btn btn-primary">
                            Загрузить первую игру
                        </Link>
                    </div>
                ) : (
                    <div className="games-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Статус</th>
                                    <th>Загрузок</th>
                                    <th>Дата</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentGames.map(game => (
                                    <tr key={game._id}>
                                        <td className="game-name">
                                            {game.coverImage && (
                                                <img 
                                                    src={`${BASE_URL}${game.coverImage}`}
                                                    alt={game.title}
                                                />
                                            )}
                                            <span>{game.title}</span>
                                        </td>
                                        <td>
                                            <span className={`status ${getStatusClass(game.status)}`}>
                                                {getStatusLabel(game.status)}
                                            </span>
                                        </td>
                                        <td>{game.downloads || 0}</td>
                                        <td>
                                            {new Date(game.createdAt).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td>
                                            <Link to={`/edit/${game._id}`} className="btn-edit">
                                                Редактировать
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Быстрые действия */}
            <div className="quick-actions">
                <h2>Быстрые действия</h2>
                <div className="actions-grid">
                    <Link to="/submit" className="action-card">
                        <span className="action-icon">UPLOAD</span>
                        <span className="action-title">Загрузить игру</span>
                        <span className="action-desc">Загрузите новую HTML-игру</span>
                    </Link>
                    <Link to="/my-games" className="action-card">
                        <span className="action-icon">LIST</span>
                        <span className="action-title">Мои игры</span>
                        <span className="action-desc">Управляйте своими играми</span>
                    </Link>
                    <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="action-card"
                    >
                        <span className="action-icon">DOCS</span>
                        <span className="action-title">Документация</span>
                        <span className="action-desc">Узнайте больше о разработке</span>
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
