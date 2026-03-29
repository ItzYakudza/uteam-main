/**
 * Модель дружбы
 * Управляет связями между пользователями
 */

const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    // Пользователь, отправивший запрос
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Пользователь, получивший запрос
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Статус дружбы
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'blocked'],
        default: 'pending'
    },

    // Дата создания запроса
    createdAt: {
        type: Date,
        default: Date.now
    },

    // Дата принятия/отклонения
    respondedAt: {
        type: Date,
        default: null
    }
});

// Уникальный индекс
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model('Friend', friendSchema);
