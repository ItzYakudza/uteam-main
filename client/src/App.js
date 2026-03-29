import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import TitleBar from './components/TitleBar';
import Header from './components/Header';
import UpdateNotification from './components/UpdateNotification';
import ConnectionStatus from './components/ConnectionStatus';

import Login from './pages/Login';
import Store from './pages/Store';
import Library from './pages/Library';
import Friends from './pages/Friends';
import GamePage from './pages/GamePage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SubmitGame from './pages/SubmitGame';
import AdminModeration from './pages/AdminModeration';

import { useAuthStore } from './store/authStore';

import './styles/App.css';

function App() {
    const user = useAuthStore(state => state.user);
    const token = useAuthStore(state => state.token);
    const authChecked = useAuthStore(state => state.authChecked);
    const checkAuth = useAuthStore(state => state.checkAuth);
    const [startupPage, setStartupPage] = useState('store');

    // Проверяем авторизацию при запуске
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Загружаем стартовую страницу из настроек
    useEffect(() => {
        const loadStartupPage = async () => {
            try {
                if (window.electronAPI?.store) {
                    const settings = await window.electronAPI.store.get('appSettings');
                    if (settings?.startupPage) {
                        setStartupPage(settings.startupPage);
                    }
                }
            } catch (e) {
                console.error('Failed to load startup page:', e);
            }
        };
        loadStartupPage();
    }, []);

    // Пока не проверили авторизацию - показываем пустой экран
    if (!authChecked) {
        return (
            <div className="app">
                <TitleBar />
                <div style={{ background: '#1b2838', flex: 1 }} />
            </div>
        );
    }

    // Не авторизован - показываем логин
    if (!user || !token) {
        return (
            <div className="app">
                <TitleBar />
                <Login />
            </div>
        );
    }

    // Авторизован - показываем приложение
    return (
        <HashRouter>
            <div className="app">
                <TitleBar />
                {/* Connection Status Banner */}
                <ConnectionStatus />
                <div className="app-container">
                    <div className="main-content">
                        <Header />
                        <div className="page-content">
                            <Routes>
                                <Route path="/" element={<Navigate to={`/${startupPage}`} replace />} />
                                <Route path="/store" element={<Store />} />
                                <Route path="/library" element={<Library />} />
                                <Route path="/friends" element={<Friends />} />
                                <Route path="/game/:id" element={<GamePage />} />
                                <Route path="/profile/:id?" element={<Profile />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/submit-game" element={<SubmitGame />} />
                                <Route path="/admin/moderation" element={<AdminModeration />} />
                            </Routes>
                        </div>
                    </div>
                </div>
                {/* Update Notification Panel */}
                <UpdateNotification />
            </div>
        </HashRouter>
    );
}

export default App;
