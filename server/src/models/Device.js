/**
 * Модель авторизованного устройства
 * Хранит информацию о устройствах пользователя
 */

const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Уникальный ID устройства
    deviceId: {
        type: String,
        required: true
    },
    
    // JWT токен для этого устройства
    token: {
        type: String,
        default: null
    },
    
    // Информация об устройстве
    deviceName: {
        type: String,
        default: 'Unknown Device'
    },
    platform: {
        type: String,
        default: 'unknown'
    },
    browser: {
        type: String,
        default: 'unknown'
    },
    
    // IP адрес
    ip: {
        type: String,
        default: ''
    },
    
    // Статус
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Временные метки
    lastUsed: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Индексы
deviceSchema.index({ userId: 1 });
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ lastUsed: -1 });

module.exports = mongoose.model('Device', deviceSchema);
