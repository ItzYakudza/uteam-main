/**
 * Маршруты администратора
 * Управление играми, пользователями, модерация
 */

const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const Library = require('../models/Library');
const Review = require('../models/Review');
const { auth, adminOnly } = require('../middleware/auth');

// Все маршруты требуют авторизации и прав администратора
router.use(auth);
router.use(adminOnly);

/**
 * GET /api/admin/stats
 * Получение статистики платформы
 */
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            totalGames,
            approvedGames,
            pendingGames,
            totalLibraryEntries,
            totalReviews
        ] = await Promise.all([
            User.countDocuments(),
            Game.countDocuments(),
            Game.countDocuments({ status: 'approved' }),
            Game.countDocuments({ status: 'pending' }),
            Library.countDocuments(),
            Review.countDocuments()
        ]);

        // Статистика за последние 7 дней
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const [newUsers, newGames] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: weekAgo } }),
            Game.countDocuments({ createdAt: { $gte: weekAgo } })
        ]);

        res.json({
            users: {
                total: totalUsers,
                newThisWeek: newUsers
            },
            games: {
                total: totalGames,
                approved: approvedGames,
                pending: pendingGames,
                newThisWeek: newGames
            },
            activity: {
                libraryEntries: totalLibraryEntries,
                reviews: totalReviews
            }
        });
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/admin/users
 * Список всех пользователей
 */
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 50, search, role } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            filter.role = role;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('username email avatar level role status createdAt gamesOwned')
                .sort('-createdAt')
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(filter)
        ]);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/admin/users/:id/role
 * Изменение роли пользователя
 */
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'developer', 'moderator', 'admin'].includes(role)) {
            return res.status(400).json({ 
                error: 'Недопустимая роль' 
            });
        }

        // Нельзя изменить свою роль
        if (req.user._id.equals(req.params.id)) {
            return res.status(400).json({ 
                error: 'Нельзя изменить свою роль' 
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('username email role');

        if (!user) {
            return res.status(404).json({ 
                error: 'Пользователь не найден' 
            });
        }

        res.json({
            message: 'Роль изменена',
            user
        });
    } catch (error) {
        console.error('Ошибка изменения роли:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/admin/games
 * Список всех игр (включая неопубликованные)
 */
router.get('/games', async (req, res) => {
    try {
        const { page = 1, limit = 50, status, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        
        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        const [games, total] = await Promise.all([
            Game.find(filter)
                .populate('developer', 'username')
                .select('title coverImage status downloads createdAt developerName')
                .sort('-createdAt')
                .skip(skip)
                .limit(parseInt(limit)),
            Game.countDocuments(filter)
        ]);

        res.json({
            games,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Ошибка получения игр:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/admin/games/pending
 * Игры на модерации
 */
router.get('/games/pending', async (req, res) => {
    try {
        const games = await Game.find({ status: 'pending' })
            .populate('developer', 'username email')
            .sort('createdAt');

        res.json(games);
    } catch (error) {
        console.error('Ошибка получения игр на модерации:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/admin/games/:id/approve
 * Одобрение игры
 */
router.put('/games/:id/approve', async (req, res) => {
    try {
        const game = await Game.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'approved',
                releaseDate: Date.now(),
                isNewRelease: true
            },
            { new: true }
        );

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        // Уведомление разработчика (можно добавить email)
        const io = req.app.get('io');
        io.emit('game:approved', {
            to: game.developer,
            game: {
                id: game._id,
                title: game.title
            }
        });

        res.json({
            message: 'Игра одобрена',
            game
        });
    } catch (error) {
        console.error('Ошибка одобрения игры:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/admin/games/:id/reject
 * Отклонение игры
 */
router.put('/games/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ 
                error: 'Укажите причину отклонения' 
            });
        }

        const game = await Game.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'rejected',
                rejectionReason: reason
            },
            { new: true }
        );

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        // Уведомление разработчика
        const io = req.app.get('io');
        io.emit('game:rejected', {
            to: game.developer,
            game: {
                id: game._id,
                title: game.title,
                reason
            }
        });

        res.json({
            message: 'Игра отклонена',
            game
        });
    } catch (error) {
        console.error('Ошибка отклонения игры:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/admin/games/:id/featured
 * Добавление/удаление из рекомендуемых
 */
router.put('/games/:id/featured', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        game.isFeatured = !game.isFeatured;
        await game.save();

        res.json({
            message: game.isFeatured ? 'Добавлено в рекомендуемые' : 'Удалено из рекомендуемых',
            isFeatured: game.isFeatured
        });
    } catch (error) {
        console.error('Ошибка изменения статуса:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * DELETE /api/admin/games/:id
 * Удаление игры
 */
router.delete('/games/:id', async (req, res) => {
    try {
        const game = await Game.findByIdAndDelete(req.params.id);

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        // Удаляем из библиотек пользователей
        await Library.deleteMany({ game: req.params.id });

        // Удаляем отзывы
        await Review.deleteMany({ game: req.params.id });

        res.json({ message: 'Игра удалена' });
    } catch (error) {
        console.error('Ошибка удаления игры:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

module.exports = router;
