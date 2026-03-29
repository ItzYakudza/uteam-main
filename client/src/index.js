/**
 * UTEAM Client - Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Отключаем Strict Mode в production для избежания дублирования запросов
const isDevelopment = process.env.NODE_ENV === 'development';

root.render(
    isDevelopment ? (
        <React.StrictMode>
            <App />
        </React.StrictMode>
    ) : (
        <App />
    )
);
