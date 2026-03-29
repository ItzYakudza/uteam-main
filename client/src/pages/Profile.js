import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api, { BASE_URL } from '../utils/api';
import { useTranslation } from '../utils/i18n';
import './Profile.css';

function Profile() {
    const { id } = useParams();
    const { user: currentUser, updateUser, token } = useAuthStore();
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ bio: '', realName: '', country: '' });
    const [uploading, setUploading] = useState(false);
    const [uploadingBg, setUploadingBg] = useState(false);
    const avatarInputRef = useRef(null);
    const bgInputRef = useRef(null);

    const profileId = id || currentUser?.id;
    const isOwnProfile = !id || id === currentUser?.id;

    useEffect(() => { if (profileId) loadProfile(); }, [profileId]);

    const loadProfile = async () => {
        try {
            const response = await api.get(`/users/${profileId}`);
            setProfile(response.data);
            setEditForm({ bio: response.data.bio || '', realName: response.data.realName || '', country: response.data.country || '' });
        } catch (error) { console.error('Error loading profile:', error); }
        finally { setLoading(false); }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } });
            const avatarUrl = response.data.avatar + '?t=' + Date.now();
            setProfile(prev => ({ ...prev, avatar: avatarUrl }));
            if (updateUser && currentUser) updateUser({ avatar: avatarUrl });
        } catch (error) { alert('Error uploading avatar'); }
        finally { setUploading(false); }
    };

    const handleBackgroundChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert('File size must be less than 10MB'); return; }
        setUploadingBg(true);
        try {
            const formData = new FormData();
            formData.append('background', file);
            const response = await api.put('/users/background', formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } });
            setProfile(prev => ({ ...prev, profileBackground: response.data.profileBackground }));
        } catch (error) { alert('Error uploading background'); }
        finally { setUploadingBg(false); }
    };

    const handleSaveProfile = async () => {
        try {
            const response = await api.put('/users/profile', editForm, { headers: { 'Authorization': `Bearer ${token}` } });
            setProfile(prev => ({ ...prev, ...response.data }));
            setIsEditing(false);
        } catch (error) { alert('Error saving profile'); }
    };

    const formatPlayTime = (minutes) => {
        if (!minutes) return '0 ' + (t('profilePage.hoursPlayed') || 'hours');
        const hours = Math.floor(minutes / 60);
        return hours + ' ' + (t('profilePage.hoursPlayed') || 'hours');
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return BASE_URL + url;
    };

    if (loading) return <div className="profile-loading"><div className="loading-spinner"></div></div>;
    if (!profile) return <div className="profile-error">Profile not found</div>;

    return (
        <div className="profile">
            <div className="profile-header">
                <div className="profile-background" style={{ backgroundImage: profile.profileBackground ? `url(${getImageUrl(profile.profileBackground)})` : 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)' }}>
                    {isOwnProfile && (
                        <>
                            <button className="change-bg-btn" onClick={() => bgInputRef.current?.click()} disabled={uploadingBg}>{uploadingBg ? '...' : 'Change Background'}</button>
                            <input ref={bgInputRef} type="file" accept="image/*" onChange={handleBackgroundChange} style={{ display: 'none' }} />
                        </>
                    )}
                </div>
                <div className="profile-header-content">
                    <div className={`profile-avatar-container ${isOwnProfile ? 'editable' : ''}`} onClick={() => isOwnProfile && !uploading && avatarInputRef.current?.click()}>
                        <img src={profile.avatar ? getImageUrl(profile.avatar) : ''} alt={profile.username} className="profile-avatar" onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect fill="%232a475e" width="80" height="80"/><text x="50%" y="50%" fill="%2366c0f4" font-size="24" text-anchor="middle" dy=".3em">USER</text></svg>'; }} />
                        {isOwnProfile && <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />}
                        {uploading && <div className="avatar-uploading">...</div>}
                        {profile.uteamId && <div className="avatar-uteam-id" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(profile.uteamId); alert(t('profile.idCopied') || 'ID copied!'); }} title={t('profile.copyId') || 'Copy ID'}>{profile.uteamId}</div>}
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-username">{profile.username}</h1>
                        <div className="profile-status">
                            <span className={`status-dot ${profile.status || 'offline'}`}></span>
                            <span>{profile.status === 'online' ? (t('friends.statusOnline') || 'Online') : profile.currentGame ? (t('friends.playing') || 'Playing') + ' ' + profile.currentGame : (t('friends.statusOffline') || 'Offline')}</span>
                        </div>
                        {isOwnProfile && !isEditing && <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>{t('profilePage.editProfile') || 'Edit Profile'}</button>}
                    </div>
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-main">
                    {isEditing ? (
                        <div className="profile-edit-section">
                            <h3>{t('profilePage.editProfile') || 'Edit Profile'}</h3>
                            <div className="form-group">
                                <label>{t('settings.bio') || 'About Me'}</label>
                                <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Tell something about yourself..." rows={4} maxLength={500} />
                                <span className="char-count">{editForm.bio.length}/500</span>
                            </div>
                            <div className="form-group">
                                <label>{t('settings.realName') || 'Real Name'}</label>
                                <input type="text" value={editForm.realName} onChange={(e) => setEditForm({ ...editForm, realName: e.target.value })} placeholder="Your name" maxLength={50} />
                            </div>
                            <div className="form-group">
                                <label>{t('settings.country') || 'Country'}</label>
                                <input type="text" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} placeholder="Your country" maxLength={50} />
                            </div>
                            <div className="edit-actions">
                                <button className="btn btn-primary" onClick={handleSaveProfile}>{t('common.save') || 'Save'}</button>
                                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>{t('common.cancel') || 'Cancel'}</button>
                            </div>
                        </div>
                    ) : profile.bio && (
                        <div className="profile-section">
                            <h3>{t('settings.bio') || 'About Me'}</h3>
                            <p>{profile.bio}</p>
                        </div>
                    )}
                    {profile.featuredGames?.length > 0 && (
                        <div className="profile-section">
                            <h3>{t('profilePage.games') || 'Featured Games'}</h3>
                            <div className="featured-games-grid">
                                {profile.featuredGames.map(game => (
                                    <div key={game._id} className="featured-game-card">
                                        <img src={getImageUrl(game.coverImage)} alt={game.title} onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect fill="%231b2838" width="200" height="100"/><text x="50%" y="50%" fill="%2366c0f4" font-size="16" text-anchor="middle" dy=".3em">GAME</text></svg>'; }} />
                                        <span>{game.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="profile-sidebar">
                    <div className="profile-stats">
                        <h3>{t('profilePage.statistics') || 'Statistics'}</h3>
                        <div className="stats-list">
                            <div className="stat-row"><span className="stat-label">{t('profilePage.games') || 'Games'}</span><span className="stat-value">{profile.gamesOwned || 0}</span></div>
                            <div className="stat-row"><span className="stat-label">{t('profilePage.hoursPlayed') || 'Hours Played'}</span><span className="stat-value">{formatPlayTime(profile.totalPlayTime)}</span></div>
                            <div className="stat-row"><span className="stat-label">{t('profilePage.achievements') || 'Achievements'}</span><span className="stat-value">{profile.reviewsCount || 0}</span></div>
                            <div className="stat-row"><span className="stat-label">{t('profilePage.memberSince') || 'Member Since'}</span><span className="stat-value">{new Date(profile.createdAt).toLocaleDateString()}</span></div>
                        </div>
                    </div>
                    {(profile.country || profile.realName) && (
                        <div className="profile-info-card">
                            <h3>{t('profilePage.information') || 'Information'}</h3>
                            {profile.realName && <div className="info-row"><span>{t('settings.realName') || 'Name'}:</span><span>{profile.realName}</span></div>}
                            {profile.country && <div className="info-row"><span>{t('profilePage.country') || 'Country'}:</span><span>{profile.country}</span></div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
