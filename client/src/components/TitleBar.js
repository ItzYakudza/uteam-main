/**
 * TitleBar - Кастомная панель заголовка окна
 */

import React from 'react';
import './TitleBar.css';

function TitleBar() {
    const handleMinimize = () => {
        window.electronAPI?.window.minimize();
    };

    const handleMaximize = () => {
        window.electronAPI?.window.maximize();
    };

    const handleClose = () => {
        window.electronAPI?.window.close();
    };

    return (
        <div className="titlebar">
            <div className="titlebar-drag">
                <span className="titlebar-title">UTEAM</span>
            </div>
            <div className="titlebar-controls">
                <button 
                    className="titlebar-btn titlebar-minimize" 
                    onClick={handleMinimize}
                    title="Свернуть"
                >
                    <svg width="10" height="1" viewBox="0 0 10 1">
                        <rect width="10" height="1" fill="currentColor"/>
                    </svg>
                </button>
                <button 
                    className="titlebar-btn titlebar-maximize" 
                    onClick={handleMaximize}
                    title="Развернуть"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <rect width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                </button>
                <button 
                    className="titlebar-btn titlebar-close" 
                    onClick={handleClose}
                    title="Закрыть"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2"/>
                        <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default TitleBar;
