/**
 * Маршруты пользователей
 * Профили, настройки, поиск
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Library = require('../models/Library');
const { auth, optionalAuth } = require('../middleware/auth');
const { uploadAvatar, uploadBackground, handleUploadError } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

/**
 * PUT /api/users/avatar
 * Загрузка аватара - сохраняем на диск (Railway Volume)
 */
router.put('/avatar', auth, uploadAvatar.single('avatar'), handleUploadError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });

        res.json({
            message: 'Аватар загружен',
            avatar: avatarUrl
        });
    } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * PUT /api/users/background
 * Загрузка фона профиля - сохраняем на диск (Railway Volume)
 */
router.put('/background', auth, uploadBackground.single('background'), handleUploadError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const bgUrl = `/uploads/backgrounds/${req.file.filename}`;
        await User.findByIdAndUpdate(req.user._id, { profileBackground: bgUrl });

        res.json({
            message: 'Фон загружен',
            profileBackground: bgUrl
        });
    } catch (error) {
        console.error('Ошибка загрузки фона:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * PUT /api/users/profile
 * Обновление профиля текущего пользователя
 */
router.put('/profile', auth, [
    body('bio').optional().isLength({ max: 500 }),
    body('country').optional().isLength({ max: 50 }),
    body('realName').optional().isLength({ max: 100 }),
    body('customUrl').optional().isLength({ max: 30 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { bio, country, realName, customUrl } = req.body;
        const updates = {};
        
        if (bio !== undefined) updates.bio = bio;
        if (country !== undefined) updates.country = country;
        if (realName !== undefined) updates.realName = realName;
        if (customUrl !== undefined) updates.customUrl = customUrl;

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

        res.json({
            bio: user.bio,
            country: user.country,
            realName: user.realName,
            customUrl: user.customUrl
        });
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * PUT /api/users/privacy
 * Обновление настроек приватности
 */
router.put('/privacy', auth, async (req, res) => {
    try {
        const { displayStatus, privacy } = req.body;
        const updates = {};
        
        if (displayStatus !== undefined) {
            if (!['online', 'offline', 'invisible'].includes(displayStatus)) {
                return res.status(400).json({ error: 'Invalid display status' });
            }
            updates.displayStatus = displayStatus;
        }
        
        if (privacy !== undefined) {
            updates['privacy.profileVisible'] = privacy.profileVisible !== false;
            updates['privacy.showPlayTime'] = privacy.showPlayTime !== false;
            updates['privacy.showGames'] = privacy.showGames !== false;
            updates['privacy.showFriends'] = privacy.showFriends !== false;
            updates['privacy.showOnlineStatus'] = privacy.showOnlineStatus !== false;
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

        res.json({
            displayStatus: user.displayStatus,
            privacy: user.privacy
        });
    } catch (error) {
        console.error('Ошибка обновления приватности:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * PUT /api/users/email
 * Смена email адреса
 */
router.put('/email', auth, [
    body('newEmail').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { newEmail, password } = req.body;

        // Получаем пользователя с паролем
        const user = await User.findById(req.user._id).select('+password');
        
        // Проверяем пароль
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Проверяем, не занят ли email
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser && !existingUser._id.equals(user._id)) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Обновляем email
        user.email = newEmail;
        await user.save();

        res.json({
            message: 'Email changed successfully',
            email: user.email
        });
    } catch (error) {
        console.error('Ошибка смены email:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * PUT /api/users/password
 * Смена пароля пользователя
 */
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/users/me
 * Получение профиля текущего авторизованного пользователя
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('featuredGames', 'title coverImage');

        if (!user) {
            return res.status(404).json({ 
                error: 'Пользователь не найден' 
            });
        }

        // Для /me всегда возвращаем полный профиль (это владелец)
        const profile = {
            id: user._id,
            username: user.username,
            email: user.email,
            uteamId: user.uteamId,
            avatar: user.avatar,
            profileBackground: user.profileBackground,
            bio: user.bio,
            country: user.country,
            realName: user.realName,
            customUrl: user.customUrl,
            level: user.level,
            xp: user.xp,
            status: user.status,
            currentGame: user.currentGame,
            lastOnline: user.lastOnline,
            createdAt: user.createdAt,
            featuredGames: user.featuredGames,
            totalPlayTime: user.totalPlayTime,
            gamesOwned: user.gamesOwned,
            achievementsUnlocked: user.achievementsUnlocked,
            role: user.role,
            privacy: user.privacy,
            notifications: user.notifications
        };

        res.json(profile);
    } catch (error) {
        console.error('Ошибка получения профиля /me:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * GET /api/users/:id
 * Получение профиля пользователя по ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('featuredGames', 'title coverImage');

        if (!user) {
            return res.status(404).json({ 
                error: 'Пользователь не найден' 
            });
        }

        // Проверка приватности
        const isOwner = req.user && req.user._id.equals(user._id);
        const isPublic = user.privacy.profileVisible;

        if (!isPublic && !isOwner) {
            return res.json({
                id: user._id,
                username: user.username,
                avatar: user.avatar,
                level: user.level,
                status: user.status,
                private: true
            });
        }

        // Формируем ответ на основе настроек приватности
        const profile = {
            id: user._id,
            username: user.username,
            avatar: user.avatar,
            profileBackground: user.profileBackground,
            bio: user.bio,
            country: user.country,
            level: user.level,
            xp: user.xp,
            status: user.status,
            currentGame: user.currentGame,
            lastOnline: user.lastOnline,
            createdAt: user.createdAt,
            featuredGames: user.featuredGames
        };

        // Добавляем статистику если разрешено
        if (user.privacy.showPlayTime || isOwner) {
            profile.totalPlayTime = user.totalPlayTime;
        }
        if (user.privacy.showGames || isOwner) {
            profile.gamesOwned = user.gamesOwned;
        }

        // Реальное имя только для владельца
        if (isOwner) {
            profile.realName = user.realName;
            profile.email = user.email;
            profile.privacy = user.privacy;
        }

        res.json(profile);
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/users/:id
 * Обновление профиля
 */
router.put('/:id', auth, [
    body('bio').optional().isLength({ max: 500 }),
    body('country').optional().isLength({ max: 50 }),
    body('realName').optional().isLength({ max: 100 })
], async (req, res) => {
    try {
        // Проверка владельца
        if (!req.user._id.equals(req.params.id)) {
            return res.status(403).json({ 
                error: 'Нет прав на редактирование' 
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }

        const allowedUpdates = ['bio', 'country', 'realName', 'privacy'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        );

        res.json({
            message: 'Профиль обновлён',
            user: {
                id: user._id,
                username: user.username,
                bio: user.bio,
                country: user.country,
                realName: user.realName,
                privacy: user.privacy
            }
        });
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/users/:id/avatar
 * Загрузка аватара
 */
router.post('/:id/avatar', auth, uploadAvatar.single('avatar'), handleUploadError, async (req, res) => {
    try {
        if (!req.user._id.equals(req.params.id)) {
            return res.status(403).json({ 
                error: 'Нет прав на редактирование' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                error: 'Файл не загружен' 
            });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        await User.findByIdAndUpdate(req.params.id, { avatar: avatarUrl });

        res.json({
            message: 'Аватар загружен',
            avatar: avatarUrl
        });
    } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/users/:id/games
 * Получение игр пользователя
 */
router.get('/:id/games', optionalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                error: 'Пользователь не найден' 
            });
        }

        // Проверка приватности
        const isOwner = req.user && req.user._id.equals(user._id);
        if (!user.privacy.showGames && !isOwner) {
            return res.status(403).json({ 
                error: 'Игры скрыты настройками приватности' 
            });
        }

        const library = await Library.find({ user: req.params.id })
            .populate('game', 'title coverImage categories')
            .sort('-addedAt');

        res.json(library);
    } catch (error) {
        console.error('Ошибка получения игр:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/users/search/:query
 * Поиск пользователей
 */
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            'privacy.profileVisible': true
        })
        .select('username avatar level status')
        .limit(20);

        res.json(users);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/users/:id/featured-games
 * Установка витрины профиля
 */
router.post('/:id/featured-games', auth, async (req, res) => {
    try {
        if (!req.user._id.equals(req.params.id)) {
            return res.status(403).json({ 
                error: 'Нет прав на редактирование' 
            });
        }

        const { gameIds } = req.body;

        if (!Array.isArray(gameIds) || gameIds.length > 5) {
            return res.status(400).json({ 
                error: 'Максимум 5 игр в витрине' 
            });
        }

        // Проверяем, что игры есть в библиотеке
        const library = await Library.find({
            user: req.params.id,
            game: { $in: gameIds }
        });

        if (library.length !== gameIds.length) {
            return res.status(400).json({ 
                error: 'Некоторые игры не найдены в библиотеке' 
            });
        }

        await User.findByIdAndUpdate(req.params.id, {
            featuredGames: gameIds
        });

        res.json({ message: 'Витрина обновлена' });
    } catch (error) {
        console.error('Ошибка обновления витрины:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

module.exports = router;
