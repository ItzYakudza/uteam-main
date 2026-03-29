/**
 * Маршруты аутентификации
 * Регистрация, вход, проверка токена, управление устройствами
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Device = require('../models/Device');
const { auth } = require('../middleware/auth');

// Генерация уникального ID устройства
const generateDeviceId = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Генерация уникального UTEAM ID (формат: #XXXXXXX)
const generateUteamId = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Без похожих символов (0,O,1,I)
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        let id = '#';
        for (let i = 0; i < 7; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Проверяем уникальность
        const existing = await User.findOne({ uteamId: id });
        if (!existing) {
            return id;
        }
        attempts++;
    }
    
    // Fallback - добавляем timestamp
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    let id = '#';
    for (let i = 0; i < 3; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id + timestamp;
};

// Валидация регистрации
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Имя пользователя от 3 до 30 символов')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Имя может содержать только буквы, цифры и _'),
    body('email')
        .isEmail()
        .withMessage('Некорректный email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Пароль минимум 6 символов')
];

// Валидация входа
const loginValidation = [
    body('login')
        .trim()
        .notEmpty()
        .withMessage('Введите логин или email'),
    body('password')
        .notEmpty()
        .withMessage('Введите пароль')
];

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 */
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Проверка валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }

        const { username, email, password } = req.body;

        // Проверка существования пользователя
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ 
                    error: 'Этот email уже зарегистрирован' 
                });
            }
            return res.status(400).json({ 
                error: 'Это имя пользователя занято' 
            });
        }

        // Создание пользователя
        const uteamId = await generateUteamId();
        const user = new User({
            username,
            email,
            password,
            uteamId
        });

        await user.save();

        // Генерация токена
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Создание записи устройства
        const deviceInfo = req.body.deviceInfo || {};
        const deviceId = deviceInfo.deviceId || generateDeviceId();
        
        const device = new Device({
            userId: user._id,
            deviceId,
            deviceName: deviceInfo.deviceName || 'Unknown Device',
            platform: deviceInfo.platform || 'unknown',
            browser: deviceInfo.browser || req.headers['user-agent'] || 'unknown',
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
            token,
            isActive: true
        });
        await device.save();

        res.status(201).json({
            message: 'Регистрация успешна',
            token,
            deviceId,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                level: user.level,
                xp: user.xp,
                role: user.role,
                uteamId: user.uteamId
            }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при регистрации' 
        });
    }
});

/**
 * POST /api/auth/login
 * Вход в систему
 */
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Проверка валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }

        const { login, password } = req.body;

        // Поиск пользователя по email или username
        const user = await User.findOne({
            $or: [
                { email: login.toLowerCase() },
                { username: login }
            ]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ 
                error: 'Неверный логин или пароль' 
            });
        }

        // Проверка пароля
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                error: 'Неверный логин или пароль' 
            });
        }

        // Присвоение UTEAM ID для старых пользователей
        if (!user.uteamId) {
            user.uteamId = await generateUteamId();
        }

        // Обновление статуса
        user.status = 'online';
        user.lastOnline = Date.now();
        await user.save();

        // Генерация токена
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Создание или обновление записи устройства
        const deviceInfo = req.body.deviceInfo || {};
        const deviceId = deviceInfo.deviceId || generateDeviceId();
        
        // Проверяем существующее устройство
        let device = await Device.findOne({ 
            userId: user._id, 
            deviceId 
        });

        if (device) {
            // Обновляем существующее устройство
            device.token = token;
            device.lastUsed = Date.now();
            device.isActive = true;
            device.ip = req.ip || req.connection?.remoteAddress || 'unknown';
            await device.save();
        } else {
            // Создаём новое устройство
            device = new Device({
                userId: user._id,
                deviceId,
                deviceName: deviceInfo.deviceName || 'Unknown Device',
                platform: deviceInfo.platform || 'unknown',
                browser: deviceInfo.browser || req.headers['user-agent'] || 'unknown',
                ip: req.ip || req.connection?.remoteAddress || 'unknown',
                token,
                isActive: true
            });
            await device.save();
        }

        res.json({
            message: 'Вход выполнен',
            token,
            deviceId,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                level: user.level,
                xp: user.xp,
                role: user.role,
                status: user.status,
                uteamId: user.uteamId
            }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при входе' 
        });
    }
});

/**
 * GET /api/auth/verify
 * Проверка токена и получение данных пользователя
 */
router.get('/verify', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('featuredGames', 'title coverImage');

        res.json({
            valid: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                profileBackground: user.profileBackground,
                bio: user.bio,
                country: user.country,
                realName: user.realName,
                level: user.level,
                xp: user.xp,
                totalPlayTime: user.totalPlayTime,
                gamesOwned: user.gamesOwned,
                reviewsCount: user.reviewsCount,
                status: user.status,
                role: user.role,
                featuredGames: user.featuredGames,
                privacy: user.privacy,
                createdAt: user.createdAt,
                uteamId: user.uteamId
            }
        });
    } catch (error) {
        console.error('Ошибка верификации:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/auth/logout
 * Выход из системы
 */
router.post('/logout', auth, async (req, res) => {
    try {
        req.user.status = 'offline';
        req.user.lastOnline = Date.now();
        await req.user.save();

        res.json({ message: 'Выход выполнен' });
    } catch (error) {
        console.error('Ошибка выхода:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/auth/change-password
 * Смена пароля
 */
router.post('/change-password', auth, [
    body('currentPassword').notEmpty().withMessage('Введите текущий пароль'),
    body('newPassword').isLength({ min: 6 }).withMessage('Новый пароль минимум 6 символов')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Получаем пользователя с паролем
        const user = await User.findById(req.user._id).select('+password');

        // Проверяем текущий пароль
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                error: 'Неверный текущий пароль' 
            });
        }

        // Устанавливаем новый пароль
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Пароль успешно изменён' });
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/auth/devices
 * Получение списка авторизованных устройств
 */
router.get('/devices', auth, async (req, res) => {
    try {
        const devices = await Device.find({ 
            userId: req.user._id,
            isActive: true 
        }).sort({ lastUsed: -1 });

        // Получаем текущий deviceId из заголовка
        const currentDeviceId = req.headers['x-device-id'];

        const deviceList = devices.map(device => ({
            id: device._id,
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            platform: device.platform,
            browser: device.browser,
            ip: device.ip,
            lastUsed: device.lastUsed,
            createdAt: device.createdAt,
            isCurrent: device.deviceId === currentDeviceId
        }));

        res.json({ devices: deviceList });
    } catch (error) {
        console.error('Ошибка получения устройств:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * DELETE /api/auth/devices/:deviceId
 * Отключение устройства (выход с устройства)
 */
router.delete('/devices/:deviceId', auth, async (req, res) => {
    try {
        const { deviceId } = req.params;

        const device = await Device.findOne({ 
            userId: req.user._id,
            deviceId 
        });

        if (!device) {
            return res.status(404).json({ 
                error: 'Устройство не найдено' 
            });
        }

        // Деактивируем устройство
        device.isActive = false;
        device.token = null;
        await device.save();

        res.json({ message: 'Устройство отключено' });
    } catch (error) {
        console.error('Ошибка отключения устройства:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * DELETE /api/auth/devices
 * Отключение всех устройств кроме текущего
 */
router.delete('/devices', auth, async (req, res) => {
    try {
        const currentDeviceId = req.headers['x-device-id'];

        await Device.updateMany(
            { 
                userId: req.user._id,
                deviceId: { $ne: currentDeviceId }
            },
            { 
                isActive: false,
                token: null 
            }
        );

        res.json({ message: 'Все устройства отключены' });
    } catch (error) {
        console.error('Ошибка отключения устройств:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/auth/token-login
 * Автовход по сохранённому токену и deviceId
 */
router.post('/token-login', async (req, res) => {
    try {
        const { token, deviceId } = req.body;

        if (!token || !deviceId) {
            return res.status(400).json({ 
                error: 'Требуется токен и deviceId' 
            });
        }

        // Проверяем токен
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ 
                error: 'Недействительный токен' 
            });
        }

        // Проверяем устройство
        const device = await Device.findOne({ 
            userId: decoded.userId,
            deviceId,
            isActive: true,
            token 
        });

        if (!device) {
            return res.status(401).json({ 
                error: 'Устройство не авторизовано' 
            });
        }

        // Получаем пользователя
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ 
                error: 'Пользователь не найден' 
            });
        }

        // Обновляем последнее использование
        device.lastUsed = Date.now();
        device.ip = req.ip || req.connection?.remoteAddress || 'unknown';
        await device.save();

        // Обновляем статус пользователя
        user.status = 'online';
        user.lastOnline = Date.now();
        await user.save();

        res.json({
            message: 'Автовход выполнен',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                level: user.level,
                xp: user.xp,
                role: user.role,
                status: user.status,
                uteamId: user.uteamId,
                bio: user.bio,
                country: user.country,
                realName: user.realName,
                privacy: user.privacy
            }
        });
    } catch (error) {
        console.error('Ошибка автовхода:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * DELETE /api/auth/delete-account
 * Удаление аккаунта пользователя
 */
router.delete('/delete-account', auth, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // Получаем пользователя с паролем
        const user = await User.findById(req.user._id).select('+password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Проверяем пароль
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Удаляем все устройства пользователя
        await Device.deleteMany({ userId: user._id });

        // Удаляем пользователя
        await User.findByIdAndDelete(user._id);

        // Также можно удалить связанные данные:
        // await Library.deleteMany({ user: user._id });
        // await Friend.deleteMany({ $or: [{ requester: user._id }, { recipient: user._id }] });
        // await Review.deleteMany({ user: user._id });

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
