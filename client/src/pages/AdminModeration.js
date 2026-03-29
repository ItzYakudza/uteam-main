/**
 * Admin Moderation Panel
 * Panel for reviewing and approving/rejecting submitted games
 * VSCode-style file browser for inspecting game archives
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { t } from '../utils/i18n';
import api, { BASE_URL } from '../utils/api';
import './AdminModeration.css';

// Build file tree from flat file list
function buildFileTree(files) {
    const root = { name: '', type: 'folder', children: {}, path: '' };
    
    files?.forEach(file => {
        const parts = file.name.split(/[/\\]/);
        let current = root;
        let currentPath = '';
        
        parts.forEach((part, idx) => {
            if (!part) return;
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            
            if (idx === parts.length - 1) {
                // File
                current.children[part] = {
                    name: part,
                    type: 'file',
                    size: file.size,
                    path: currentPath
                };
            } else {
                // Folder
                if (!current.children[part]) {
                    current.children[part] = {
                        name: part,
                        type: 'folder',
                        children: {},
                        path: currentPath
                    };
                }
                current = current.children[part];
            }
        });
    });
    
    return root;
}

// File tree item component
function FileTreeItem({ node, level = 0, expandedFolders, toggleFolder, selectedFile, setSelectedFile, isSuspiciousFile, getFileIcon }) {
    const isExpanded = expandedFolders.has(node.path);
    const children = node.children ? Object.values(node.children).sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
    }) : [];

    if (node.type === 'folder' && node.name) {
        return (
            <div className="tree-item">
                <div 
                    className={`tree-folder ${isExpanded ? 'expanded' : ''}`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => toggleFolder(node.path)}
                >
                    <span className="tree-arrow">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                    <span className="tree-icon folder-icon"></span>
                    <span className="tree-name">{node.name}</span>
                </div>
                {isExpanded && children.map(child => (
                    <FileTreeItem
                        key={child.path}
                        node={child}
                        level={level + 1}
                        expandedFolders={expandedFolders}
                        toggleFolder={toggleFolder}
                        selectedFile={selectedFile}
                        setSelectedFile={setSelectedFile}
                        isSuspiciousFile={isSuspiciousFile}
                        getFileIcon={getFileIcon}
                    />
                ))}
            </div>
        );
    }

    if (node.type === 'file') {
        const suspicious = isSuspiciousFile(node.name);
        return (
            <div 
                className={`tree-file ${suspicious ? 'suspicious' : ''} ${selectedFile?.path === node.path ? 'selected' : ''}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => setSelectedFile(node)}
            >
                <span className={`tree-icon file-icon ${getFileIcon(node.name)}`}></span>
                <span className="tree-name">{node.name}</span>
                {suspicious && <span className="suspicious-indicator"></span>}
            </div>
        );
    }

    // Root level - render children directly
    return (
        <>
            {children.map(child => (
                <FileTreeItem
                    key={child.path}
                    node={child}
                    level={level}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    isSuspiciousFile={isSuspiciousFile}
                    getFileIcon={getFileIcon}
                />
            ))}
        </>
    );
}

function AdminModeration() {
    const { user, token } = useAuthStore();
    const [pendingGames, setPendingGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedFile, setSelectedFile] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(null);

    useEffect(() => {
        if (user?.role === 'admin' || user?.role === 'moderator') {
            loadPendingGames();
        }
    }, [user]);

    const loadPendingGames = async () => {
        try {
            const response = await api.get('/games/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingGames(response.data.games || []);
        } catch (error) {
            console.error('Error loading pending games:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGameFiles = async (gameId) => {
        try {
            const response = await api.get(`/games/${gameId}/files`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error loading game files:', error);
            return { files: [] };
        }
    };

    const handleSelectGame = async (game) => {
        const filesData = await loadGameFiles(game._id);
        setSelectedGame({ ...game, ...filesData });
        setExpandedFolders(new Set());
        setSelectedFile(null);
    };

    const toggleFolder = (path) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const expandAllFolders = () => {
        if (!selectedGame?.files) return;
        const allPaths = new Set();
        selectedGame.files.forEach(file => {
            const parts = file.name.split(/[/\\]/);
            let path = '';
            parts.slice(0, -1).forEach(part => {
                path = path ? `${path}/${part}` : part;
                allPaths.add(path);
            });
        });
        setExpandedFolders(allPaths);
    };

    const collapseAllFolders = () => {
        setExpandedFolders(new Set());
    };

    const fileTree = useMemo(() => {
        return selectedGame?.files ? buildFileTree(selectedGame.files) : null;
    }, [selectedGame?.files]);

    const handleApprove = async () => {
        if (!selectedGame) return;
        setActionLoading(true);
        try {
            await api.put(`/games/${selectedGame._id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingGames(prev => prev.filter(g => g._id !== selectedGame._id));
            setSelectedGame(null);
            setShowApproveModal(false);
            setShowSuccessModal({ type: 'approve', title: selectedGame.title });
        } catch (error) {
            console.error('Error approving game:', error);
            setShowSuccessModal({ type: 'error', message: 'Error approving game' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedGame || !rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await api.put(`/games/${selectedGame._id}/reject`, 
                { reason: rejectReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const rejectedTitle = selectedGame.title;
            setPendingGames(prev => prev.filter(g => g._id !== selectedGame._id));
            setSelectedGame(null);
            setShowRejectModal(false);
            setRejectReason('');
            setShowSuccessModal({ type: 'reject', title: rejectedTitle });
        } catch (error) {
            console.error('Error rejecting game:', error);
            setShowSuccessModal({ type: 'error', message: 'Error rejecting game' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedGame) return;
        setActionLoading(true);
        try {
            await api.delete(`/games/${selectedGame._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const deletedTitle = selectedGame.title;
            setPendingGames(prev => prev.filter(g => g._id !== selectedGame._id));
            setSelectedGame(null);
            setShowDeleteModal(false);
            setShowSuccessModal({ type: 'delete', title: deletedTitle });
        } catch (error) {
            console.error('Error deleting game:', error);
            setShowSuccessModal({ type: 'error', message: error.response?.data?.error || 'Error deleting game' });
        } finally {
            setActionLoading(false);
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
        if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${bytes} B`;
    };

    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'exe') return 'exe';
        if (ext === 'dll') return 'dll';
        if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico'].includes(ext)) return 'image';
        if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio';
        if (['mp4', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
        if (['txt', 'md', 'cfg', 'ini', 'json', 'xml', 'yaml', 'yml'].includes(ext)) return 'text';
        if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) return 'javascript';
        if (['py', 'pyw'].includes(ext)) return 'python';
        if (['cs'].includes(ext)) return 'csharp';
        if (['cpp', 'c', 'h', 'hpp'].includes(ext)) return 'cpp';
        if (['bat', 'cmd', 'ps1', 'sh'].includes(ext)) return 'script';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
        return 'default';
    };

    const isSuspiciousFile = (filename) => {
        const suspicious = ['.bat', '.cmd', '.ps1', '.vbs', '.js', '.sh', '.reg'];
        return suspicious.some(ext => filename.toLowerCase().endsWith(ext));
    };

    if (!user || !['admin', 'moderator'].includes(user.role)) {
        return (
            <div className="admin-moderation">
                <div className="access-denied">
                    <h2>Доступ запрещён</h2>
                    <p>Для доступа к этой странице требуются права администратора или модератора.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="admin-moderation">
                <div className="loading">Загрузка игр на модерацию...</div>
            </div>
        );
    }

    return (
        <div className="admin-moderation">
            <div className="moderation-header">
                <h1>Модерация игр</h1>
                <span className="pending-count">{pendingGames.length} ожидают</span>
            </div>

            <div className="moderation-content">
                {/* Games List */}
                <div className="pending-list">
                    <h3>Игры на модерации</h3>
                    {pendingGames.length === 0 ? (
                        <div className="no-games">Нет игр на рассмотрении</div>
                    ) : (
                        <ul>
                            {pendingGames.map(game => (
                                <li 
                                    key={game._id} 
                                    className={`pending-item ${selectedGame?._id === game._id ? 'selected' : ''}`}
                                    onClick={() => handleSelectGame(game)}
                                >
                                    <img 
                                        src={game.coverImage?.startsWith('http') ? game.coverImage : `${BASE_URL}${game.coverImage}`}
                                        alt={game.title}
                                        className="pending-cover"
                                    />
                                    <div className="pending-info">
                                        <h4>{game.title}</h4>
                                        <span className="developer">by {game.developerName || game.developer?.username}</span>
                                        <span className="date">{new Date(game.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Game Details */}
                {selectedGame && (
                    <div className="game-details">
                        <div className="details-header">
                            <img 
                                src={selectedGame.coverImage?.startsWith('http') ? selectedGame.coverImage : `${BASE_URL}${selectedGame.coverImage}`}
                                alt={selectedGame.title}
                                className="details-cover"
                            />
                            <div className="details-info">
                                <h2>{selectedGame.title}</h2>
                                <p className="developer">Разработчик: {selectedGame.developerName || selectedGame.developer?.username}</p>
                                <p className="email">Email: {selectedGame.developer?.email || 'Н/Д'}</p>
                                <p className="price">Цена: {selectedGame.price === 0 ? 'Бесплатно' : `$${selectedGame.price}`}</p>
                                <p className="size">Размер архива: {formatSize(selectedGame.archiveSize || selectedGame.gameSize)}</p>
                                <p className="exe-path">Исполняемый файл: {selectedGame.executablePath}</p>
                            </div>
                        </div>

                        <div className="details-description">
                            <h3>Описание</h3>
                            <p>{selectedGame.description}</p>
                        </div>

                        {selectedGame.categories?.length > 0 && (
                            <div className="details-categories">
                                <h3>Категории</h3>
                                <div className="category-tags">
                                    {selectedGame.categories.map(cat => (
                                        <span key={cat} className="category-tag">{cat}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedGame.screenshots?.length > 0 && (
                            <div className="details-screenshots">
                                <h3>Скриншоты</h3>
                                <div className="screenshots-grid">
                                    {selectedGame.screenshots.map((ss, idx) => (
                                        <img 
                                            key={idx}
                                            src={ss.startsWith('http') ? ss : `${BASE_URL}${ss}`}
                                            alt={`Screenshot ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files Section - VSCode-style file browser */}
                        <div className="details-files">
                            <div className="files-header">
                                <h3>Содержимое архива ({selectedGame.files?.length || 0} файлов)</h3>
                                <div className="files-toolbar">
                                    <button className="toolbar-btn" onClick={expandAllFolders} title="Развернуть всё">
                                        <span className="expand-icon"></span>
                                    </button>
                                    <button className="toolbar-btn" onClick={collapseAllFolders} title="Свернуть всё">
                                        <span className="collapse-icon"></span>
                                    </button>
                                </div>
                            </div>
                            <div className="files-warning">
                                Внимательно проверьте все файлы. Обратите внимание на подозрительные скрипты и исполняемые файлы.
                            </div>
                            <div className="file-explorer">
                                <div className="file-tree">
                                    {fileTree && (
                                        <FileTreeItem
                                            node={fileTree}
                                            expandedFolders={expandedFolders}
                                            toggleFolder={toggleFolder}
                                            selectedFile={selectedFile}
                                            setSelectedFile={setSelectedFile}
                                            isSuspiciousFile={isSuspiciousFile}
                                            getFileIcon={getFileIcon}
                                        />
                                    )}
                                </div>
                                {selectedFile && (
                                    <div className="file-details-panel">
                                        <h4>Детали файла</h4>
                                        <div className="file-detail-row">
                                            <span className="detail-label">Имя:</span>
                                            <span className="detail-value">{selectedFile.name}</span>
                                        </div>
                                        <div className="file-detail-row">
                                            <span className="detail-label">Путь:</span>
                                            <span className="detail-value path">{selectedFile.path}</span>
                                        </div>
                                        <div className="file-detail-row">
                                            <span className="detail-label">Размер:</span>
                                            <span className="detail-value">{formatSize(selectedFile.size)}</span>
                                        </div>
                                        {isSuspiciousFile(selectedFile.name) && (
                                            <div className="suspicious-warning">
                                                <span className="warning-icon"></span>
                                                <span>Этот тип файла может содержать вредоносный код. Проверьте внимательно.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="moderation-actions">
                            <button 
                                className="btn-approve"
                                onClick={() => setShowApproveModal(true)}
                                disabled={actionLoading}
                            >
                                Одобрить игру
                            </button>
                            <button 
                                className="btn-reject"
                                onClick={() => setShowRejectModal(true)}
                                disabled={actionLoading}
                            >
                                Отклонить игру
                            </button>
                            {user?.role === 'admin' && (
                                <button 
                                    className="btn-delete"
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={actionLoading}
                                >
                                    Удалить игру
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {!selectedGame && pendingGames.length > 0 && (
                    <div className="select-prompt">
                        <h3>Выберите игру для проверки</h3>
                        <p>Нажмите на игру из списка, чтобы увидеть её детали</p>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Отклонить игру</h3>
                        <p>Пожалуйста, укажите причину отклонения:</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Введите причину отклонения..."
                            rows={4}
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShowRejectModal(false)}>Отмена</button>
                            <button 
                                className="btn-reject"
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || actionLoading}
                            >
                                Отклонить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Modal */}
            {showApproveModal && (
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Одобрить игру</h3>
                        <p>Вы уверены, что хотите одобрить "{selectedGame?.title}"?</p>
                        <p className="modal-note">Эта игра будет опубликована и доступна в магазине.</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowApproveModal(false)}>Отмена</button>
                            <button 
                                className="btn-approve"
                                onClick={handleApprove}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Одобрение...' : 'Одобрить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
                        <h3>Удалить игру</h3>
                        <p>Вы уверены, что хотите навсегда удалить "{selectedGame?.title}"?</p>
                        <p className="modal-warning">Это действие необратимо. Все файлы игры, отзывы и записи в библиотеках будут удалены.</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowDeleteModal(false)}>Отмена</button>
                            <button 
                                className="btn-delete"
                                onClick={handleDelete}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Удаление...' : 'Удалить навсегда'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success/Error Modal */}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={() => setShowSuccessModal(null)}>
                    <div className="modal-content success-modal" onClick={e => e.stopPropagation()}>
                        {showSuccessModal.type === 'approve' && (
                            <>
                                <div className="success-icon approve"></div>
                                <h3>Игра одобрена</h3>
                                <p>"{showSuccessModal.title}" была одобрена и опубликована.</p>
                            </>
                        )}
                        {showSuccessModal.type === 'reject' && (
                            <>
                                <div className="success-icon reject"></div>
                                <h3>Игра отклонена</h3>
                                <p>"{showSuccessModal.title}" была отклонена.</p>
                            </>
                        )}
                        {showSuccessModal.type === 'delete' && (
                            <>
                                <div className="success-icon delete"></div>
                                <h3>Игра удалена</h3>
                                <p>"{showSuccessModal.title}" была навсегда удалена.</p>
                            </>
                        )}
                        {showSuccessModal.type === 'error' && (
                            <>
                                <div className="success-icon error"></div>
                                <h3>Ошибка</h3>
                                <p>{showSuccessModal.message}</p>
                            </>
                        )}
                        <div className="modal-actions">
                            <button onClick={() => setShowSuccessModal(null)}>ОК</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminModeration;
