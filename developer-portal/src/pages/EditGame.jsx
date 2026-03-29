/**
 * EditGame.jsx - Страница редактирования игры
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import './SubmitGame.css';

function EditGame() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        description: '',
        shortDescription: '',
        category: 'casual',
        tags: ''
    });
    const [coverImage, setCoverImage] = useState(null);
    const [currentCover, setCurrentCover] = useState('');
    const [screenshots, setScreenshots] = useState([]);
    const [currentScreenshots, setCurrentScreenshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        { value: 'action', label: 'Экшен' },
        { value: 'adventure', label: 'Приключения' },
        { value: 'puzzle', label: 'Головоломки' },
        { value: 'strategy', label: 'Стратегии' },
        { value: 'simulation', label: 'Симуляторы' },
        { value: 'casual', label: 'Казуальные' },
        { value: 'card', label: 'Карточные' },
        { value: 'arcade', label: 'Аркады' }
    ];

    useEffect(() => {
        loadGame();
    }, [id]);

    const loadGame = async () => {
        try {
            const response = await api.get(`/submissions/${id}`);
            const game = response.data;
            
            setForm({
                title: game.title || '',
                description: game.description || '',
                shortDescription: game.shortDescription || '',
                category: game.category || 'casual',
                tags: game.tags?.join(', ') || ''
            });
            setCurrentCover(game.coverImage || '');
            setCurrentScreenshots(game.screenshots || []);
        } catch (error) {
            console.error('Error loading game:', error);
            setError('Игра не найдена');
        } finally {
            setLoading(false);
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
        }
    };

    const handleScreenshotsChange = (e) => {
        const files = Array.from(e.target.files);
        setScreenshots(prev => [...prev, ...files].slice(0, 5));
    };

    const removeNewScreenshot = (index) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index));
    };

    const removeCurrentScreenshot = (index) => {
        setCurrentScreenshots(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('shortDescription', form.shortDescription);
            formData.append('category', form.category);
            formData.append('tags', form.tags);
            formData.append('keepScreenshots', JSON.stringify(currentScreenshots));
            
            if (coverImage) {
                formData.append('coverImage', coverImage);
            }
            
            screenshots.forEach((file) => {
                formData.append('screenshots', file);
            });

            await api.put(`/submissions/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            navigate('/my-games');
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error && !form.title) {
        return (
            <div className="submit-game">
                <div className="message error">{error}</div>
            </div>
        );
    }

    return (
        <div className="submit-game">
            <h1>Редактирование игры</h1>
            <p className="page-subtitle">
                Измените информацию об игре
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
                        />
                    </div>

                    <div className="form-group">
                        <label>Полное описание *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            required
                            rows={6}
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
                                placeholder="Через запятую"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Медиафайлы</h2>

                    <div className="form-group">
                        <label>Обложка игры</label>
                        {currentCover && !coverImage && (
                            <div className="current-cover">
                                <img 
                                    src={`${BASE_URL}${currentCover}`}
                                    alt="Current cover"
                                    className="cover-preview"
                                />
                                <p>Текущая обложка</p>
                            </div>
                        )}
                        <div className="file-upload">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                id="cover-input"
                            />
                            <label htmlFor="cover-input" className="file-label">
                                {coverImage ? coverImage.name : 'Загрузить новую обложку'}
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
                        <label>Скриншоты</label>
                        
                        {/* Текущие скриншоты */}
                        {currentScreenshots.length > 0 && (
                            <div className="screenshots-preview">
                                {currentScreenshots.map((url, index) => (
                                    <div key={index} className="screenshot-item">
                                        <img 
                                            src={`${BASE_URL}${url}`}
                                            alt={`Screenshot ${index + 1}`}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => removeCurrentScreenshot(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Новые скриншоты */}
                        {screenshots.length > 0 && (
                            <div className="screenshots-preview">
                                {screenshots.map((file, index) => (
                                    <div key={`new-${index}`} className="screenshot-item new">
                                        <img 
                                            src={URL.createObjectURL(file)} 
                                            alt={`New Screenshot ${index + 1}`}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => removeNewScreenshot(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="file-upload" style={{ marginTop: '12px' }}>
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
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => navigate('/my-games')}
                    >
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditGame;
