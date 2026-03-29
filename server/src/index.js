/**
 * UTEAM Server - Главный файл
 * Точка входа для API сервера
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const libraryRoutes = require('./routes/library');
const friendRoutes = require('./routes/friends');
const adminRoutes = require('./routes/admin');
const submissionRoutes = require('./routes/submissions');

// Инициализация Express
const app = express();
const server = http.createServer(app);

// Настройка Socket.io для чата и уведомлений
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
const cors = require('cors');
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Увеличиваем лимиты для больших файлов (500MB)
app.use(express.json({ limit: '200gb' }));
app.use(express.urlencoded({ extended: true, limit: '200gb' }));

app.use((req, res, next) => {
    req.setTimeout(0);
    next();
});

// Статические файлы (загруженные игры, аватары и т.д.)
// Используем UPLOADS_DIR из переменной окружения или путь по умолчанию
const uploadsPath = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('[Server] Static uploads served from:', uploadsPath);

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/submissions', submissionRoutes);

// Проверка работоспособности API
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'UTEAM API работает',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// Updates API - Система обновлений клиента
// ============================================
const Update = require('./models/Update');

// Секретный ключ для публикации обновлений (задать в ENV)
const UPDATE_SECRET = process.env.UPDATE_SECRET || 'uteam_production_secret_2026_xyz';

// Получить манифест последнего обновления
app.get('/api/updates/manifest', async (req, res) => {
    try {
        // Ищем последнюю версию в базе
        const latestUpdate = await Update.findOne({ isLatest: true });
        
        if (latestUpdate) {
            res.json({
                version: latestUpdate.version,
                downloadUrl: latestUpdate.downloadUrl,
                releaseNotes: latestUpdate.releaseNotes,
                mandatory: latestUpdate.mandatory,
                size: latestUpdate.size,
                releaseDate: latestUpdate.releaseDate
            });
        } else {
            // Fallback на ENV переменные если база пустая
            res.json({
                version: process.env.CLIENT_VERSION || '1.0.0',
                downloadUrl: process.env.CLIENT_DOWNLOAD_URL || 'https://github.com/ItzYakudza/uteam/releases/latest/download/uteam-update.zip',
                releaseNotes: process.env.CLIENT_RELEASE_NOTES || 'Bug fixes and performance improvements.',
                mandatory: false,
                size: 0,
                releaseDate: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error fetching update manifest:', error);
        res.status(500).json({ error: 'Failed to fetch update info' });
    }
});

// Опубликовать новое обновление (вызывается из build.bat)
app.post('/api/updates/publish', async (req, res) => {
    try {
        const { secret, version, releaseNotes, mandatory, size } = req.body;
        
        // Проверка секретного ключа
        if (secret !== UPDATE_SECRET) {
            return res.status(401).json({ error: 'Invalid secret key' });
        }
        
        if (!version) {
            return res.status(400).json({ error: 'Version is required' });
        }
        
        // Формируем URL для скачивания с GitHub
        const downloadUrl = `https://github.com/ItzYakudza/uteam/releases/download/v${version}/uteam-update-${version}.zip`;
        
        // Проверяем, существует ли уже такая версия
        let update = await Update.findOne({ version });
        
        if (update) {
            // Обновляем существующую
            update.downloadUrl = downloadUrl;
            update.releaseNotes = releaseNotes || update.releaseNotes;
            update.mandatory = mandatory || false;
            update.size = size || 0;
            update.isLatest = true;
            update.releaseDate = new Date();
            await update.save();
        } else {
            // Создаём новую
            update = await Update.create({
                version,
                downloadUrl,
                releaseNotes: releaseNotes || 'Bug fixes and performance improvements.',
                mandatory: mandatory || false,
                size: size || 0,
                isLatest: true
            });
        }
        
        console.log(`[Updates] Published version ${version}`);
        
        res.json({
            success: true,
            message: `Version ${version} published successfully`,
            update: {
                version: update.version,
                downloadUrl: update.downloadUrl,
                releaseDate: update.releaseDate
            }
        });
    } catch (error) {
        console.error('Error publishing update:', error);
        res.status(500).json({ error: 'Failed to publish update' });
    }
});

// Получить список всех версий (для админки)
app.get('/api/updates/list', async (req, res) => {
    try {
        const updates = await Update.find().sort({ releaseDate: -1 }).limit(10);
        res.json(updates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch updates' });
    }
});

// Хранение онлайн пользователей
const onlineUsers = new Map();

// Socket.io обработчики
io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    // Пользователь онлайн
    socket.on('user:online', (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit('user:status', { userId, status: 'online' });
        console.log(`Пользователь ${userId} онлайн`);
    });

    // Отправка сообщения
    socket.on('chat:message', (data) => {
        const { to, from, message } = data;
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
            io.to(recipientSocket).emit('chat:message', {
                from,
                message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Пользователь играет
    socket.on('user:playing', (data) => {
        const { userId, gameTitle } = data;
        io.emit('user:playing', { userId, gameTitle });
    });

    // Отключение
    socket.on('disconnect', () => {
        // Находим userId по socket.id
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit('user:status', { userId, status: 'offline' });
                console.log(`Пользователь ${userId} оффлайн`);
                break;
            }
        }
    });
});

// Сохраняем io в app для использования в контроллерах
app.set('io', io);

// Обработка ошибок 404
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Маршрут не найден',
        path: req.path 
    });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ 
        error: 'Внутренняя ошибка сервера',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Подключение к MongoDB и запуск сервера
const PORT = process.env.PORT || 1488;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uteam';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('[OK] Подключено к MongoDB');
        
        server.listen(PORT, () => {
            console.log('');
            console.log('='.repeat(60));
            console.log('  UTEAM API SERVER');
            console.log('='.repeat(60));
            console.log(`  Сервер запущен на порту: ${PORT}`);
            console.log(`  API: http://localhost:${PORT}/api`);
            console.log('  WebSocket: подключен');
            console.log('  MongoDB: подключена');
            console.log('='.repeat(60));
            console.log('');
        });
    })
    .catch((err) => {
        console.error('[ERROR] Ошибка подключения к MongoDB:', err.message);
        console.log('Убедитесь, что MongoDB запущена или проверьте строку подключения в .env');
        process.exit(1);
    });
