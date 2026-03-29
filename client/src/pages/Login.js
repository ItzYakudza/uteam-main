/**
 * Login - Страница входа/регистрации с локализацией
 */

import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { t } from '../utils/i18n';
import './Login.css';

function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        login: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const { login, register, loading, error, clearError } = useAuthStore();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isRegister) {
            // Валидация регистрации
            if (formData.password !== formData.confirmPassword) {
                return alert(t('settings.passwordsDontMatch'));
            }
            if (formData.login.length < 3) {
                return alert(t('auth.usernameTooShort') || 'Username must be at least 3 characters');
            }
            await register(formData.login, formData.email, formData.password);
        } else {
            await login(formData.login, formData.password);
        }
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        clearError();
    };

    return (
        <div className="login-page">
            <div className="login-background">
                <div className="login-gradient" />
            </div>

            <div className="login-container">
                <div className="login-logo">UTEAM</div>
                <p className="login-subtitle">
                    {isRegister ? t('auth.register') : t('auth.login')}
                </p>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label>
                            {isRegister ? t('auth.username') : t('auth.username') + ' / Email'}
                        </label>
                        <input
                            type="text"
                            name="login"
                            className="input"
                            placeholder={isRegister ? t('auth.username') : t('auth.username') + ' / Email'}
                            value={formData.login}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {isRegister && (
                        <div className="input-group">
                            <label>{t('auth.email')}</label>
                            <input
                                type="email"
                                name="email"
                                className="input"
                                placeholder={t('auth.email')}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label>{t('auth.password')}</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="input"
                                placeholder={t('auth.password')}
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button 
                                type="button" 
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <span className={`eye-icon ${!showPassword ? 'hidden' : ''}`}>
                                    {!showPassword && <span className="eye-line"></span>}
                                </span>
                            </button>
                        </div>
                    </div>

                    {isRegister && (
                        <div className="input-group">
                            <label>{t('auth.confirmPassword')}</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    className="input"
                                    placeholder={t('auth.confirmPassword')}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    <span className={`eye-icon ${!showConfirmPassword ? 'hidden' : ''}`}>
                                        {!showConfirmPassword && <span className="eye-line"></span>}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn btn-primary login-btn"
                        disabled={loading}
                    >
                        {loading ? t('common.loading') : (isRegister ? t('auth.register') : t('auth.login'))}
                    </button>
                </form>

                <div className="login-footer">
                    <span className="text-secondary">
                        {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}
                    </span>
                    <button 
                        type="button"
                        className="login-toggle"
                        onClick={toggleMode}
                    >
                        {isRegister ? t('auth.login') : t('auth.register')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;
