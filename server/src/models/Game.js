/**
 * Модель игры
 * Хранит информацию об играх в магазине
 */

const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    // Основная информация
    title: {
        type: String,
        required: [true, 'Название игры обязательно'],
        trim: true,
        maxlength: [100, 'Название максимум 100 символов']
    },
    description: {
        type: String,
        required: [true, 'Описание обязательно'],
        maxlength: [5000, 'Описание максимум 5000 символов']
    },
    shortDescription: {
        type: String,
        maxlength: [300, 'Краткое описание максимум 300 символов']
    },

    // Разработчик
    developer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    developerName: {
        type: String,
        required: true
    },
    publisherName: {
        type: String,
        default: ''
    },

    // Цена
    price: {
        type: Number,
        default: 0, // 0 = бесплатно
        min: 0
    },
    discount: {
        type: Number,
        default: 0, // процент скидки
        min: 0,
        max: 100
    },
    discountEndDate: {
        type: Date,
        default: null
    },

    // Медиа
    coverImage: {
        type: String, // URL обложки
        required: [true, 'Обложка обязательна']
    },
    bannerImage: {
        type: String, // URL баннера для слайдера
        default: null
    },
    screenshots: [{
        type: String // URL скриншотов
    }],
    trailerUrl: {
        type: String, // YouTube или прямая ссылка
        default: null
    },

    // Файлы игры
    gameType: {
        type: String,
        enum: ['executable'], // только EXE игры
        default: 'executable'
    },
    // ZIP архив с игрой (локальный путь или внешняя ссылка)
    gameArchive: {
        type: String, // путь к ZIP файлу
        required: true
    },
    // Внешняя ссылка для скачивания (Google Drive, Dropbox, etc.)
    // Если указана - используется вместо локального gameArchive
    externalDownloadUrl: {
        type: String,
        default: null
    },
    // Иконка игры (превью)
    gameIcon: {
        type: String, // путь к иконке игры или Base64
        default: null
    },
    gamePath: {
        type: String, // путь к папке игры на сервере
        default: null
    },
    gameSize: {
        type: Number, // размер в байтах
        default: 0
    },
    executablePath: {
        type: String, // путь к EXE файлу внутри архива
        default: 'game.exe'
    },
    // Список файлов в архиве (для модерации)
    gameFiles: [{
        name: String,
        size: Number,
        path: String
    }],

    // Категории и теги
    categories: [{
        type: String,
        enum: [
            'action', 'adventure', 'rpg', 'strategy', 'simulation',
            'sports', 'racing', 'puzzle', 'casual', 'indie',
            'multiplayer', 'singleplayer', 'free', 'card', 'board'
        ]
    }],
    tags: [{
        type: String,
        trim: true
    }],

    // Системные требования
    requirements: {
        minimum: {
            os: { type: String, default: 'Windows 7' },
            processor: { type: String, default: 'Любой' },
            memory: { type: String, default: '1 GB RAM' },
            graphics: { type: String, default: 'Интегрированная' },
            storage: { type: String, default: '100 MB' }
        },
        recommended: {
            os: { type: String, default: 'Windows 10' },
            processor: { type: String, default: 'Любой' },
            memory: { type: String, default: '2 GB RAM' },
            graphics: { type: String, default: 'Интегрированная' },
            storage: { type: String, default: '200 MB' }
        }
    },

    // Статус публикации
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'hidden'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        default: null
    },

    // Статистика
    downloads: {
        type: Number,
        default: 0
    },
    installs: {
        type: Number,
        default: 0
    },
    rating: {
        positive: { type: Number, default: 0 },
        negative: { type: Number, default: 0 }
    },
    totalPlayTime: {
        type: Number, // общее время игры всех пользователей в минутах
        default: 0
    },

    // Флаги
    isFeatured: {
        type: Boolean,
        default: false
    },
    isNewRelease: {
        type: Boolean,
        default: true
    },
    isPopular: {
        type: Boolean,
        default: false
    },

    // Даты
    releaseDate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Индексы
gameSchema.index({ title: 'text', description: 'text' });
gameSchema.index({ status: 1 });
gameSchema.index({ categories: 1 });
gameSchema.index({ price: 1 });
gameSchema.index({ downloads: -1 });
gameSchema.index({ isFeatured: 1 });

// Виртуальное поле: финальная цена
gameSchema.virtual('finalPrice').get(function() {
    if (this.discount > 0) {
        return Math.round(this.price * (1 - this.discount / 100));
    }
    return this.price;
});

// Виртуальное поле: процент положительных отзывов
gameSchema.virtual('positivePercent').get(function() {
    const total = this.rating.positive + this.rating.negative;
    if (total === 0) return 0;
    return Math.round((this.rating.positive / total) * 100);
});

// Обновление updatedAt
gameSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Преобразование для JSON
gameSchema.set('toJSON', { virtuals: true });
gameSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Game', gameSchema);
