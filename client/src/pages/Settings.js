import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTranslation, setLanguage } from '../utils/i18n';
import api from '../utils/api';
import './Settings.css';

const COUNTRIES = [
    { code: '', name: { en: 'Not specified', ru: 'Не указано' } },
    { code: 'RU', name: { en: 'Russia', ru: 'Россия' } },
    { code: 'US', name: { en: 'United States', ru: 'США' } },
    { code: 'DE', name: { en: 'Germany', ru: 'Германия' } },
    { code: 'UA', name: { en: 'Ukraine', ru: 'Украина' } },
    { code: 'KZ', name: { en: 'Kazakhstan', ru: 'Казахстан' } },
    { code: 'OTHER', name: { en: 'Other', ru: 'Другое' } }
];
const LANGUAGES = [{ code: 'en', native: 'English' }, { code: 'ru', native: 'Русский' }];

function Settings() {
    const { user, updateUser, token, getDevices, disconnectDevice, logout } = useAuthStore();
    const { t, getLanguage } = useTranslation();
    const [activeSection, setActiveSection] = useState('account');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [devices, setDevices] = useState([]);
    const [devicesLoading, setDevicesLoading] = useState(false);
    const [currentLang, setCurrentLang] = useState(getLanguage());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [emailChangeForm, setEmailChangeForm] = useState({ newEmail: '', password: '' });
    const [emailChangeError, setEmailChangeError] = useState('');
    const [emailChangeLoading, setEmailChangeLoading] = useState(false);
    const [accountForm, setAccountForm] = useState({ realName: '', country: '', bio: '' });
    const [privacySettings, setPrivacySettings] = useState({ displayStatus: 'online', profileVisible: true, showPlayTime: true, showGames: true, showFriends: true });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [appSettings, setAppSettings] = useState({ autoStart: false, minimizeToTray: true, startupPage: 'store', enableNotifications: true, autoUpdate: true });
    const [downloadSettings, setDownloadSettings] = useState({ downloadPath: '', limitBandwidth: false, maxBandwidth: 0 });
    const [appVersion, setAppVersion] = useState('1.0.0');
    const saveTimeoutRef = useRef(null);
    const initialLoadRef = useRef(true);

    useEffect(() => {
        if (user) {
            setAccountForm({ realName: user.realName || '', country: user.country || '', bio: user.bio || '' });
            setPrivacySettings({ displayStatus: user.displayStatus || 'online', profileVisible: user.privacy?.profileVisible !== false, showPlayTime: user.privacy?.showPlayTime !== false, showGames: user.privacy?.showGames !== false, showFriends: user.privacy?.showFriends !== false });
            setTimeout(() => { initialLoadRef.current = false; }, 500);
        }
        loadAppSettings();
        loadAppVersion();
        loadDownloadSettings();
    }, [user]);

    useEffect(() => { if (activeSection === 'security') loadDevices(); }, [activeSection]);
    useEffect(() => { if (message.text) { const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000); return () => clearTimeout(timer); } }, [message.text]);

    const autoSaveAccount = useCallback(async (data) => {
        if (initialLoadRef.current) return;
        setSaving(true);
        try {
            const response = await api.put('/users/profile', { realName: data.realName, country: data.country, bio: data.bio }, { headers: { Authorization: `Bearer ${token}` } });
            updateUser({ ...user, ...response.data });
            setMessage({ type: 'success', text: t('settings.saved') || 'Saved' });
        } catch (error) { setMessage({ type: 'error', text: t('settings.errorSaving') || 'Error' }); } finally { setSaving(false); }
    }, [token, user, updateUser, t]);

    const autoSavePrivacy = useCallback(async (data) => {
        if (initialLoadRef.current) return;
        setSaving(true);
        try {
            const response = await api.put('/users/privacy', { displayStatus: data.displayStatus, privacy: { profileVisible: data.profileVisible, showPlayTime: data.showPlayTime, showGames: data.showGames, showFriends: data.showFriends } }, { headers: { Authorization: `Bearer ${token}` } });
            updateUser({ ...user, displayStatus: response.data.displayStatus, privacy: response.data.privacy });
            setMessage({ type: 'success', text: t('settings.saved') || 'Saved' });
        } catch (error) { setMessage({ type: 'error', text: t('settings.errorSaving') || 'Error' }); } finally { setSaving(false); }
    }, [token, user, updateUser, t]);

    const saveAppSettings = useCallback(async (data) => {
        if (initialLoadRef.current) return;
        try {
            if (window.electronAPI) {
                await window.electronAPI.store.set('appSettings', data);
                if (data.autoStart !== undefined) await window.electronAPI.app.setAutoLaunch(data.autoStart);
            }
            setMessage({ type: 'success', text: t('settings.saved') || 'Saved' });
        } catch (e) { setMessage({ type: 'error', text: t('settings.errorSaving') || 'Error' }); }
    }, [t]);

    const saveDownloadSettings = useCallback(async (data) => {
        if (initialLoadRef.current) return;
        try { if (window.electronAPI) await window.electronAPI.store.set('downloadSettings', data); setMessage({ type: 'success', text: t('settings.saved') || 'Saved' }); } catch (e) { console.error(e); }
    }, [t]);

    const debouncedSave = useCallback((saveFunc, data) => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); saveTimeoutRef.current = setTimeout(() => saveFunc(data), 800); }, []);
    const handleAccountChange = (field, value) => { const newData = { ...accountForm, [field]: value }; setAccountForm(newData); debouncedSave(autoSaveAccount, newData); };
    const handlePrivacyChange = (field, value) => { const newData = { ...privacySettings, [field]: value }; setPrivacySettings(newData); debouncedSave(autoSavePrivacy, newData); };
    const handleAppSettingChange = (field, value) => { const newData = { ...appSettings, [field]: value }; setAppSettings(newData); debouncedSave(saveAppSettings, newData); };
    const handleDownloadSettingChange = (field, value) => { const newData = { ...downloadSettings, [field]: value }; setDownloadSettings(newData); debouncedSave(saveDownloadSettings, newData); };
    const loadDevices = async () => { setDevicesLoading(true); try { const list = await getDevices(); setDevices(list || []); } catch (e) { console.error(e); } finally { setDevicesLoading(false); } };
    const loadAppSettings = async () => { try { if (window.electronAPI) { const s = await window.electronAPI.store.get('appSettings'); const a = await window.electronAPI.app.getAutoLaunch(); if (s) setAppSettings(p => ({ ...p, ...s, autoStart: a?.enabled || false })); } } catch (e) { console.error(e); } };
    const loadDownloadSettings = async () => { 
        try { 
            if (window.electronAPI) { 
                let s = await window.electronAPI.store.get('downloadSettings'); 
                if (!s || !s.downloadPath) {
                    const userData = await window.electronAPI.app.getPath('userData');
                    const defaultPath = userData.replace(/[\\\/][^\\\/]+$/, '') + '\\UTEAM\\downloads';
                    s = { downloadPath: defaultPath, limitBandwidth: false, maxBandwidth: 0 };
                    await window.electronAPI.store.set('downloadSettings', s);
                }
                setDownloadSettings(p => ({ ...p, ...s })); 
            } 
        } catch (e) { console.error(e); } 
    };
    const loadAppVersion = async () => { try { if (window.electronAPI?.app?.getVersion) { const v = await window.electronAPI.app.getVersion(); setAppVersion(v || '1.0.0'); } } catch (e) { console.error(e); } };

    const handleEmailChange = async () => {
        if (!emailChangeForm.newEmail || !emailChangeForm.password) { setEmailChangeError(t('settings.fillAllFields') || 'Fill all fields'); return; }
        setEmailChangeLoading(true); setEmailChangeError('');
        try {
            const response = await api.put('/users/email', { newEmail: emailChangeForm.newEmail, password: emailChangeForm.password }, { headers: { Authorization: `Bearer ${token}` } });
            updateUser({ ...user, email: response.data.email }); setShowEmailChangeModal(false); setEmailChangeForm({ newEmail: '', password: '' }); setMessage({ type: 'success', text: t('settings.emailChanged') || 'Email changed' });
        } catch (error) { setEmailChangeError(error.response?.data?.error || t('settings.errorSaving') || 'Error'); } finally { setEmailChangeLoading(false); }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) { setMessage({ type: 'error', text: t('settings.passwordsDontMatch') || 'Passwords do not match' }); return; }
        if (passwordForm.newPassword.length < 6) { setMessage({ type: 'error', text: t('settings.passwordTooShort') || 'Password too short' }); return; }
        setSaving(true);
        try {
            await api.put('/users/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
            setMessage({ type: 'success', text: t('settings.passwordChanged') || 'Password changed' }); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) { setMessage({ type: 'error', text: error.response?.data?.message || t('settings.errorSaving') || 'Error' }); } finally { setSaving(false); }
    };

    const handleLanguageChange = (lang) => { setLanguage(lang); setCurrentLang(lang); };
    const handleDisconnectDevice = async (deviceId) => { const result = await disconnectDevice(deviceId); if (result.success) { loadDevices(); setMessage({ type: 'success', text: t('settings.deviceDisconnected') || 'Device disconnected' }); } };
    const handleDeleteAccount = async () => {
        if (!deletePassword) { setDeleteError(t('settings.passwordRequired') || 'Password required'); return; }
        setDeleteLoading(true); setDeleteError('');
        try { await api.delete('/auth/delete-account', { data: { password: deletePassword }, headers: { Authorization: `Bearer ${token}` } }); logout(); }
        catch (error) { setDeleteError(error.response?.data?.error || t('settings.deleteError') || 'Error'); } finally { setDeleteLoading(false); }
    };
    const handleBrowseFolder = async () => { try { if (window.electronAPI?.dialog?.showOpenDialog) { const r = await window.electronAPI.dialog.showOpenDialog({ properties: ['openDirectory'] }); if (r && !r.canceled && r.filePaths?.[0]) handleDownloadSettingChange('downloadPath', r.filePaths[0]); } } catch (e) { console.error(e); } };
    const handleClearCache = async () => { try { if (window.electronAPI?.app?.clearCache) { await window.electronAPI.app.clearCache(); setMessage({ type: 'success', text: t('settings.cacheCleared') || 'Cache cleared' }); } } catch (e) { setMessage({ type: 'error', text: t('settings.errorSaving') || 'Error' }); } };
    const handleOpenGamesFolder = async () => { try { if (window.electronAPI?.shell?.openPath) await window.electronAPI.shell.openPath(downloadSettings.downloadPath); } catch (e) { console.error(e); } };

    const sections = [
        { id: 'account', label: t('settings.account') || 'Account' },
        { id: 'privacy', label: t('settings.privacy') || 'Privacy' },
        { id: 'security', label: t('settings.security') || 'Security' },
        { id: 'notifications', label: t('settings.notifications') || 'Notifications' },
        { id: 'downloads', label: t('settings.downloads') || 'Downloads' },
        { id: 'interface', label: t('settings.interface') || 'Interface' },
        { id: 'about', label: t('settings.about') || 'About' }
    ];

    return (
        <div className="settings-page">
            <div className="settings-sidebar">
                <div className="settings-sidebar-header"><h2>{t('settings.title') || 'Settings'}</h2></div>
                <div className="settings-language-select">
                    {LANGUAGES.map(lang => (<button key={lang.code} className={`lang-btn ${currentLang === lang.code ? 'active' : ''}`} onClick={() => handleLanguageChange(lang.code)}><span className="lang-name">{lang.native}</span></button>))}
                </div>
                <nav className="settings-nav-list">
                    {sections.map(section => (<button key={section.id} className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`} onClick={() => setActiveSection(section.id)}><span className="nav-label">{section.label}</span></button>))}
                </nav>
            </div>
            <div className="settings-main">
                {message.text && <div className={`settings-toast ${message.type}`}><span className="toast-text">{message.text}</span></div>}
                {saving && <div className="settings-saving-indicator"><span></span></div>}

                {activeSection === 'account' && (
                    <div className="settings-section">
                        <div className="section-header"><h3>{t('settings.accountSettings') || 'Account'}</h3><p className="section-desc">{t('settings.accountDesc') || 'Manage your information'}</p></div>
                        <div className="settings-card">
                            <div className="settings-row"><div className="row-info"><span className="row-label">{t('settings.username') || 'Username'}</span><span className="row-hint">{t('settings.usernameCannotChange') || 'Cannot be changed'}</span></div><div className="row-value"><input type="text" value={user?.username || ''} readOnly className="input-readonly" /></div></div>
                            <div className="settings-row"><div className="row-info"><span className="row-label">UTEAM ID</span><span className="row-hint">{t('settings.shareForFriends') || 'Share to add friends'}</span></div><div className="row-value id-row"><input type="text" value={user?.uteamId || ''} readOnly className="input-readonly" /><button className="btn-copy" onClick={() => { navigator.clipboard.writeText(user?.uteamId || ''); setMessage({ type: 'success', text: t('settings.copied') || 'Copied!' }); }}>{t('settings.copy') || 'Copy'}</button></div></div>
                            <div className="settings-row"><div className="row-info"><span className="row-label">{t('settings.email') || 'Email'}</span></div><div className="row-value email-row"><input type="text" value={showEmail ? user?.email : user?.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || ''} readOnly className="input-readonly" /><button className="btn-icon" onClick={() => setShowEmail(!showEmail)}>{showEmail ? (t('settings.hide') || 'Hide') : (t('settings.show') || 'Show')}</button><button className="btn-secondary" onClick={() => setShowEmailChangeModal(true)}>{t('settings.change') || 'Change'}</button></div></div>
                        </div>
                        <div className="settings-card">
                            <h4 className="card-title">{t('settings.personalData') || 'Personal Data'}</h4>
                            <div className="form-group"><label>{t('settings.realName') || 'Real Name'}</label><input type="text" value={accountForm.realName} onChange={(e) => handleAccountChange('realName', e.target.value)} placeholder={t('settings.realNamePlaceholder') || 'Your name (optional)'} /></div>
                            <div className="form-group"><label>{t('settings.country') || 'Country'}</label><select value={accountForm.country} onChange={(e) => handleAccountChange('country', e.target.value)} className="select-input">{COUNTRIES.map(c => (<option key={c.code} value={c.code}>{c.name[currentLang] || c.name.en}</option>))}</select></div>
                            <div className="form-group"><label>{t('settings.bio') || 'Bio'}</label><textarea value={accountForm.bio} onChange={(e) => handleAccountChange('bio', e.target.value)} placeholder={t('settings.bioPlaceholder') || 'Tell about yourself...'} rows={4} /></div>
                        </div>
                    </div>
                )}

                {activeSection === 'privacy' && (
                    <div className="settings-section">
                        <div className="section-header"><h3>{t('settings.privacy') || 'Privacy'}</h3><p className="section-desc">{t('settings.privacyDesc') || 'Manage visibility of your information'}</p></div>
                        <div className="settings-card">
                            <h4 className="card-title">{t('settings.onlineStatus') || 'Online Status'}</h4>
                            <div className="status-selector">
                                {[{ id: 'online', color: '#57cbde', labelKey: 'status.online' }, { id: 'away', color: '#c7a329', labelKey: 'status.away' }, { id: 'invisible', color: '#898989', labelKey: 'status.invisible' }, { id: 'offline', color: '#898989', labelKey: 'status.offline' }].map(status => (
                                    <label key={status.id} className={`status-option ${privacySettings.displayStatus === status.id ? 'active' : ''}`}><input type="radio" name="status" value={status.id} checked={privacySettings.displayStatus === status.id} onChange={(e) => handlePrivacyChange('displayStatus', e.target.value)} /><span className="status-dot" style={{ background: status.color }}></span><span className="status-label">{t(status.labelKey) || status.id}</span></label>
                                ))}
                            </div>
                        </div>
                        <div className="settings-card">
                            <h4 className="card-title">{t('settings.profileVisibility') || 'Profile Visibility'}</h4>
                            {[{ field: 'profileVisible', labelKey: 'settings.publicProfile', descKey: 'settings.publicProfileDesc' }, { field: 'showPlayTime', labelKey: 'settings.showPlayTime', descKey: 'settings.showPlayTimeDesc' }, { field: 'showGames', labelKey: 'settings.showGames', descKey: 'settings.showGamesDesc' }, { field: 'showFriends', labelKey: 'settings.showFriends', descKey: 'settings.showFriendsDesc' }].map(item => (
                                <div key={item.field} className="toggle-row"><div className="toggle-info"><span className="toggle-label">{t(item.labelKey) || item.field}</span><span className="toggle-desc">{t(item.descKey) || ''}</span></div><label className="toggle-switch"><input type="checkbox" checked={privacySettings[item.field]} onChange={(e) => handlePrivacyChange(item.field, e.target.checked)} /><span className="toggle-slider"></span></label></div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'security' && (
                    <div className="settings-section">
                        <div className="section-header"><h3>{t('settings.security') || 'Security'}</h3><p className="section-desc">{t('settings.securityDesc') || 'Manage password and devices'}</p></div>
                        <div className="settings-card">
                            <h4 className="card-title">{t('settings.changePassword') || 'Change Password'}</h4>
                            <form onSubmit={changePassword} className="password-form">
                                <div className="form-group"><label>{t('settings.currentPassword') || 'Current Password'}</label><input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></div>
                                <div className="form-group"><label>{t('settings.newPassword') || 'New Password'}</label><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></div>
                                <div className="form-group"><label>{t('settings.confirmPassword') || 'Confirm Password'}</label><input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></div>
                                <button type="submit" className="btn-primary" disabled={saving}>{t('settings.changePasswordBtn') || 'Change Password'}</button>
                            </form>
                        </div>
                        <div className="settings-card">
                            <div className="card-header"><h4 className="card-title">{t('settings.devices') || 'Connected Devices'}</h4><span className="devices-count">{devices.length} {t('settings.devicesCount') || 'devices'}</span></div>
                            {devicesLoading ? <div className="loading-state">{t('settings.loading') || 'Loading...'}</div> : devices.length === 0 ? <div className="empty-state">{t('settings.noDevices') || 'No devices'}</div> : (
                                <div className="devices-list">
                                    {devices.map(device => (
                                        <div key={device.deviceId} className={`device-item ${device.isCurrent ? 'current' : ''}`}>
                                            <div className="device-icon">{device.platform?.toLowerCase().includes('win') ? 'PC' : 'Mob.'}</div>
                                            <div className="device-info"><span className="device-name">{device.deviceName || (t('settings.unknown') || 'Unknown')}{device.isCurrent && <span className="current-badge">{t('settings.thisDevice') || 'This device'}</span>}</span><span className="device-details">{device.platform}</span></div>
                                            {!device.isCurrent && <button className="btn-disconnect" onClick={() => handleDisconnectDevice(device.deviceId)}>{t('settings.disconnect') || 'Disconnect'}</button>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="settings-card danger-card">
                            <h4 className="card-title danger-title">{t('settings.dangerZone') || 'Danger Zone'}</h4>
                            <p className="danger-desc">{t('settings.deleteAccountDesc') || 'Account cannot be recovered after deletion.'}</p>
                            <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>{t('settings.deleteAccount') || 'Delete Account'}</button>
                        </div>
                    </div>
                )}

                {activeSection === 'notifications' && (
                    <div className="settings-section">
                        <div className="section-header"><h3>{t('settings.notifications') || 'Notifications'}</h3><p className="section-desc">{t('settings.notificationsDesc') || 'Notification settings'}</p></div>
                        <div className="settings-card">
                            <div className="toggle-row"><div className="toggle-info"><span className="toggle-label">{t('settings.enableNotifications') || 'Enable Notifications'}</span><span className="toggle-desc">{t('settings.enableNotificationsDesc') || 'Receive desktop notifications'}</span></div><label className="toggle-switch"><input type="checkbox" checked={appSettings.enableNotifications} onChange={(e) => handleAppSettingChange('enableNotifications', e.target.checked)} /><span className="toggle-slider"></span></label></div>
                        </div>
                    </div>
                )}

                {activeSection === 'downloads' && (
                    <div className="settings-section">
                        <div className="section-header"><h3>{t('settings.downloads') || 'Downloads'}</h3><p className="section-desc">{t('settings.downloadsDesc') || 'Manage download settings'}</p></div>
                        <div className="settings-card">
                            <h4 className="card-title">{t('settings.downloadFolder') || 'Download Folder'}</h4>
                            <div className="path-selector"><input type="text" value={downloadSettings.downloadPath} readOnly className="input-readonly path-input" /><button className="btn-secondary" onClick={handleBrowseFolder}>{t('settings.browse') || 'Browse'}</button><button className="btn-secondary" onClick={handleOpenGamesFolder}>{t('settings.open') || 'Open'}</button></div>
                        </div>
                        <div className="settings-card">
                            <h4 className="card-title">{t('settings.bandwidth') || 'Bandwidth'}</h4>
                            <div className="toggle-row"><div className="toggle-info"><span className="toggle-label">{t('settings.limitSpeed') || 'Limit Speed'}</span><span className="toggle-desc">{t('settings.limitSpeedDesc') || 'Limit download speed'}</span></div><label className="toggle-switch"><input type="checkbox" checked={downloadSettings.limitBandwidth} onChange={(e) => handleDownloadSettingChange('limitBandwidth', e.target.checked)} /><span className="toggle-slider"></span></label></div>
                            {downloadSettings.limitBandwidth && <div className="form-group inline-group"><label>{t('settings.maxSpeed') || 'Max Speed (MB/s)'}</label><input type="number" value={downloadSettings.maxBandwidth} onChange={(e) => handleDownloadSettingChange('maxBandwidth', parseInt(e.target.value) || 0)} min="0" max="1000" /></div>}
                        </div>
                        <div className="settings-card"><h4 className="card-title">{t('settings.storage') || 'Storage'}</h4><button className="btn-secondary" onClick={handleClearCache}>{t('settings.clearCache') || 'Clear Cache'}</button></div>
                    </div>
                )}

                {activeSection === 'interface' && (
                    <div className="settings-section">
                        <div className="section-header"><h3>{t('settings.interface') || 'Interface'}</h3><p className="section-desc">{t('settings.interfaceDesc') || 'Appearance settings'}</p></div>
                        <div className="settings-card">
                            <h4 className="card-title">{t('settings.startup') || 'Startup'}</h4>
                            <div className="toggle-row"><div className="toggle-info"><span className="toggle-label">{t('settings.startWithWindows') || 'Start with Windows'}</span><span className="toggle-desc">{t('settings.startWithWindowsDesc') || 'Launch when Windows starts'}</span></div><label className="toggle-switch"><input type="checkbox" checked={appSettings.autoStart} onChange={(e) => handleAppSettingChange('autoStart', e.target.checked)} /><span className="toggle-slider"></span></label></div>
                            <div className="toggle-row"><div className="toggle-info"><span className="toggle-label">{t('settings.minimizeToTray') || 'Minimize to Tray'}</span><span className="toggle-desc">{t('settings.minimizeToTrayDesc') || 'Keep running in tray'}</span></div><label className="toggle-switch"><input type="checkbox" checked={appSettings.minimizeToTray} onChange={(e) => handleAppSettingChange('minimizeToTray', e.target.checked)} /><span className="toggle-slider"></span></label></div>
                            <div className="form-group"><label>{t('settings.startupPage') || 'Startup Page'}</label><select value={appSettings.startupPage} onChange={(e) => handleAppSettingChange('startupPage', e.target.value)} className="select-input"><option value="store">{t('nav.store') || 'Store'}</option><option value="library">{t('nav.library') || 'Library'}</option><option value="friends">{t('nav.friends') || 'Friends'}</option></select></div>
                        </div>
                        <div className="settings-card"><h4 className="card-title">{t('settings.updates') || 'Updates'}</h4><div className="toggle-row"><div className="toggle-info"><span className="toggle-label">{t('settings.autoUpdate') || 'Auto Update'}</span><span className="toggle-desc">{t('settings.autoUpdateDesc') || 'Automatically install updates'}</span></div><label className="toggle-switch"><input type="checkbox" checked={appSettings.autoUpdate} onChange={(e) => handleAppSettingChange('autoUpdate', e.target.checked)} /><span className="toggle-slider"></span></label></div></div>
                    </div>
                )}

                {activeSection === 'about' && (
                    <div className="settings-section">
                        <div className="section-header"><h3>{t('settings.about') || 'About'}</h3></div>
                        <div className="about-content">
                            <div className="about-logo"><div className="logo-icon">U</div><h1 className="logo-text">UTEAM</h1></div>
                            <p className="about-version">{t('settings.version') || 'Version'} {appVersion}</p>
                            <p className="about-description">{t('settings.aboutDescription') || 'UTEAM is a game distribution platform for indie developers and gamers.'}</p>
                            <p className="about-copyright">© 2026 UTEAM. {t('settings.allRightsReserved') || 'All rights reserved.'}</p>
                        </div>
                    </div>
                )}
            </div>

            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('settings.deleteAccountTitle') || 'Delete Account'}</h2>
                        <p className="modal-warning">{t('settings.deleteAccountWarning') || 'This action is irreversible. All data will be deleted.'}</p>
                        <div className="form-group"><label>{t('settings.enterPasswordToDelete') || 'Enter password to confirm'}</label><input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} /></div>
                        {deleteError && <div className="modal-error">{deleteError}</div>}
                        <div className="modal-buttons"><button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>{t('settings.cancel') || 'Cancel'}</button><button className="btn-danger" onClick={handleDeleteAccount} disabled={deleteLoading}>{deleteLoading ? (t('settings.deleting') || 'Deleting...') : (t('settings.confirmDelete') || 'Delete Account')}</button></div>
                    </div>
                </div>
            )}

            {showEmailChangeModal && (
                <div className="modal-overlay" onClick={() => setShowEmailChangeModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('settings.changeEmail') || 'Change Email'}</h2>
                        <div className="form-group"><label>{t('settings.newEmail') || 'New Email'}</label><input type="email" value={emailChangeForm.newEmail} onChange={(e) => setEmailChangeForm({ ...emailChangeForm, newEmail: e.target.value })} placeholder="newemail@example.com" /></div>
                        <div className="form-group"><label>{t('settings.password') || 'Password'}</label><input type="password" value={emailChangeForm.password} onChange={(e) => setEmailChangeForm({ ...emailChangeForm, password: e.target.value })} /></div>
                        {emailChangeError && <div className="modal-error">{emailChangeError}</div>}
                        <div className="modal-buttons"><button className="btn-secondary" onClick={() => setShowEmailChangeModal(false)}>{t('settings.cancel') || 'Cancel'}</button><button className="btn-primary" onClick={handleEmailChange} disabled={emailChangeLoading}>{emailChangeLoading ? (t('settings.saving') || 'Saving...') : (t('settings.save') || 'Save')}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;