/**
 * Header - Верхняя навигационная панель с локализацией
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../utils/i18n';
import { BASE_URL } from '../utils/api';
import './Header.css';

function Header() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header className="header">
            {/* Навигация */}
            <nav className="header-nav">
                <NavLink to="/store" className="header-nav-item">
                    {t('nav.store').toUpperCase()}
                </NavLink>
                <NavLink to="/library" className="header-nav-item">
                    {t('nav.library').toUpperCase()}
                </NavLink>
                <NavLink to="/friends" className="header-nav-item">
                    {t('nav.friends').toUpperCase()}
                </NavLink>
                {user?.role === 'admin' && (
                    <>
                        <NavLink to="/submit-game" className="header-nav-item header-nav-submit">
                            + {t('common.add')}
                        </NavLink>
                        <NavLink to="/admin/moderation" className="header-nav-item header-nav-moderation">
                            {t('nav.moderation') || 'MODERATION'}
                        </NavLink>
                    </>
                )}
                {user?.role === 'moderator' && (
                    <NavLink to="/admin/moderation" className="header-nav-item header-nav-moderation">
                        {t('nav.moderation') || 'MODERATION'}
                    </NavLink>
                )}
            </nav>

            {/* Правая часть */}
            <div className="header-right">
                {/* Профиль */}
                <div className="header-profile">
                    <NavLink to="/profile" className="header-profile-link">
                        <img 
                            src={user?.avatar ? `${BASE_URL}${user.avatar}` : ''} 
                            alt={user?.username}
                            className="header-avatar"
                            onError={(e) => {
                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="%232a475e" width="32" height="32"/><text x="50%" y="50%" fill="%2366c0f4" font-size="10" text-anchor="middle" dy=".3em">USER</text></svg>';
                            }}
                        />
                        <span className="header-username">{user?.username}</span>
                    </NavLink>
                    
                    <div className="header-dropdown">
                        <NavLink to="/profile" className="header-dropdown-item">
                            {t('nav.profile')}
                        </NavLink>
                        <NavLink to="/settings" className="header-dropdown-item">
                            {t('nav.settings')}
                        </NavLink>
                        <div className="header-dropdown-divider" />
                        <button onClick={handleLogout} className="header-dropdown-item">
                            {t('auth.logout')}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
