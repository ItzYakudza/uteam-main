/**
 * Скрипт инициализации базы данных
 * Создаёт администратора и начальные игры
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Game = require('../models/Game');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uteam';

// Начальные игры
const initialGames = [
    {
        title: 'Дурак',
        description: `Классическая русская карточная игра "Дурак"!

Правила игры:
- Цель игры - избавиться от всех карт
- Игра ведётся колодой из 36 карт
- Козырная масть определяется в начале игры
- Можно подкидывать карты того же достоинства
- Бить можно картой старше или козырем

Особенности:
- Играйте против умного компьютерного противника
- Классические правила игры
- Приятная графика`,
        shortDescription: 'Классическая русская карточная игра. Играйте против ИИ!',
        categories: ['card', 'casual', 'free', 'singleplayer'],
        tags: ['карты', 'дурак', 'классика', 'русская игра'],
        gameType: 'html',
        executablePath: 'index.html',
        gamePath: '/games/durak',
        coverImage: '/games/durak/cover.png',
        bannerImage: '/games/durak/banner.png',
        screenshots: ['/games/durak/screen1.png', '/games/durak/screen2.png'],
        price: 0,
        isFeatured: true,
        isNewRelease: true,
        status: 'approved',
        requirements: {
            minimum: {
                os: 'Любая с браузером',
                processor: 'Любой',
                memory: '512 MB RAM',
                graphics: 'Интегрированная',
                storage: '10 MB'
            }
        }
    },
    {
        title: 'Косынка',
        description: `Классический пасьянс Косынка (Klondike Solitaire)!

Правила:
- Разложите все карты по мастям от туза до короля
- Перетаскивайте карты между столбцами
- Чередуйте красные и чёрные карты в столбцах
- Открывайте новые карты из колоды

Режимы игры:
- Классический режим
- Режим на время

Подходит для расслабления и тренировки ума!`,
        shortDescription: 'Классический пасьянс для спокойного отдыха',
        categories: ['card', 'puzzle', 'casual', 'free', 'singleplayer'],
        tags: ['пасьянс', 'косынка', 'карты', 'головоломка'],
        gameType: 'html',
        executablePath: 'index.html',
        gamePath: '/games/solitaire',
        coverImage: '/games/solitaire/cover.png',
        bannerImage: '/games/solitaire/banner.png',
        screenshots: ['/games/solitaire/screen1.png'],
        price: 0,
        isFeatured: true,
        isNewRelease: true,
        status: 'approved',
        requirements: {
            minimum: {
                os: 'Любая с браузером',
                processor: 'Любой',
                memory: '512 MB RAM',
                graphics: 'Интегрированная',
                storage: '5 MB'
            }
        }
    },
    {
        title: 'Сапёр',
        description: `Легендарная игра Сапёр (Minesweeper)!

Правила:
- Откройте все клетки, не задев мины
- Числа показывают количество мин рядом
- Правый клик ставит флажок на мину
- Используйте логику для победы

Уровни сложности:
- Новичок: 9x9, 10 мин
- Любитель: 16x16, 40 мин
- Эксперт: 30x16, 99 мин

Тренируйте логическое мышление!`,
        shortDescription: 'Классическая логическая игра. Найдите все мины!',
        categories: ['puzzle', 'casual', 'free', 'singleplayer'],
        tags: ['логика', 'головоломка', 'классика', 'мины'],
        gameType: 'html',
        executablePath: 'index.html',
        gamePath: '/games/minesweeper',
        coverImage: '/games/minesweeper/cover.png',
        bannerImage: '/games/minesweeper/banner.png',
        screenshots: ['/games/minesweeper/screen1.png'],
        price: 0,
        isFeatured: true,
        isNewRelease: true,
        status: 'approved',
        requirements: {
            minimum: {
                os: 'Любая с браузером',
                processor: 'Любой',
                memory: '256 MB RAM',
                graphics: 'Интегрированная',
                storage: '5 MB'
            }
        }
    },
    {
        title: 'Змейка',
        description: `Легендарная аркадная игра Змейка (Snake)!

Управление:
- Стрелки или WASD для движения
- Собирайте еду, чтобы расти
- Не врезайтесь в стены и себя

Особенности:
- Нарастающая сложность
- Таблица рекордов
- Ретро стиль

Сколько очков вы наберёте?`,
        shortDescription: 'Легендарная аркада. Собирайте еду и растите!',
        categories: ['casual', 'free', 'singleplayer', 'indie'],
        tags: ['аркада', 'змейка', 'ретро', 'классика'],
        gameType: 'html',
        executablePath: 'index.html',
        gamePath: '/games/snake',
        coverImage: '/games/snake/cover.png',
        bannerImage: '/games/snake/banner.png',
        screenshots: ['/games/snake/screen1.png'],
        price: 0,
        isFeatured: true,
        isNewRelease: true,
        status: 'approved',
        requirements: {
            minimum: {
                os: 'Любая с браузером',
                processor: 'Любой',
                memory: '256 MB RAM',
                graphics: 'Интегрированная',
                storage: '2 MB'
            }
        }
    },
    {
        title: 'Test Game',
        description: `Тестовая игра для проверки функционала UTEAM.

Это демонстрационная игра, которая позволяет протестировать:
- Загрузку и отображение в магазине
- Добавление в библиотеку
- Систему рейтингов и отзывов

Управление:
- Пробел - действие
- Стрелки - движение`,
        shortDescription: 'Тестовая игра для проверки функционала платформы',
        categories: ['indie', 'casual', 'free', 'singleplayer'],
        tags: ['тест', 'демо', 'пример'],
        gameType: 'html',
        executablePath: 'index.html',
        gamePath: '/games/test-game',
        coverImage: '/uploads/games/default-cover.png',
        bannerImage: '/uploads/games/default-banner.png',
        screenshots: [],
        price: 0,
        isFeatured: true,
        isNewRelease: true,
        status: 'approved',
        requirements: {
            minimum: {
                os: 'Любая с браузером',
                processor: 'Любой',
                memory: '256 MB RAM',
                graphics: 'Интегрированная',
                storage: '1 MB'
            }
        }
    }
];

async function seed() {
    try {
        console.log('[...] Подключение к MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('[OK] Подключено к MongoDB');

        // Поиск существующего пользователя для создания игр
        console.log('\n[...] Поиск пользователя для инициализации игр...');
        let admin = await User.findOne({});
        
        if (!admin) {
            console.log('[WARN] Нет пользователей в базе данных');
            console.log('[INFO] Создайте аккаунт перед запуском инициализации');
        } else {
            console.log(`[OK] Найден пользователь: ${admin.username}`);
        }

        // Создание начальных игр
        console.log('\n[...] Создание начальных игр...');
        
        for (const gameData of initialGames) {
            const existingGame = await Game.findOne({ title: gameData.title });
            
            if (!existingGame) {
                const game = new Game({
                    ...gameData,
                    developer: admin._id,
                    developerName: 'UTEAM',
                    publisherName: 'UTEAM',
                    releaseDate: Date.now()
                });
                await game.save();
                console.log(`[OK] Создана игра: ${game.title}`);
            } else {
                console.log(`[INFO] Игра уже существует: ${gameData.title}`);
            }
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('  ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА');
        console.log('='.repeat(60));
        console.log('');
        console.log('  Администратор: ItzYakudza');
        console.log('');
        console.log('  Создано игр: 4');
        console.log('    - Дурак');
        console.log('    - Косынка');
        console.log('    - Сапёр');
        console.log('    - Змейка');
        console.log('');
        console.log('='.repeat(60));

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('[ERROR] Ошибка инициализации:', error);
        process.exit(1);
    }
}

seed();
