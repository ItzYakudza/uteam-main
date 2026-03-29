/**
 * Маршруты загрузки игр (для разработчиков)
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Game = require('../models/Game');
const { auth, developerOnly } = require('../middleware/auth');
const { uploadGame, uploadScreenshots, uploadCover, handleUploadError } = require('../middleware/upload');

/**
 * POST /api/submissions/game
 * Загрузка новой игры
 */
router.post('/game', auth, developerOnly, uploadGame.single('gameFile'), handleUploadError, async (req, res) => {
    try {
        const {
            title,
            description,
            shortDescription,
            categories,
            tags,
            price,
            gameType,
            executablePath,
            requirements
        } = req.body;

        // Валидация
        if (!title || !description) {
            return res.status(400).json({ 
                error: 'Название и описание обязательны' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                error: 'Файл игры обязателен' 
            });
        }

        // Создание записи игры
        const game = new Game({
            title,
            description,
            shortDescription: shortDescription || description.substring(0, 200),
            developer: req.user._id,
            developerName: req.user.username,
            price: parseFloat(price) || 0,
            categories: categories ? JSON.parse(categories) : ['indie'],
            tags: tags ? JSON.parse(tags) : [],
            gameType: gameType || 'executable',
            gameArchive: `/uploads/games/${req.file.filename}`,
            gamePath: `/uploads/games/${req.file.filename}`,
            gameSize: req.file.size,
            executablePath: executablePath || 'game.exe',
            requirements: requirements ? JSON.parse(requirements) : {},
            status: 'pending'
        });

        await game.save();

        res.status(201).json({
            message: 'Игра отправлена на модерацию',
            game: {
                id: game._id,
                title: game.title,
                status: game.status
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки игры:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при загрузке игры' 
        });
    }
});

/**
 * POST /api/submissions/:gameId/cover
 * Загрузка обложки игры
 */
router.post('/:gameId/cover', auth, developerOnly, uploadCover.single('cover'), handleUploadError, async (req, res) => {
    try {
        const game = await Game.findOne({
            _id: req.params.gameId,
            developer: req.user._id
        });

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                error: 'Файл не загружен' 
            });
        }

        game.coverImage = `/uploads/covers/${req.file.filename}`;
        await game.save();

        res.json({
            message: 'Обложка загружена',
            coverImage: game.coverImage
        });
    } catch (error) {
        console.error('Ошибка загрузки обложки:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/submissions/:gameId/screenshots
 * Загрузка скриншотов
 */
router.post('/:gameId/screenshots', auth, developerOnly, uploadScreenshots.array('screenshots', 10), handleUploadError, async (req, res) => {
    try {
        const game = await Game.findOne({
            _id: req.params.gameId,
            developer: req.user._id
        });

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                error: 'Файлы не загружены' 
            });
        }

        const screenshots = req.files.map(f => `/uploads/screenshots/${f.filename}`);
        game.screenshots.push(...screenshots);
        await game.save();

        res.json({
            message: 'Скриншоты загружены',
            screenshots: game.screenshots
        });
    } catch (error) {
        console.error('Ошибка загрузки скриншотов:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/submissions/:gameId/banner
 * Загрузка баннера для слайдера
 */
router.post('/:gameId/banner', auth, developerOnly, uploadScreenshots.single('banner'), handleUploadError, async (req, res) => {
    try {
        const game = await Game.findOne({
            _id: req.params.gameId,
            developer: req.user._id
        });

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                error: 'Файл не загружен' 
            });
        }

        game.bannerImage = `/uploads/screenshots/${req.file.filename}`;
        await game.save();

        res.json({
            message: 'Баннер загружен',
            bannerImage: game.bannerImage
        });
    } catch (error) {
        console.error('Ошибка загрузки баннера:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/submissions/my
 * Мои загруженные игры
 */
router.get('/my', auth, developerOnly, async (req, res) => {
    try {
        const games = await Game.find({ developer: req.user._id })
            .select('title coverImage status downloads rating createdAt rejectionReason')
            .sort('-createdAt');

        res.json(games);
    } catch (error) {
        console.error('Ошибка получения игр:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/submissions/:gameId
 * Обновление информации об игре
 */
router.put('/:gameId', auth, developerOnly, async (req, res) => {
    try {
        const game = await Game.findOne({
            _id: req.params.gameId,
            developer: req.user._id
        });

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        // Нельзя редактировать одобренные игры (только описание)
        const allowedFields = game.status === 'approved' 
            ? ['description', 'shortDescription', 'tags']
            : ['title', 'description', 'shortDescription', 'categories', 'tags', 'price', 'executablePath', 'requirements'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                game[field] = req.body[field];
            }
        });

        // Если игра была отклонена, отправляем на повторную модерацию
        if (game.status === 'rejected') {
            game.status = 'pending';
            game.rejectionReason = null;
        }

        await game.save();

        res.json({
            message: 'Игра обновлена',
            game
        });
    } catch (error) {
        console.error('Ошибка обновления игры:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * DELETE /api/submissions/:gameId
 * Удаление своей игры
 */
router.delete('/:gameId', auth, developerOnly, async (req, res) => {
    try {
        const game = await Game.findOneAndDelete({
            _id: req.params.gameId,
            developer: req.user._id,
            status: { $ne: 'approved' } // Нельзя удалить одобренную игру
        });

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена или не может быть удалена' 
            });
        }

        res.json({ message: 'Игра удалена' });
    } catch (error) {
        console.error('Ошибка удаления игры:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/submissions/:gameId/stats
 * Статистика игры для разработчика
 */
router.get('/:gameId/stats', auth, developerOnly, async (req, res) => {
    try {
        const game = await Game.findOne({
            _id: req.params.gameId,
            developer: req.user._id
        });

        if (!game) {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        const totalReviews = game.rating.positive + game.rating.negative;
        const positivePercent = totalReviews > 0 
            ? Math.round((game.rating.positive / totalReviews) * 100) 
            : 0;

        res.json({
            downloads: game.downloads,
            installs: game.installs,
            rating: {
                positive: game.rating.positive,
                negative: game.rating.negative,
                total: totalReviews,
                positivePercent
            },
            totalPlayTime: game.totalPlayTime,
            status: game.status
        });
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

module.exports = router;
