/**
 * Модель библиотеки пользователя
 * Связывает пользователей с их играми
 */

const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
    // Владелец
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Игра
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },

    // Статус установки
    installed: {
        type: Boolean,
        default: false
    },
    installPath: {
        type: String,
        default: null
    },
    executablePath: {
        type: String,
        default: null
    },
    installedAt: {
        type: Date,
        default: null
    },

    // Статистика игрока
    playTime: {
        type: Number, // в минутах
        default: 0
    },
    lastPlayed: {
        type: Date,
        default: null
    },
    timesLaunched: {
        type: Number,
        default: 0
    },

    // Пользовательские настройки
    isFavorite: {
        type: Boolean,
        default: false
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    customCategory: {
        type: String,
        default: null
    },

    // Способ получения
    acquisitionType: {
        type: String,
        enum: ['free', 'purchased', 'gift', 'key'],
        default: 'free'
    },
    purchasePrice: {
        type: Number,
        default: 0
    },

    // Достижения (если будут добавлены)
    achievements: [{
        achievementId: String,
        unlockedAt: Date
    }],

    // Даты
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Уникальный индекс: один пользователь - одна игра
librarySchema.index({ user: 1, game: 1 }, { unique: true });
librarySchema.index({ user: 1, isFavorite: 1 });
librarySchema.index({ user: 1, lastPlayed: -1 });

module.exports = mongoose.model('Library', librarySchema);
