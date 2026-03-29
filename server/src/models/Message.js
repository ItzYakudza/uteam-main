/**
 * Модель сообщения чата
 * История сообщений между пользователями
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // Отправитель
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Получатель
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Текст сообщения
    content: {
        type: String,
        required: true,
        maxlength: 1000
    },

    // Прочитано ли
    read: {
        type: Boolean,
        default: false
    },

    // Дата
    createdAt: {
        type: Date,
        default: Date.now
    }
});

messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
