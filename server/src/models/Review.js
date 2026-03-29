/**
 * Модель отзыва
 * Отзывы пользователей на игры
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // Автор отзыва
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

    // Рекомендация (положительный/отрицательный)
    recommended: {
        type: Boolean,
        required: true
    },

    // Текст отзыва
    content: {
        type: String,
        required: [true, 'Текст отзыва обязателен'],
        minlength: [10, 'Минимум 10 символов'],
        maxlength: [2000, 'Максимум 2000 символов']
    },

    // Время игры на момент отзыва
    playTimeAtReview: {
        type: Number, // в минутах
        default: 0
    },

    // Полезность отзыва
    helpful: {
        yes: { type: Number, default: 0 },
        no: { type: Number, default: 0 }
    },

    // Пользователи, оценившие отзыв
    helpfulVotes: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        vote: { type: Boolean } // true = полезно, false = не полезно
    }],

    // Даты
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Один отзыв на игру от пользователя
reviewSchema.index({ user: 1, game: 1 }, { unique: true });
reviewSchema.index({ game: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
