/**
 * Header.jsx - Шапка портала
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Header.css';

function Header() {
    const navigate = useNavigate();
    const { token, user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo">
                    <span className="logo-icon">U</span>
                    <span className="logo-text">Uteam</span>
                    <span className="logo-subtitle">Developer Portal</span>
                </Link>

                <nav className="nav">
                    {token ? (
                        <>
                            <Link to="/dashboard">Панель управления</Link>
                            <Link to="/submit">Загрузить игру</Link>
                            <Link to="/my-games">Мои игры</Link>
                            <div className="user-menu">
                                <span className="username">{user?.username}</span>
                                <button onClick={handleLogout} className="btn-logout">
                                    Выйти
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Войти</Link>
                            <Link to="/register" className="btn btn-primary">
                                Регистрация
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;
