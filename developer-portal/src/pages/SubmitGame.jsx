/**
 * SubmitGame.jsx - Страница загрузки игры (ZIP-архив + иконка)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './SubmitGame.css';

function SubmitGame() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        description: '',
        shortDescription: '',
        category: 'casual',
        tags: '',
        executablePath: ''
    });
    const [coverImage, setCoverImage] = useState(null);
    const [iconImage, setIconImage] = useState(null);
    const [screenshots, setScreenshots] = useState([]);
    const [gameArchive, setGameArchive] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    const categories = [
        { value: 'action', label: 'Экшен' },
        { value: 'adventure', label: 'Приключения' },
        { value: 'puzzle', label: 'Головоломки' },
        { value: 'strategy', label: 'Стратегии' },
        { value: 'simulation', label: 'Симуляторы' },
        { value: 'casual', label: 'Казуальные' },
        { value: 'card', label: 'Карточные' },
        { value: 'arcade', label: 'Аркады' },
        { value: 'rpg', label: 'RPG' },
        { value: 'shooter', label: 'Шутеры' },
        { value: 'racing', label: 'Гонки' },
        { value: 'sports', label: 'Спорт' }
    ];

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
        }
    };

    const handleIconChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIconImage(file);
        }
    };

    const handleScreenshotsChange = (e) => {
        const files = Array.from(e.target.files);
        setScreenshots(prev => [...prev, ...files].slice(0, 5));
    };

    const removeScreenshot = (index) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index));
    };

    const handleGameArchiveChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Проверка размера (500 МБ)
            if (file.size > 500 * 1024 * 1024) {
                setError('Размер архива не должен превышать 500 МБ');
                return;
            }
            setGameArchive(file);
            setError('');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!coverImage) {
            setError('Загрузите обложку игры');
            return;
        }

        if (!gameArchive) {
            setError('Загрузите ZIP-архив с игрой');
            return;
        }

        if (!form.executablePath) {
            setError('Укажите путь к исполняемому файлу в архиве');
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('shortDescription', form.shortDescription);
            formData.append('category', form.category);
            formData.append('tags', form.tags);
            formData.append('executablePath', form.executablePath);
            formData.append('gameType', 'executable');
            formData.append('coverImage', coverImage);
            formData.append('gameArchive', gameArchive);
            
            if (iconImage) {
                formData.append('gameIcon', iconImage);
            }
            
            screenshots.forEach((file) => {
                formData.append('screenshots', file);
            });

            await api.post('/games/submit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                }
            });

            navigate('/my-games');
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки игры');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="submit-game">
            <h1>Загрузить новую игру</h1>
            <p className="page-subtitle">
                Заполните информацию об игре и загрузите необходимые файлы
            </p>

            {error && <div className="message error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <h2>Основная информация</h2>
                    
                    <div className="form-group">
                        <label>Название игры *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="form-group">
                        <label>Краткое описание *</label>
                        <input
                            type="text"
                            value={form.shortDescription}
                            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                            required
                            maxLength={200}
                            placeholder="Одно предложение об игре"
                        />
                    </div>

                    <div className="form-group">
                        <label>Полное описание *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            required
                            rows={6}
                            placeholder="Подробное описание игры, геймплей, особенности..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Категория *</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Теги</label>
                            <input
                                type="text"
                                value={form.tags}
                                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                placeholder="Через запятую: мультиплеер, пиксельная графика"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Медиафайлы</h2>

                    <div className="form-group">
                        <label>Обложка игры * (460x215 или 16:9)</label>
                        <div className="file-upload">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                id="cover-input"
                            />
                            <label htmlFor="cover-input" className="file-label">
                                {coverImage ? coverImage.name : 'Выберите файл'}
                            </label>
                            {coverImage && (
                                <img 
                                    src={URL.createObjectURL(coverImage)} 
                                    alt="Preview" 
                                    className="cover-preview"
                                />
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Иконка игры (64x64, для библиотеки)</label>
                        <div className="file-upload">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleIconChange}
                                id="icon-input"
                            />
                            <label htmlFor="icon-input" className="file-label">
                                {iconImage ? iconImage.name : 'Выберите иконку'}
                            </label>
                            {iconImage && (
                                <img 
                                    src={URL.createObjectURL(iconImage)} 
                                    alt="Icon Preview" 
                                    className="icon-preview"
                                />
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Скриншоты (до 5 штук)</label>
                        <div className="file-upload">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleScreenshotsChange}
                                id="screenshots-input"
                            />
                            <label htmlFor="screenshots-input" className="file-label">
                                Добавить скриншоты
                            </label>
                        </div>
                        {screenshots.length > 0 && (
                            <div className="screenshots-preview">
                                {screenshots.map((file, index) => (
                                    <div key={index} className="screenshot-item">
                                        <img src={URL.createObjectURL(file)} alt={`Screenshot ${index + 1}`} />
                                        <button 
                                            type="button" 
                                            onClick={() => removeScreenshot(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <h2>Файл игры</h2>

                    <div className="form-group">
                        <label>ZIP-архив с игрой *</label>
                        <p className="form-hint">
                            Архив должен содержать исполняемый файл (.exe). 
                            Максимальный размер: 500 МБ
                        </p>
                        <div className="file-upload">
                            <input
                                type="file"
                                accept=".zip"
                                onChange={handleGameArchiveChange}
                                id="game-input"
                            />
                            <label htmlFor="game-input" className="file-label">
                                {gameArchive ? gameArchive.name : 'Выберите ZIP-файл'}
                            </label>
                        </div>
                        {gameArchive && (
                            <div className="file-info">
                                <strong>{gameArchive.name}</strong> — {formatFileSize(gameArchive.size)}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Путь к исполняемому файлу *</label>
                        <input
                            type="text"
                            value={form.executablePath}
                            onChange={(e) => setForm({ ...form, executablePath: e.target.value })}
                            required
                            placeholder="game.exe или folder/game.exe"
                        />
                        <p className="form-hint">
                            Укажите путь к .exe файлу внутри архива
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="upload-progress">
                        <p>Загрузка: {uploadProgress}%</p>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Загрузка...' : 'Отправить на модерацию'}
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => navigate('/dashboard')}
                    >
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SubmitGame;
