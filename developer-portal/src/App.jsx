/**
 * App.jsx - Главный компонент портала разработчиков
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitGame from './pages/SubmitGame';
import MyGames from './pages/MyGames';
import EditGame from './pages/EditGame';
import './App.css';

function App() {
    const { token } = useAuthStore();

    return (
        <BrowserRouter>
            <div className="app">
                <Header />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={
                            token ? <Navigate to="/dashboard" /> : <Login />
                        } />
                        <Route path="/register" element={
                            token ? <Navigate to="/dashboard" /> : <Register />
                        } />
                        <Route path="/dashboard" element={
                            token ? <Dashboard /> : <Navigate to="/login" />
                        } />
                        <Route path="/submit" element={
                            token ? <SubmitGame /> : <Navigate to="/login" />
                        } />
                        <Route path="/my-games" element={
                            token ? <MyGames /> : <Navigate to="/login" />
                        } />
                        <Route path="/edit/:id" element={
                            token ? <EditGame /> : <Navigate to="/login" />
                        } />
                    </Routes>
                </main>
                <footer className="footer">
                    <p>© 2026 Uteam Developer Portal</p>
                </footer>
            </div>
        </BrowserRouter>
    );
}

export default App;
