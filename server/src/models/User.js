/**
 * Модель пользователя
 * Хранит информацию о пользователях платформы
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Основная информация
    username: {
        type: String,
        required: [true, 'Имя пользователя обязательно'],
        unique: true,
        trim: true,
        minlength: [3, 'Имя пользователя минимум 3 символа'],
        maxlength: [30, 'Имя пользователя максимум 30 символов']
    },
    // Уникальный UTEAM ID (формат: #XXXXXXX)
    uteamId: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: [true, 'Email обязателен'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Пароль обязателен'],
        minlength: [6, 'Пароль минимум 6 символов'],
        select: false // Не возвращать пароль по умолчанию
    },

    // Профиль
    avatar: {
        type: String,
        default: '/uploads/avatars/default.png'
    },
    profileBackground: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: [500, 'Биография максимум 500 символов'],
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    realName: {
        type: String,
        default: ''
    },
    customUrl: {
        type: String,
        default: '',
        maxlength: [30, 'URL максимум 30 символов']
    },

    // Система уровней
    level: {
        type: Number,
        default: 1
    },
    xp: {
        type: Number,
        default: 0
    },
    // XP начисляется за:
    // - Добавление игры в библиотеку: 10 XP
    // - 1 час игры: 5 XP
    // - Оставление отзыва: 20 XP
    // - Добавление друга: 15 XP

    // Статистика
    totalPlayTime: {
        type: Number, // в минутах
        default: 0
    },
    gamesOwned: {
        type: Number,
        default: 0
    },
    reviewsCount: {
        type: Number,
        default: 0
    },

    // Статус
    status: {
        type: String,
        enum: ['online', 'offline', 'away', 'busy', 'invisible'],
        default: 'offline'
    },
    currentGame: {
        type: String,
        default: null
    },
    lastOnline: {
        type: Date,
        default: Date.now
    },

    // Роль пользователя
    role: {
        type: String,
        enum: ['user', 'developer', 'moderator', 'admin'],
        default: 'user'
    },

    // Витрина профиля (избранные игры)
    featuredGames: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    }],

    // Настройки приватности
    privacy: {
        profileVisible: { type: Boolean, default: true }, // Открытый/закрытый профиль
        showPlayTime: { type: Boolean, default: true },
        showGames: { type: Boolean, default: true },
        showFriends: { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true } // Показывать статус онлайн
    },
    
    // Выбранный статус отображения (online/offline/invisible)
    displayStatus: {
        type: String,
        enum: ['online', 'offline', 'invisible'],
        default: 'online'
    },

    // Временные метки
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Индексы для быстрого поиска (username и email уже имеют индекс через unique)
userSchema.index({ level: -1 });

// Хэширование пароля перед сохранением
userSchema.pre('save', async function(next) {
    // Хэшируем только если пароль был изменён
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Обновление updatedAt перед сохранением
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Метод сравнения паролей
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Метод добавления XP и проверки уровня
userSchema.methods.addXP = function(amount) {
    this.xp += amount;
    // Формула уровня: level = floor(sqrt(xp / 100)) + 1
    const newLevel = Math.floor(Math.sqrt(this.xp / 100)) + 1;
    if (newLevel > this.level) {
        this.level = newLevel;
        return true; // Уровень повысился
    }
    return false;
};

// Виртуальное поле: XP до следующего уровня
userSchema.virtual('xpToNextLevel').get(function() {
    const nextLevel = this.level + 1;
    const xpRequired = Math.pow(nextLevel - 1, 2) * 100;
    return xpRequired - this.xp;
});

// Преобразование в JSON (убираем пароль)
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);
