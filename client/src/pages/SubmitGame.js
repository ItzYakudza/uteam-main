/**
 * SubmitGame - Game submission page
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUploadStore } from '../store/uploadStore';
import { useTranslation } from '../utils/i18n';
import api from '../utils/api';
import './SubmitGame.css';

function SubmitGame() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { addUpload, updateProgress, completeUpload, errorUpload, removeUpload } = useUploadStore();
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [currentUploadId, setCurrentUploadId] = useState(null);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        shortDescription: '',
        categories: [],
        tags: '',
        price: 0,
        executablePath: 'game.exe',
        gameArchive: null,
        gameIcon: null,
        coverImage: null,
        screenshots: [],
        systemRequirements: {
            minimum: { os: 'Windows 7/8/10/11', processor: '', memory: '', graphics: '', storage: '' },
            recommended: { os: 'Windows 10/11', processor: '', memory: '', graphics: '', storage: '' }
        }
    });

    const categories = ['action', 'adventure', 'rpg', 'strategy', 'simulation', 'sports', 'racing', 'puzzle', 'casual', 'indie'];
    const categoryNames = { action: 'Action', adventure: 'Adventure', rpg: 'RPG', strategy: 'Strategy', simulation: 'Simulation', sports: 'Sports', racing: 'Racing', puzzle: 'Puzzle', casual: 'Casual', indie: 'Indie' };

    const coverPreview = useMemo(() => formData.coverImage ? URL.createObjectURL(formData.coverImage) : null, [formData.coverImage]);
    const iconPreview = useMemo(() => formData.gameIcon ? URL.createObjectURL(formData.gameIcon) : null, [formData.gameIcon]);
    const screenshotPreviews = useMemo(() => formData.screenshots.map(f => URL.createObjectURL(f)), [formData.screenshots]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSystemReqChange = (type, field, value) => {
        setFormData(prev => ({
            ...prev,
            systemRequirements: {
                ...prev.systemRequirements,
                [type]: { ...prev.systemRequirements[type], [field]: value }
            }
        }));
    };

    const handleCategoryToggle = (cat) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat]
        }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        if (type === 'archive') {
            if (!file.name.endsWith('.zip')) { setError(t('submit.errorZipOnly')); return; }
            setFormData(prev => ({ ...prev, gameArchive: file }));
        } else if (type === 'icon') {
            setFormData(prev => ({ ...prev, gameIcon: file }));
        } else if (type === 'cover') {
            setFormData(prev => ({ ...prev, coverImage: file }));
        }
        setError('');
    };

    const handleScreenshots = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setFormData(prev => ({ ...prev, screenshots: files }));
    };

    const handleSubmit = async () => {
        if (!formData.gameArchive) { setError(t('submit.errorArchive')); return; }
        if (!formData.coverImage) { setError(t('submit.errorCover')); return; }
        
        // Генерируем уникальный ID загрузки
        const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCurrentUploadId(uploadId);
        setLoading(true);
        setError('');
        setUploadProgress(0);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('shortDescription', formData.shortDescription || formData.description.substring(0, 300));
            data.append('categories', JSON.stringify(formData.categories));
            data.append('tags', JSON.stringify(formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)));
            data.append('price', formData.price);
            data.append('executablePath', formData.executablePath);
            data.append('systemRequirements', JSON.stringify(formData.systemRequirements));
            data.append('gameArchive', formData.gameArchive);
            data.append('coverImage', formData.coverImage);
            if (formData.gameIcon) data.append('gameIcon', formData.gameIcon);
            formData.screenshots.forEach(file => data.append('screenshots', file));

            // Сохраняем загрузку в store (для отслеживания в фоне)
            addUpload(uploadId, { title: formData.title, gameArchive: formData.gameArchive.name });

            // Запускаем загрузку
            await api.post('/games/submit', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    const progress = Math.round((e.loaded * 100) / e.total);
                    setUploadProgress(progress);
                    updateProgress(uploadId, progress); // Сохраняем в store
                }
            });

            completeUpload(uploadId);
            alert(t('submit.submitted'));
            
            // Удаляем из store через 5 секунд
            setTimeout(() => removeUpload(uploadId), 5000);
            
            navigate('/store');
        } catch (err) {
            console.error('Submit error:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Error submitting game';
            setError(errorMsg);
            errorUpload(uploadId, new Error(errorMsg));
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const nextStep = () => {
        if (step === 1 && (!formData.title || !formData.description)) { setError(t('submit.errorTitle')); return; }
        if (step === 2 && formData.categories.length === 0) { setError(t('submit.errorCategories')); return; }
        if (step === 4 && (!formData.gameArchive || !formData.coverImage)) { setError(t('submit.errorFiles')); return; }
        setError('');
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1024).toFixed(0) + ' KB';
    };

    if (!user || !['developer', 'admin'].includes(user.role)) {
        return (
            <div className="submit-game">
                <div className="submit-header">
                    <h1>{t('submit.devRequired')}</h1>
                    <p>{t('submit.devRequiredDesc')}</p>
                    <p>{t('submit.contactAdmin')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="submit-game">
            <div className="submit-header">
                <h1>{t('submit.title')}</h1>
                <p>{t('submit.subtitle')}</p>
            </div>

            <div className="submit-progress">
                {[1,2,3,4,5].map((n, i) => (
                    <React.Fragment key={n}>
                        {i > 0 && <div className="progress-line"></div>}
                        <div className={`progress-step ${step >= n ? 'active' : ''}`}>
                            <span className="step-number">{n}</span>
                            <span className="step-label">{t('submit.step' + n)}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {error && <div className="submit-error">{error}</div>}

            <div className="submit-content">
                {step === 1 && (
                    <div className="submit-step">
                        <h2>{t('submit.basicInfo')}</h2>
                        <div className="form-group">
                            <label>{t('submit.gameTitle')} *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder={t('submit.gameTitlePlaceholder')} maxLength={100} />
                        </div>
                        <div className="form-group">
                            <label>{t('submit.shortDesc')}</label>
                            <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleInputChange} placeholder={t('submit.shortDescPlaceholder')} maxLength={150} />
                        </div>
                        <div className="form-group">
                            <label>{t('submit.fullDesc')} *</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder={t('submit.fullDescPlaceholder')} rows={6} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('submit.price')}</label>
                                <input type="number" name="price" value={formData.price} onChange={handleInputChange} min={0} placeholder={t('submit.pricePlaceholder')} />
                            </div>
                            <div className="form-group">
                                <label>{t('submit.execPath')}</label>
                                <input type="text" name="executablePath" value={formData.executablePath} onChange={handleInputChange} placeholder="game.exe" />
                                <small>{t('submit.execPathHint')}</small>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('submit.tags')}</label>
                            <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} placeholder={t('submit.tagsPlaceholder')} />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="submit-step">
                        <h2>{t('submit.categories')}</h2>
                        <div className="form-group">
                            <label>{t('submit.selectCategories')}</label>
                            <div className="genre-grid">
                                {categories.map(cat => (
                                    <button key={cat} type="button" className={`genre-btn ${formData.categories.includes(cat) ? 'active' : ''}`} onClick={() => handleCategoryToggle(cat)}>
                                        {categoryNames[cat]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="submit-step">
                        <h2>{t('submit.systemReq')}</h2>
                        <div className="system-req-columns">
                            {['minimum', 'recommended'].map(type => (
                                <div className="system-req-column" key={type}>
                                    <h3>{t('submit.' + type)}</h3>
                                    {['os', 'processor', 'memory', 'graphics', 'storage'].map(field => (
                                        <div className="form-group" key={field}>
                                            <label>{t('submit.' + field)}</label>
                                            <input type="text" value={formData.systemRequirements[type][field]} onChange={(e) => handleSystemReqChange(type, field, e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="submit-step">
                        <h2>{t('submit.files')}</h2>
                        <div className="form-group">
                            <label>{t('submit.gameArchive')} * <span className="required">{t('submit.required')}</span></label>
                            <p className="field-hint">{t('submit.gameArchiveHint')}</p>
                            <div className="file-upload">
                                <input type="file" accept=".zip" onChange={(e) => handleFileChange(e, 'archive')} id="archive-upload" />
                                <label htmlFor="archive-upload" className="file-upload-label archive">
                                    {formData.gameArchive ? formData.gameArchive.name + ' (' + formatFileSize(formData.gameArchive.size) + ')' : t('submit.selectArchive')}
                                </label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('submit.coverImage')} * <span className="required">{t('submit.required')}</span></label>
                            <p className="field-hint">{t('submit.coverImageHint')}</p>
                            <div className="file-upload">
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} id="cover-upload" />
                                <label htmlFor="cover-upload" className="file-upload-label">{formData.coverImage ? formData.coverImage.name : t('submit.selectCover')}</label>
                            </div>
                            {coverPreview && <div className="file-preview"><img src={coverPreview} alt="Cover" className="preview-cover" /></div>}
                        </div>
                        <div className="form-group">
                            <label>{t('submit.gameIcon')}</label>
                            <p className="field-hint">{t('submit.gameIconHint')}</p>
                            <div className="file-upload">
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'icon')} id="icon-upload" />
                                <label htmlFor="icon-upload" className="file-upload-label">{formData.gameIcon ? formData.gameIcon.name : t('submit.selectIcon')}</label>
                            </div>
                            {iconPreview && <div className="file-preview"><img src={iconPreview} alt="Icon" className="preview-icon" /></div>}
                        </div>
                        <div className="form-group">
                            <label>{t('submit.screenshots')}</label>
                            <div className="file-upload">
                                <input type="file" accept="image/*" multiple onChange={handleScreenshots} id="screenshots-upload" />
                                <label htmlFor="screenshots-upload" className="file-upload-label">
                                    {formData.screenshots.length > 0 ? formData.screenshots.length + ' ' + t('submit.screenshotsSelected') : t('submit.selectScreenshots')}
                                </label>
                            </div>
                            {screenshotPreviews.length > 0 && <div className="screenshots-preview">{screenshotPreviews.map((src, i) => <img key={i} src={src} alt={'Screenshot ' + (i+1)} className="preview-screenshot" />)}</div>}
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="submit-step">
                        <h2>{t('submit.review')}</h2>
                        <div className="submit-preview">
                            <div className="preview-section">
                                <h3>{t('submit.reviewBasicInfo')}</h3>
                                <p><strong>{t('submit.gameTitle')}:</strong> {formData.title}</p>
                                <p><strong>{t('submit.shortDesc')}:</strong> {formData.shortDescription || formData.description.substring(0, 100)}...</p>
                                <p><strong>{t('submit.price')}:</strong> {formData.price === 0 ? t('submit.free') : '$' + formData.price}</p>
                                <p><strong>{t('submit.execPath')}:</strong> {formData.executablePath}</p>
                            </div>
                            <div className="preview-section">
                                <h3>{t('submit.reviewCategories')}</h3>
                                <p>{formData.categories.map(c => categoryNames[c]).join(', ') || t('submit.noneSelected')}</p>
                            </div>
                            <div className="preview-section">
                                <h3>{t('submit.reviewSystemReq')}</h3>
                                <p><strong>{t('submit.minimum')} {t('submit.os')}:</strong> {formData.systemRequirements.minimum.os || t('submit.notSpecified')}</p>
                                <p><strong>{t('submit.minimum')} {t('submit.processor')}:</strong> {formData.systemRequirements.minimum.processor || t('submit.notSpecified')}</p>
                            </div>
                            <div className="preview-section">
                                <h3>{t('submit.reviewFiles')}</h3>
                                <p><strong>{t('submit.gameArchive')}:</strong> {formData.gameArchive ? formData.gameArchive.name : '-'}</p>
                                <p><strong>{t('submit.coverImage')}:</strong> {formData.coverImage ? t('submit.uploaded') : t('submit.notUploaded')}</p>
                                <p><strong>{t('submit.gameIcon')}:</strong> {formData.gameIcon ? t('submit.uploaded') : t('submit.notUploaded')}</p>
                                <p><strong>{t('submit.screenshots')}:</strong> {formData.screenshots.length} {t('submit.filesCount')}</p>
                            </div>
                            <div className="preview-images">
                                {coverPreview && <div className="preview-image-section"><h3>{t('submit.coverImage')}</h3><img src={coverPreview} alt="Cover" className="review-cover" /></div>}
                                {iconPreview && <div className="preview-image-section"><h3>{t('submit.gameIcon')}</h3><img src={iconPreview} alt="Icon" className="review-icon" /></div>}
                                {screenshotPreviews.length > 0 && <div className="preview-image-section"><h3>{t('submit.screenshots')}</h3><div className="review-screenshots">{screenshotPreviews.map((src, i) => <img key={i} src={src} alt={'Screenshot ' + (i+1)} />)}</div></div>}
                            </div>
                        </div>
                        <div className="submit-notice"><p>{t('submit.reviewNotice')}</p></div>
                        {loading && (
                            <div className="upload-progress">
                                <div className="upload-progress-header">
                                    <span className="upload-status">{t('submit.uploading')}</span>
                                    <span className="upload-percent">{uploadProgress}%</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: uploadProgress + '%' }}>
                                        <div className="progress-glow"></div>
                                    </div>
                                </div>
                                <div className="upload-info">
                                    {formData.gameArchive && (
                                        <span>{formatFileSize(Math.round(formData.gameArchive.size * uploadProgress / 100))} / {formatFileSize(formData.gameArchive.size)}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="submit-actions">
                {step > 1 && <button className="btn btn-secondary" onClick={prevStep} disabled={loading}>{t('submit.back')}</button>}
                {step < 5 ? (
                    <button className="btn btn-primary" onClick={nextStep}>{t('submit.next')}</button>
                ) : (
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? t('submit.uploading') : t('submit.submitGame')}
                    </button>
                )}
            </div>
        </div>
    );
}

export default SubmitGame;