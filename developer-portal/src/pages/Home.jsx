/**
 * Home.jsx - Главная страница
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
    return (
        <div className="home">
            <section className="hero">
                <h1>Создавайте игры.<br />Делитесь с друзьями.</h1>
                <p>
                    Uteam Developer Portal — место, где вы можете загрузить свои 
                    игры и поделиться ими с игроками на платформе Uteam.
                </p>
                <div className="hero-buttons">
                    <Link to="/register" className="btn btn-primary">
                        Начать бесплатно
                    </Link>
                    <Link to="/login" className="btn btn-secondary">
                        Войти
                    </Link>
                </div>
            </section>

            <section className="features">
                <h2>Почему Uteam?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <span className="feature-icon">FAST</span>
                        <h3>Просто и быстро</h3>
                        <p>Загрузите HTML-игру за несколько минут. Никаких сложных процедур верификации.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">TEAM</span>
                        <h3>Для друзей</h3>
                        <p>Uteam создан для небольших сообществ друзей, которые хотят играть вместе.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">AI</span>
                        <h3>AI-игры</h3>
                        <p>Идеальная платформа для игр, созданных с помощью нейросетей и AI-ассистентов.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">FREE</span>
                        <h3>Бесплатно</h3>
                        <p>Загрузка и распространение игр полностью бесплатны. Никаких скрытых платежей.</p>
                    </div>
                </div>
            </section>

            <section className="how-it-works">
                <h2>Как это работает</h2>
                <div className="steps">
                    <div className="step">
                        <span className="step-number">1</span>
                        <h3>Регистрация</h3>
                        <p>Создайте аккаунт разработчика на портале</p>
                    </div>
                    <div className="step">
                        <span className="step-number">2</span>
                        <h3>Загрузка игры</h3>
                        <p>Заполните информацию об игре и загрузите ZIP-архив</p>
                    </div>
                    <div className="step">
                        <span className="step-number">3</span>
                        <h3>Модерация</h3>
                        <p>Администратор проверит вашу игру</p>
                    </div>
                    <div className="step">
                        <span className="step-number">4</span>
                        <h3>Публикация</h3>
                        <p>Игра появится в магазине Uteam</p>
                    </div>
                </div>
            </section>

            <section className="cta">
                <h2>Готовы начать?</h2>
                <p>Присоединяйтесь к сообществу разработчиков Uteam</p>
                <Link to="/register" className="btn btn-primary">
                    Создать аккаунт
                </Link>
            </section>
        </div>
    );
}

export default Home;
