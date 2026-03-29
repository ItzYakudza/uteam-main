/**
 * LoadingScreen - Экран загрузки данных (как в Steam)
 */

import React from 'react';
import './LoadingScreen.css';

function LoadingScreen({ status, progress }) {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-logo">
                    <span className="logo-text">UTEAM</span>
                    <span className="logo-subtitle">GAME PLATFORM</span>
                </div>
                
                <div className="loading-progress-container">
                    <div className="loading-progress-bar">
                        <div 
                            className="loading-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="loading-progress-text">{progress}%</div>
                </div>
                
                <div className="loading-status">{status}</div>
                
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                </div>
            </div>
            
            <div className="loading-footer">
                <span>© 2026 UTEAM. Все права защищены.</span>
            </div>
        </div>
    );
}

export default LoadingScreen;
