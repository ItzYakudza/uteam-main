const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Library = require('../models/Library');
const Review = require('../models/Review');
const { auth, optionalAuth } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AdmZip = require('adm-zip');

// ============================================
// Railway Volume Storage - все файлы на диске
// Volume примонтирован в /app/uploads
// ============================================

// Базовая директория для uploads
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');

// Функция для создания директории
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

// Storage для всех файлов - на диске (Railway Volume)
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir;
        switch (file.fieldname) {
            case 'gameArchive':
                dir = ensureDir(path.join(UPLOADS_DIR, 'games'));
                break;
            case 'coverImage':
                dir = ensureDir(path.join(UPLOADS_DIR, 'covers'));
                break;
            case 'gameIcon':
                dir = ensureDir(path.join(UPLOADS_DIR, 'icons'));
                break;
            case 'screenshots':
                dir = ensureDir(path.join(UPLOADS_DIR, 'screenshots'));
                break;
            default:
                dir = ensureDir(path.join(UPLOADS_DIR, 'misc'));
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'gameArchive') {
        // Только ZIP файлы
        if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only ZIP archives allowed'), false);
        }
    } else if (file.fieldname === 'gameIcon' || file.fieldname === 'coverImage' || file.fieldname === 'screenshots') {
        // Только изображения
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed'), false);
        }
    } else {
        cb(null, true);
    }
};

const gameUpload = multer({ 
    storage: fileStorage, 
    fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// Функция для очистки файлов при ошибке
function cleanupFiles(files) {
    if (!files) return;
    Object.values(files).forEach(fileArray => {
        fileArray.forEach(file => {
            try {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (err) {
                console.error('Error cleaning file:', err);
            }
        });
    });
}

const isModerator = (req, res, next) => {
    if (!req.user || !['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    next();
};

router.get('/', optionalAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, sort = 'newest', price, featured } = req.query;
        const filter = { status: 'approved' };
        if (category) filter.categories = category;
        if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
        if (price === 'free') filter.price = 0;
        else if (price === 'paid') filter.price = { $gt: 0 };
        if (featured === 'true') filter.isFeatured = true;
        let sortOpt = { releaseDate: -1 };
        if (sort === 'popular') sortOpt = { downloads: -1 };
        else if (sort === 'rating') sortOpt = { 'rating.average': -1 };
        else if (sort === 'name') sortOpt = { title: 1 };
        const games = await Game.find(filter).populate('developer', 'username avatar').sort(sortOpt).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await Game.countDocuments(filter);
        res.json({ games, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/featured', async (req, res) => {
    try {
        // Рекомендуемые игры (isFeatured = true)
        const featured = await Game.find({ status: 'approved', isFeatured: true })
            .populate('developer', 'username')
            .limit(5);
        
        // Новые игры (по дате выхода)
        const newGames = await Game.find({ status: 'approved' })
            .populate('developer', 'username')
            .sort({ releaseDate: -1, createdAt: -1 })
            .limit(10);
        
        // Популярные игры (по скачиваниям)
        const popular = await Game.find({ status: 'approved' })
            .populate('developer', 'username')
            .sort({ downloads: -1 })
            .limit(10);
        
        // Бесплатные игры
        const free = await Game.find({ status: 'approved', price: 0 })
            .populate('developer', 'username')
            .limit(10);
        
        res.json({ 
            featured,
            new: newGames,
            popular,
            free
        });
    } catch (e) { 
        console.error('Error in /featured:', e);
        res.status(500).json({ error: 'Server error' }); 
    }
});

router.get('/categories', async (req, res) => {
    try {
        // Получаем все категории с количеством игр
        const categoryCounts = await Game.aggregate([
            { $match: { status: 'approved' } },
            { $unwind: '$categories' },
            { $group: { _id: '$categories', count: { $sum: 1 } } },
            { $project: { id: '$_id', name: '$_id', count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);
        res.json(categoryCounts);
    } catch (e) {
        console.error('Error in /categories:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/pending', auth, isModerator, async (req, res) => {
    try { res.json({ games: await Game.find({ status: 'pending' }).populate('developer', 'username email').sort({ createdAt: -1 }) }); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('developer', 'username avatar');
        if (!game) return res.status(404).json({ error: 'Not found' });
        let inLibrary = false;
        let isAdmin = false;
        if (req.user) {
            inLibrary = !!(await Library.findOne({ userId: req.user._id, gameId: game._id }));
            // Проверяем админские права
            const adminUsers = (process.env.ADMIN_USERS || 'Admin,ItzYakudza').split(',').map(u => u.trim().toLowerCase());
            isAdmin = req.user.role === 'admin' || adminUsers.includes(req.user.username?.toLowerCase());
        }
        res.json({ game, inLibrary, isAdmin });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/submit', auth, gameUpload.fields([
    { name: 'gameArchive', maxCount: 1 }, 
    { name: 'gameIcon', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }, 
    { name: 'screenshots', maxCount: 10 }
]), async (req, res) => {
    try {
        if (!['developer', 'admin'].includes(req.user.role)) {
            cleanupTempFiles(req.files);
            return res.status(403).json({ error: 'Developer role required' });
        }
        
        const { title, description, shortDescription, categories, tags, price = 0, executablePath = 'game.exe', systemRequirements } = req.body;
        
        if (!title || !description) {
            cleanupFiles(req.files);
            return res.status(400).json({ error: 'Title and description required' });
        }
        
        if (!req.files?.gameArchive?.[0]) {
            cleanupFiles(req.files);
            return res.status(400).json({ error: 'Game archive (ZIP) required' });
        }
        
        if (!req.files?.coverImage?.[0]) {
            cleanupFiles(req.files);
            return res.status(400).json({ error: 'Cover image required' });
        }

        const archiveFile = req.files.gameArchive[0];
        
        // Анализируем ZIP архив для получения списка файлов
        let gameFiles = [];
        try {
            const zip = new AdmZip(archiveFile.path);
            const zipEntries = zip.getEntries();
            gameFiles = zipEntries.map(entry => ({
                name: entry.entryName,
                size: entry.header.size,
                path: entry.entryName,
                isDirectory: entry.isDirectory
            })).filter(f => !f.isDirectory);
        } catch (zipError) {
            cleanupFiles(req.files);
            return res.status(400).json({ error: 'Invalid ZIP archive' });
        }

        // Проверяем наличие EXE файла
        const hasExe = gameFiles.some(f => f.name.toLowerCase().endsWith('.exe'));
        if (!hasExe) {
            cleanupFiles(req.files);
            return res.status(400).json({ error: 'ZIP archive must contain at least one .exe file' });
        }

        // Все файлы сохранены на диск (Railway Volume)
        const gameData = {
            title,
            description,
            shortDescription: shortDescription || description.substring(0, 300),
            developer: req.user._id,
            developerName: req.user.username,
            categories: categories ? JSON.parse(categories) : [],
            tags: tags ? JSON.parse(tags) : [],
            price: parseFloat(price) || 0,
            status: 'pending',
            gameType: 'executable',
            gameArchive: '/uploads/games/' + archiveFile.filename,
            gameSize: archiveFile.size,
            executablePath: executablePath || 'game.exe',
            gameFiles,
            coverImage: '/uploads/covers/' + req.files.coverImage[0].filename,
            requirements: systemRequirements ? JSON.parse(systemRequirements) : undefined
        };
        
        // Иконка игры
        if (req.files?.gameIcon?.[0]) {
            gameData.gameIcon = '/uploads/icons/' + req.files.gameIcon[0].filename;
        }
        
        // Скриншоты
        if (req.files?.screenshots) {
            gameData.screenshots = req.files.screenshots.map(f => '/uploads/screenshots/' + f.filename);
        }
        
        const game = new Game(gameData);
        await game.save();
        
        res.status(201).json({ message: 'Game submitted for review', game });
    } catch (e) {
        console.error('Submit error:', e);
        cleanupFiles(req.files);
        res.status(500).json({ error: 'Server error: ' + e.message });
    }
});

router.put('/:id/approve', auth, isModerator, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ error: 'Not found' });
        game.status = 'approved'; 
        game.releaseDate = new Date(); 
        game.moderatedBy = req.user._id;
        game.isNewRelease = true;
        await game.save();
        res.json({ message: 'Game approved', game });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/reject', auth, isModerator, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ error: 'Not found' });
        game.status = 'rejected'; 
        game.rejectionReason = req.body.reason || 'Game rejected by moderator';
        game.moderatedBy = req.user._id;
        await game.save();
        res.json({ message: 'Game rejected', game });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Delete game (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ error: 'Not found' });
        
        // Delete game files from disk
        const uploadsDir = path.join(__dirname, '../../uploads');
        
        // Delete archive
        if (game.gameArchive) {
            const archivePath = path.join(uploadsDir, game.gameArchive.replace(/^\/uploads\//, ''));
            if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
        }
        
        // Delete icon
        if (game.gameIcon) {
            const iconPath = path.join(uploadsDir, game.gameIcon.replace(/^\/uploads\//, ''));
            if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);
        }
        
        // Delete cover
        if (game.coverImage) {
            const coverPath = path.join(uploadsDir, game.coverImage.replace(/^\/uploads\//, ''));
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        }
        
        // Delete screenshots
        if (game.screenshots && game.screenshots.length > 0) {
            game.screenshots.forEach(ss => {
                const ssPath = path.join(uploadsDir, ss.replace(/^\/uploads\//, ''));
                if (fs.existsSync(ssPath)) fs.unlinkSync(ssPath);
            });
        }
        
        // Remove from all user libraries
        await Library.deleteMany({ gameId: game._id });
        
        // Remove all reviews
        await Review.deleteMany({ gameId: game._id });
        
        // Delete the game document
        await Game.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Game deleted successfully' });
    } catch (e) { 
        console.error('Error deleting game:', e);
        res.status(500).json({ error: 'Server error' }); 
    }
});

// Получить файлы игры для модерации
router.get('/:id/files', auth, isModerator, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ error: 'Not found' });
        res.json({ 
            files: game.gameFiles || [],
            archiveSize: game.gameSize,
            executablePath: game.executablePath
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Скачать игру
router.get('/:id/download', auth, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ error: 'Not found' });
        
        // Проверяем есть ли игра в библиотеке (для платных)
        if (game.price > 0) {
            const inLibrary = await Library.findOne({ userId: req.user._id, gameId: game._id });
            if (!inLibrary) return res.status(403).json({ error: 'Game not in library' });
        }
        
        game.downloads = (game.downloads || 0) + 1;
        await game.save();
        
        // Используем внешнюю ссылку если указана, иначе локальный файл
        const downloadUrl = game.externalDownloadUrl || game.gameArchive;
        
        res.json({ 
            downloadUrl: downloadUrl, 
            fileSize: game.gameSize, 
            title: game.title,
            executablePath: game.executablePath,
            gameIcon: game.gameIcon
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Отзывы
router.post('/:id/review', auth, async (req, res) => {
    try {
        const { rating, content, recommended } = req.body;
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ error: 'Not found' });
        if (await Review.findOne({ userId: req.user._id, gameId: game._id })) {
            return res.status(400).json({ error: 'Already reviewed' });
        }
        const review = new Review({ 
            userId: req.user._id, 
            gameId: game._id, 
            rating, 
            content, 
            recommended: recommended !== false 
        });
        await review.save();
        
        // Обновляем рейтинг игры
        if (recommended !== false) {
            game.rating.positive += 1;
        } else {
            game.rating.negative += 1;
        }
        await game.save();
        
        res.status(201).json({ message: 'Review added', review });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ gameId: req.params.id })
            .populate('userId', 'username avatar')
            .sort({ createdAt: -1 });
        res.json({ reviews });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;