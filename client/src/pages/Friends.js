/**
 * Friends - Страница друзей с локализацией
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import { useTranslation } from '../utils/i18n';
import './Friends.css';

function Friends() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [friends, setFriends] = useState([]);
    const [pendingReceived, setPendingReceived] = useState([]);
    const [pendingSent, setPendingSent] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activeTab, setActiveTab] = useState('friends');
    const [loading, setLoading] = useState(true);
    const [uteamIdInput, setUteamIdInput] = useState('');
    const [codeError, setCodeError] = useState('');

    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        try {
            const response = await api.get('/friends');
            setFriends(response.data.friends || []);
            setPendingReceived(response.data.pendingReceived || []);
            setPendingSent(response.data.pendingSent || []);
        } catch (error) {
            console.error('Error loading friends:', error);
        } finally {
            setLoading(false);
        }
    };

    // Поиск пользователей
    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length >= 2) {
            try {
                const response = await api.get(`/users/search/${encodeURIComponent(query)}`);
                setSearchResults(response.data || []);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    // Отправить запрос в друзья
    const sendFriendRequest = async (userId) => {
        try {
            await api.post(`/friends/add/${userId}`);
            setSearchResults(prev => 
                prev.map(u => u._id === userId ? { ...u, requestSent: true } : u)
            );
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    // Добавить друга по UTEAM ID
    const addByUteamId = async () => {
        if (!uteamIdInput.trim()) return;
        setCodeError('');
        
        try {
            const response = await api.post('/friends/add-by-code', { uteamId: uteamIdInput.trim() });
            setUteamIdInput('');
            loadFriends();
            alert(response.data.message || 'Friend request sent!');
        } catch (error) {
            setCodeError(error.response?.data?.error || 'Invalid UTEAM ID');
        }
    };

    // Принять запрос
    const acceptRequest = async (userId) => {
        try {
            await api.post(`/friends/accept/${userId}`);
            loadFriends();
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    // Отклонить запрос
    const rejectRequest = async (userId) => {
        try {
            await api.post(`/friends/reject/${userId}`);
            loadFriends();
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
    };

    // Удалить из друзей
    const removeFriend = async (userId) => {
        try {
            await api.delete(`/friends/remove/${userId}`);
            loadFriends();
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    // Подсчёт онлайн друзей
    const onlineFriends = friends.filter(f => f.status === 'online' || f.status === 'in-game');

    if (loading) {
        return (
            <div className="friends-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="friends">
            <div className="friends-header">
                <h1>{t('friends.title')}</h1>
                <div className="friends-stats">
                    <span className="stat">
                        <strong>{friends.length}</strong> {t('friends.friendsCount')}
                    </span>
                    <span className="stat online">
                        <strong>{onlineFriends.length}</strong> {t('friends.online')}
                    </span>
                </div>
            </div>

            {/* Add by UTEAM ID */}
            <div className="uteam-id-input">
                <div className="code-input-group">
                    <input
                        type="text"
                        placeholder={t('friends.enterUteamId') || 'Enter UTEAM ID (#XXXXXXX)'}
                        value={uteamIdInput}
                        onChange={(e) => setUteamIdInput(e.target.value.toUpperCase())}
                        maxLength={8}
                    />
                    <button 
                        className="btn-add-code"
                        onClick={addByUteamId}
                        disabled={!uteamIdInput.trim()}
                    >
                        {t('friends.addByCode') || 'Add'}
                    </button>
                </div>
                {codeError && <span className="code-error">{codeError}</span>}
            </div>

            {/* Поиск */}
            <div className="friends-search">
                <input
                    type="text"
                    placeholder={t('friends.searchPlaceholder')}
                    value={searchQuery}
                    onChange={handleSearch}
                />
                {searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map(user => (
                            <div key={user._id} className="search-result-item">
                                <img 
                                    src={`${BASE_URL}${user.avatar}`}
                                    alt={user.username}
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%232a475e" width="40" height="40"/><text x="50%" y="50%" fill="%2366c0f4" font-size="12" text-anchor="middle" dy=".3em">USER</text></svg>';
                                    }}
                                />
                                <div className="search-result-info">
                                    <span className="username">{user.username}</span>
                                    <span className="level">{t('friends.level')} {user.level}</span>
                                </div>
                                {user.isFriend ? (
                                    <button className="btn-added" disabled>{t('friends.alreadyFriend')}</button>
                                ) : user.requestSent ? (
                                    <button className="btn-sent" disabled>{t('friends.requestSent')}</button>
                                ) : (
                                    <button 
                                        className="btn-add"
                                        onClick={() => sendFriendRequest(user._id)}
                                    >
                                        {t('friends.addFriend')}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Табы */}
            <div className="friends-tabs">
                <button 
                    className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    {t('friends.allFriends')} ({friends.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'online' ? 'active' : ''}`}
                    onClick={() => setActiveTab('online')}
                >
                    {t('friends.online')} ({onlineFriends.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    {t('friends.requests')} ({pendingReceived.length})
                </button>
            </div>

            {/* Список друзей */}
            <div className="friends-list">
                {activeTab === 'friends' && (
                    friends.length === 0 ? (
                        <div className="friends-empty">
                            <p>{t('friends.noFriends')}</p>
                            <p>{t('friends.findFriends')}</p>
                        </div>
                    ) : (
                        friends.map(friend => (
                            <FriendCard 
                                key={friend._id} 
                                friend={friend} 
                                onRemove={removeFriend}
                                onClick={() => navigate(`/profile/${friend._id}`)}
                                t={t}
                            />
                        ))
                    )
                )}

                {activeTab === 'online' && (
                    onlineFriends.length === 0 ? (
                        <div className="friends-empty">
                            <p>{t('friends.noOnline')}</p>
                        </div>
                    ) : (
                        onlineFriends.map(friend => (
                            <FriendCard 
                                key={friend._id} 
                                friend={friend} 
                                onRemove={removeFriend}
                                onClick={() => navigate(`/profile/${friend._id}`)}
                                t={t}
                            />
                        ))
                    )
                )}

                {activeTab === 'pending' && (
                    pendingReceived.length === 0 ? (
                        <div className="friends-empty">
                            <p>{t('friends.noRequests')}</p>
                        </div>
                    ) : (
                        pendingReceived.map(request => (
                            <div key={request._id} className="friend-request">
                                <img 
                                    src={`${BASE_URL}${request.avatar}`}
                                    alt={request.username}
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect fill="%232a475e" width="48" height="48"/><text x="50%" y="50%" fill="%2366c0f4" font-size="12" text-anchor="middle" dy=".3em">USER</text></svg>';
                                    }}
                                />
                                <div className="request-info">
                                    <span className="username">{request.username}</span>
                                    <span className="level">{t('friends.level')} {request.level}</span>
                                </div>
                                <div className="request-actions">
                                    <button 
                                        className="btn-accept"
                                        onClick={() => acceptRequest(request._id)}
                                    >
                                        {t('friends.accept')}
                                    </button>
                                    <button 
                                        className="btn-reject"
                                        onClick={() => rejectRequest(request._id)}
                                    >
                                        {t('friends.decline')}
                                    </button>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
}

// Компонент карточки друга
function FriendCard({ friend, onRemove, onClick, t }) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="friend-card" onClick={onClick}>
            <div className="friend-avatar-wrapper">
                <img 
                    src={`${BASE_URL}${friend.avatar}`}
                    alt={friend.username}
                    className="friend-avatar"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect fill="%232a475e" width="48" height="48"/><text x="50%" y="50%" fill="%2366c0f4" font-size="12" text-anchor="middle" dy=".3em">USER</text></svg>';
                    }}
                />
                <span className={`status-indicator ${friend.status}`}></span>
            </div>
            <div className="friend-info">
                <span className="friend-username">{friend.username}</span>
                <span className="friend-status">
                    {friend.status === 'online' ? t('friends.statusOnline') :
                     friend.status === 'in-game' && friend.currentGame ? 
                        `${t('friends.playing')} ${friend.currentGame}` : t('friends.statusOffline')}
                </span>
            </div>
            <div className="friend-actions">
                <button 
                    className="btn-menu"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                >
                    ⋮
                </button>
                {showMenu && (
                    <div className="friend-menu">
                        <button onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}>
                            {t('friends.viewProfile')}
                        </button>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            onRemove(friend._id);
                        }}>
                            {t('friends.removeFriend')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Friends;
