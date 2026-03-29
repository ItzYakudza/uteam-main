/**
 * Middleware аутентификации
 * Проверяет JWT токен и добавляет пользователя в req
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Получаем список админов из переменной окружения
const getAdminList = () => {
    const adminUsers = process.env.ADMIN_USERS || '';
    return adminUsers.split(',').map(username => username.trim()).filter(u => u);
};

// Проверка аутентификации и установка роли админа
const auth = async (req, res, next) => {
    try {
        // Получаем токен из заголовка
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Требуется авторизация' 
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Верифицируем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Находим пользователя
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Пользователь не найден' 
            });
        }

        // Проверяем если пользователь в списке админов
        const adminList = getAdminList();
        if (adminList.includes(user.username)) {
            user.role = 'admin';
        }

        // Добавляем пользователя в запрос
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Недействительный токен' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Токен истёк, войдите снова' 
            });
        }
        res.status(500).json({ 
            error: 'Ошибка аутентификации' 
        });
    }
};

// Опциональная аутентификация (не блокирует, если нет токена)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = user;
                req.token = token;
            }
        }
        
        next();
    } catch (error) {
        // Игнорируем ошибки, просто продолжаем без пользователя
        next();
    }
};

// Проверка роли администратора
const adminOnly = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Требуется авторизация' 
        });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ 
            error: 'Доступ запрещён. Требуются права администратора.' 
        });
    }
    
    next();
};

// Проверка роли разработчика
const developerOnly = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Требуется авторизация' 
        });
    }
    
    if (!['developer', 'admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({ 
            error: 'Доступ запрещён. Требуются права разработчика.' 
        });
    }
    
    next();
};

module.exports = { auth, optionalAuth, adminOnly, developerOnly, getAdminList };
