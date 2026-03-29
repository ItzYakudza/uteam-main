/**
 * Маршруты друзей
 * Управление списком друзей и чатом
 */

const express = require('express');
const router = express.Router();
const Friend = require('../models/Friend');
const User = require('../models/User');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

/**
 * GET /api/friends
 * Получение списка друзей
 */
router.get('/', auth, async (req, res) => {
    try {
        // Находим все принятые дружбы
        const friendships = await Friend.find({
            $or: [
                { requester: req.user._id, status: 'accepted' },
                { recipient: req.user._id, status: 'accepted' }
            ]
        });

        // Извлекаем ID друзей
        const friendIds = friendships.map(f => 
            f.requester.equals(req.user._id) ? f.recipient : f.requester
        );

        // Получаем данные друзей
        const friends = await User.find({ _id: { $in: friendIds } })
            .select('username avatar level status currentGame lastOnline');

        res.json(friends);
    } catch (error) {
        console.error('Ошибка получения друзей:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/friends/requests
 * Получение входящих заявок в друзья
 */
router.get('/requests', auth, async (req, res) => {
    try {
        const requests = await Friend.find({
            recipient: req.user._id,
            status: 'pending'
        }).populate('requester', 'username avatar level');

        res.json(requests);
    } catch (error) {
        console.error('Ошибка получения заявок:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/friends/sent
 * Получение исходящих заявок
 */
router.get('/sent', auth, async (req, res) => {
    try {
        const requests = await Friend.find({
            requester: req.user._id,
            status: 'pending'
        }).populate('recipient', 'username avatar level');

        res.json(requests);
    } catch (error) {
        console.error('Ошибка получения заявок:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/friends/add/:userId
 * Отправка заявки в друзья
 */
router.post('/add/:userId', auth, async (req, res) => {
    try {
        const targetUserId = req.params.userId;

        // Нельзя добавить себя
        if (req.user._id.equals(targetUserId)) {
            return res.status(400).json({ 
                error: 'Нельзя добавить себя в друзья' 
            });
        }

        // Проверка существования пользователя
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ 
                error: 'Пользователь не найден' 
            });
        }

        // Проверка на существующую связь
        const existingFriendship = await Friend.findOne({
            $or: [
                { requester: req.user._id, recipient: targetUserId },
                { requester: targetUserId, recipient: req.user._id }
            ]
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({ 
                    error: 'Уже в друзьях' 
                });
            }
            if (existingFriendship.status === 'pending') {
                return res.status(400).json({ 
                    error: 'Заявка уже отправлена' 
                });
            }
            if (existingFriendship.status === 'blocked') {
                return res.status(400).json({ 
                    error: 'Невозможно добавить этого пользователя' 
                });
            }
        }

        // Создание заявки
        const friendship = new Friend({
            requester: req.user._id,
            recipient: targetUserId
        });

        await friendship.save();

        // Отправка уведомления через WebSocket
        const io = req.app.get('io');
        io.emit('friend:request', {
            to: targetUserId,
            from: {
                id: req.user._id,
                username: req.user.username,
                avatar: req.user.avatar
            }
        });

        res.status(201).json({
            message: 'Заявка отправлена',
            friendship
        });
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/friends/add-by-code
 * Добавление друга по UTEAM ID
 */
router.post('/add-by-code', auth, async (req, res) => {
    try {
        const { uteamId } = req.body;

        if (!uteamId) {
            return res.status(400).json({ error: 'UTEAM ID is required' });
        }

        // Нормализуем ID (добавляем # если нет)
        let normalizedId = uteamId.trim().toUpperCase();
        if (!normalizedId.startsWith('#')) {
            normalizedId = '#' + normalizedId;
        }

        // Находим пользователя по UTEAM ID
        const targetUser = await User.findOne({ uteamId: normalizedId });
        
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found with this UTEAM ID' });
        }

        // Нельзя добавить себя
        if (req.user._id.equals(targetUser._id)) {
            return res.status(400).json({ error: 'You cannot add yourself' });
        }

        // Проверка на существующую связь
        const existingFriendship = await Friend.findOne({
            $or: [
                { requester: req.user._id, recipient: targetUser._id },
                { requester: targetUser._id, recipient: req.user._id }
            ]
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({ error: 'Already friends' });
            }
            if (existingFriendship.status === 'pending') {
                return res.status(400).json({ error: 'Friend request already sent' });
            }
        }

        // Создание заявки
        const friendship = new Friend({
            requester: req.user._id,
            recipient: targetUser._id
        });

        await friendship.save();

        res.status(201).json({
            message: 'Friend request sent!',
            friendship
        });
    } catch (error) {
        console.error('Add by code error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/friends/accept/:requestId
 * Принятие заявки в друзья
 */
router.post('/accept/:requestId', auth, async (req, res) => {
    try {
        const friendship = await Friend.findOne({
            _id: req.params.requestId,
            recipient: req.user._id,
            status: 'pending'
        });

        if (!friendship) {
            return res.status(404).json({ 
                error: 'Заявка не найдена' 
            });
        }

        friendship.status = 'accepted';
        friendship.respondedAt = Date.now();
        await friendship.save();

        // Добавляем XP обоим пользователям
        req.user.addXP(15);
        await req.user.save();

        const requester = await User.findById(friendship.requester);
        if (requester) {
            requester.addXP(15);
            await requester.save();
        }

        // Уведомление
        const io = req.app.get('io');
        io.emit('friend:accepted', {
            to: friendship.requester,
            from: {
                id: req.user._id,
                username: req.user.username,
                avatar: req.user.avatar
            }
        });

        res.json({
            message: 'Заявка принята',
            friendship
        });
    } catch (error) {
        console.error('Ошибка принятия заявки:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/friends/reject/:requestId
 * Отклонение заявки в друзья
 */
router.post('/reject/:requestId', auth, async (req, res) => {
    try {
        const friendship = await Friend.findOne({
            _id: req.params.requestId,
            recipient: req.user._id,
            status: 'pending'
        });

        if (!friendship) {
            return res.status(404).json({ 
                error: 'Заявка не найдена' 
            });
        }

        friendship.status = 'rejected';
        friendship.respondedAt = Date.now();
        await friendship.save();

        res.json({ message: 'Заявка отклонена' });
    } catch (error) {
        console.error('Ошибка отклонения заявки:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * DELETE /api/friends/remove/:userId
 * Удаление из друзей
 */
router.delete('/remove/:userId', auth, async (req, res) => {
    try {
        const result = await Friend.findOneAndDelete({
            $or: [
                { requester: req.user._id, recipient: req.params.userId, status: 'accepted' },
                { requester: req.params.userId, recipient: req.user._id, status: 'accepted' }
            ]
        });

        if (!result) {
            return res.status(404).json({ 
                error: 'Не найден в списке друзей' 
            });
        }

        res.json({ message: 'Удалён из друзей' });
    } catch (error) {
        console.error('Ошибка удаления друга:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/friends/chat/:userId
 * Получение истории чата с другом
 */
router.get('/chat/:userId', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await Message.find({
            $or: [
                { from: req.user._id, to: req.params.userId },
                { from: req.params.userId, to: req.user._id }
            ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        // Отмечаем сообщения как прочитанные
        await Message.updateMany(
            { from: req.params.userId, to: req.user._id, read: false },
            { read: true }
        );

        res.json(messages.reverse());
    } catch (error) {
        console.error('Ошибка получения чата:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * POST /api/friends/chat/:userId
 * Отправка сообщения другу
 */
router.post('/chat/:userId', auth, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Сообщение не может быть пустым' 
            });
        }

        // Проверка дружбы
        const friendship = await Friend.findOne({
            $or: [
                { requester: req.user._id, recipient: req.params.userId, status: 'accepted' },
                { requester: req.params.userId, recipient: req.user._id, status: 'accepted' }
            ]
        });

        if (!friendship) {
            return res.status(403).json({ 
                error: 'Можно писать только друзьям' 
            });
        }

        const message = new Message({
            from: req.user._id,
            to: req.params.userId,
            content: content.trim()
        });

        await message.save();

        // Отправка через WebSocket
        const io = req.app.get('io');
        io.emit('chat:message', {
            to: req.params.userId,
            message: {
                id: message._id,
                from: req.user._id,
                content: message.content,
                createdAt: message.createdAt
            }
        });

        res.status(201).json(message);
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

/**
 * GET /api/friends/unread
 * Получение количества непрочитанных сообщений
 */
router.get('/unread', auth, async (req, res) => {
    try {
        const unreadCount = await Message.countDocuments({
            to: req.user._id,
            read: false
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error('Ошибка получения непрочитанных:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера' 
        });
    }
});

module.exports = router;
