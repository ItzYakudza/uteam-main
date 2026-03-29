/**
 * Маршруты библиотеки пользователя
 */

const express = require('express');
const router = express.Router();
const Library = require('../models/Library');
const Game = require('../models/Game');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

/**
 * GET /api/library
 * Получение библиотеки текущего пользователя
 */
router.get('/', auth, async (req, res) => {
    try {
        const { filter, sort = 'name' } = req.query;

        const query = { user: req.user._id };

        // Фильтры
        if (filter === 'installed') {
            query.installed = true;
        } else if (filter === 'favorites') {
            query.isFavorite = true;
        } else if (filter === 'hidden') {
            query.isHidden = true;
        }

        // Сортировка
        let sortOption = {};
        switch (sort) {
            case 'name':
                sortOption = { 'game.title': 1 };
                break;
            case 'recent':
                sortOption = { lastPlayed: -1 };
                break;
            case 'playtime':
                sortOption = { playTime: -1 };
                break;
            case 'added':
                sortOption = { addedAt: -1 };
                break;
            default:
                sortOption = { addedAt: -1 };
        }

        let library = await Library.find(query)
            .populate('game', 'title coverImage gameIcon description developer developerName genres categories gameType gamePath downloadUrl gameArchive externalDownloadUrl executablePath')
            .sort(sortOption);

        // Фильтруем записи где игра была удалена (game: null)
        const validLibrary = library.filter(item => item.game !== null);
        
        // Если есть битые записи - удаляем их асинхронно (не блокируем ответ)
        if (validLibrary.length < library.length) {
            const invalidIds = library.filter(item => item.game === null).map(item => item._id);
            Library.deleteMany({ _id: { $in: invalidIds } }).catch(err => 
                console.error('Error cleaning invalid library entries:', err)
            );
        }
        
        library = validLibrary;

        // Статистика библиотеки
        const stats = {
            totalGames: library.length,
            installed: library.filter(l => l.installed).length,
            totalPlayTime: library.reduce((sum, l) => sum + l.playTime, 0)
        };

        res.json({
            library,
            stats
        });
    } catch (error) {
        console.error('Ошибка получения библиотеки:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/library/add/:gameId
 * Добавление игры в библиотеку
 */
router.post('/add/:gameId', auth, async (req, res) => {
    try {
        const game = await Game.findById(req.params.gameId);

        if (!game || game.status !== 'approved') {
            return res.status(404).json({ 
                error: 'Игра не найдена' 
            });
        }

        // Проверка на существование в библиотеке
        const existing = await Library.findOne({
            user: req.user._id,
            game: game._id
        });

        if (existing) {
            return res.status(400).json({ 
                error: 'Игра уже в библиотеке' 
            });
        }

        // Проверка цены (для платных игр в будущем)
        if (game.price > 0) {
            // Здесь будет логика покупки
            return res.status(400).json({ 
                error: 'Платные игры пока не поддерживаются' 
            });
        }

        // Создание записи в библиотеке
        const libraryEntry = new Library({
            user: req.user._id,
            game: game._id,
            acquisitionType: game.price === 0 ? 'free' : 'purchased'
        });

        await libraryEntry.save();

        // Обновление счётчика установок
        await Game.findByIdAndUpdate(game._id, {
            $inc: { installs: 1 }
        });

        // Обновление статистики пользователя и XP
        req.user.gamesOwned += 1;
        req.user.addXP(10);
        await req.user.save();

        await libraryEntry.populate('game', 'title coverImage');

        res.status(201).json({
            message: 'Игра добавлена в библиотеку',
            entry: libraryEntry
        });
    } catch (error) {
        console.error('Ошибка добавления в библиотеку:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * DELETE /api/library/remove/:gameId
 * Удаление игры из библиотеки
 */
router.delete('/remove/:gameId', auth, async (req, res) => {
    try {
        const result = await Library.findOneAndDelete({
            user: req.user._id,
            game: req.params.gameId
        });

        if (!result) {
            return res.status(404).json({ 
                error: 'Игра не найдена в библиотеке' 
            });
        }

        // Обновление статистики пользователя
        req.user.gamesOwned = Math.max(0, req.user.gamesOwned - 1);
        await req.user.save();

        res.json({ message: 'Игра удалена из библиотеки' });
    } catch (error) {
        console.error('Ошибка удаления из библиотеки:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/library/:gameId/install
 * Отметка игры как установленной
 */
router.put('/:gameId/install', auth, async (req, res) => {
    try {
        const { installPath, executablePath } = req.body;

        const entry = await Library.findOneAndUpdate(
            { user: req.user._id, game: req.params.gameId },
            {
                installed: true,
                installPath,
                executablePath,
                installedAt: Date.now()
            },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ 
                error: 'Игра не найдена в библиотеке' 
            });
        }

        res.json({
            message: 'Игра установлена',
            entry
        });
    } catch (error) {
        console.error('Ошибка установки:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/library/:gameId/uninstall
 * Отметка игры как удалённой
 */
router.put('/:gameId/uninstall', auth, async (req, res) => {
    try {
        const entry = await Library.findOneAndUpdate(
            { user: req.user._id, game: req.params.gameId },
            {
                installed: false,
                installPath: null,
                executablePath: null
            },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ 
                error: 'Игра не найдена в библиотеке' 
            });
        }

        res.json({
            message: 'Игра удалена',
            entry
        });
    } catch (error) {
        console.error('Ошибка удаления:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/library/:gameId/favorite
 * Добавление/удаление из избранного
 */
router.put('/:gameId/favorite', auth, async (req, res) => {
    try {
        const entry = await Library.findOne({
            user: req.user._id,
            game: req.params.gameId
        });

        if (!entry) {
            return res.status(404).json({ 
                error: 'Игра не найдена в библиотеке' 
            });
        }

        entry.isFavorite = !entry.isFavorite;
        await entry.save();

        res.json({
            message: entry.isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного',
            isFavorite: entry.isFavorite
        });
    } catch (error) {
        console.error('Ошибка избранного:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * PUT /api/library/:gameId/playtime
 * Обновление времени игры
 */
router.put('/:gameId/playtime', auth, async (req, res) => {
    try {
        const { minutes } = req.body;

        if (!minutes || minutes < 0) {
            return res.status(400).json({ 
                error: 'Укажите корректное время' 
            });
        }

        const entry = await Library.findOneAndUpdate(
            { user: req.user._id, game: req.params.gameId },
            {
                $inc: { playTime: minutes, timesLaunched: 1 },
                lastPlayed: Date.now()
            },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ 
                error: 'Игра не найдена в библиотеке' 
            });
        }

        // Обновление общего времени игры пользователя
        req.user.totalPlayTime += minutes;
        // XP за игру (5 XP за каждые 60 минут)
        const xpEarned = Math.floor(minutes / 60) * 5;
        if (xpEarned > 0) {
            req.user.addXP(xpEarned);
        }
        await req.user.save();

        // Обновление статистики игры
        await Game.findByIdAndUpdate(req.params.gameId, {
            $inc: { totalPlayTime: minutes }
        });

        res.json({
            message: 'Время игры обновлено',
            playTime: entry.playTime,
            xpEarned
        });
    } catch (error) {
        console.error('Ошибка обновления времени:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

module.exports = router;
