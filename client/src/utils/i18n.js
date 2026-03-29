/**
 * Internationalization System
 * UTEAM Localization - EN/RU
 */

const translations = {
    en: {
        // Navigation
        nav: {
            store: 'Store',
            library: 'Library',
            friends: 'Friends',
            profile: 'Profile',
            settings: 'Settings',
            moderation: 'MODERATION'
        },
        
        // Settings
        settings: {
            title: 'Settings',
            account: 'Account',
            security: 'Security',
            application: 'Application',
            downloads: 'Downloads',
            about: 'About',
            language: 'Language',
            
            // Account section
            accountSettings: 'Account Settings',
            username: 'Username',
            usernameHint: 'Username cannot be changed',
            email: 'Email',
            realName: 'Real Name (optional)',
            country: 'Country',
            bio: 'Bio',
            save: 'Save',
            saving: 'Saving...',
            saved: 'Settings saved!',
            errorSaving: 'Error saving settings',
            
            // Security section
            changePassword: 'Change Password',
            currentPassword: 'Current Password',
            newPassword: 'New Password',
            confirmPassword: 'Confirm Password',
            changePasswordBtn: 'Change Password',
            changing: 'Changing...',
            passwordChanged: 'Password changed!',
            passwordsDontMatch: 'Passwords do not match',
            passwordTooShort: 'Password must be at least 6 characters',
            errorChangingPassword: 'Error changing password',
            
            // Devices
            devices: 'Authorized Devices',
            devicesDescription: 'Devices where you are logged in',
            thisDevice: 'This device',
            disconnect: 'Disconnect',
            disconnectAll: 'Disconnect All Devices',
            deviceDisconnected: 'Device disconnected',
            allDevicesDisconnected: 'All devices disconnected',
            
            // Application section
            appSettings: 'Application Settings',
            minimizeToTray: 'Minimize to Tray',
            minimizeToTrayDesc: 'Hide to system tray when closing window',
            autoStart: 'Start with Windows',
            autoStartDesc: 'Launch UTEAM when Windows starts',
            startupPage: 'Startup Page',
            startupPageDesc: 'Page to open when application starts',
            
            // About section
            version: 'Version',
            aboutDescription: 'UTEAM is a game platform for sharing and playing games created by the community.',
            allRightsReserved: 'All rights reserved.',
            license: 'License Agreement',
            licenseText1: 'All user accounts created on the UTEAM platform are the exclusive property of UTEAM.',
            licenseText2: 'By creating an account, you acknowledge that your account is licensed to you for personal use only. UTEAM reserves the right to suspend or terminate any account at its discretion.',
            licenseText3: 'Your account and all associated data remain the property of UTEAM and are provided to you under a limited, non-transferable license.',
            
            // Language section
            selectLanguage: 'Select Language',
            languageChanged: 'Language changed',
            
            // Delete Account
            dangerZone: 'Danger Zone',
            deleteAccount: 'Delete Account',
            deleteAccountDesc: 'Permanently delete your account and all data',
            deleteAccountTitle: 'Delete Account',
            deleteAccountWarning: 'This action cannot be undone. All your data, games, and progress will be permanently deleted.',
            enterPasswordToDelete: 'Enter your password to confirm deletion',
            deleting: 'Deleting...',
            confirmDelete: 'Delete Account',
            deleteError: 'Error deleting account',
            
            // Privacy section
            privacy: 'Privacy',
            privacySettings: 'Privacy Settings',
            displayStatus: 'Display Status',
            profileVisibility: 'Profile Visibility',
            publicProfile: 'Public',
            publicProfileDesc: 'Anyone can view your profile',
            privateProfile: 'Private',
            privateProfileDesc: 'Only friends can view your profile',
            showPlayTime: 'Show Play Time',
            showGames: 'Show Games',
            showFriends: 'Show Friends List',
            change: 'Change',
            changeEmail: 'Change Email',
            newEmail: 'New Email',
            usernameCannotChange: 'Username cannot be changed',
            
            // Notifications section
            notifications: 'Notifications',
            notificationSettings: 'Notification Settings',
            enableNotifications: 'Enable Notifications',
            enableNotificationsDesc: 'Receive desktop notifications',
            
            // Interface section
            interface: 'Interface',
            interfaceSettings: 'Interface Settings',
            startup: 'Startup',
            startWithWindows: 'Start with Windows',
            startWithWindowsDesc: 'Launch when Windows starts',
            minimizeToTrayDesc: 'Keep running in system tray',
            updates: 'Updates',
            autoUpdate: 'Auto Update',
            autoUpdateDesc: 'Automatically install updates',
            
            // Additional keys for Settings
            accountDesc: 'Manage your information',
            shareForFriends: 'Share to add friends',
            copied: 'Copied!',
            copy: 'Copy',
            hide: 'Hide',
            show: 'Show',
            personalData: 'Personal Data',
            realNamePlaceholder: 'Your name (optional)',
            bioPlaceholder: 'Tell about yourself...',
            privacyDesc: 'Manage visibility of your information',
            onlineStatus: 'Online Status',
            showPlayTimeDesc: 'Display play time in games',
            showGamesDesc: 'Display library',
            showFriendsDesc: 'Display friends list',
            securityDesc: 'Manage password and devices',
            devicesCount: 'devices',
            loading: 'Loading...',
            noDevices: 'No devices',
            unknown: 'Unknown',
            notificationsDesc: 'Notification settings',
            downloadsDesc: 'Manage download settings',
            downloadFolder: 'Download Folder',
            browse: 'Browse',
            open: 'Open',
            bandwidth: 'Bandwidth',
            limitSpeed: 'Limit Speed',
            limitSpeedDesc: 'Limit download speed',
            maxSpeed: 'Max Speed (MB/s)',
            storage: 'Storage',
            clearCache: 'Clear Cache',
            cacheCleared: 'Cache cleared',
            interfaceDesc: 'Appearance settings',
            cancel: 'Cancel',
            password: 'Password',
            fillAllFields: 'Fill all fields',
            emailChanged: 'Email changed',
            passwordRequired: 'Password required'
        },
        
        // Status
        status: {
            online: 'Online',
            offline: 'Appear Offline',
            invisible: 'Invisible',
            away: 'Away'
        },
        
        // Library
        library: {
            title: 'Library',
            games: 'Games',
            installed: 'Installed',
            playTime: 'Play Time',
            all: 'All Games',
            favorites: 'Favorites',
            byName: 'By Name',
            recentlyPlayed: 'Recently Played',
            byPlayTime: 'By Play Time',
            grid: 'Grid',
            list: 'List',
            emptyLibrary: 'Your library is empty',
            addGames: 'Add games from the store',
            browseStore: 'Browse Store',
            install: 'Install',
            play: 'Play',
            running: 'Running',
            uninstall: 'Uninstall',
            downloading: 'Downloading...',
            installing: 'Installing...',
            remove: 'Remove from Library',
            openFolder: 'Open Folder',
            verifyFiles: 'Verify Files',
            confirmUninstall: 'Uninstall {title}?',
            confirmRemove: 'Remove {title} from library?',
            categories: 'Categories',
            allCategories: 'All Categories',
            search: 'Search library...',
            nothingFound: 'Nothing found',
            notInstalled: 'Not installed',
            properties: 'Properties',
            version: 'Version',
            size: 'Size',
            installDate: 'Install Date',
            lastPlayed: 'Last Played',
            never: 'Never',
            about: 'About',
            added: 'Added',
            genre: 'Genre',
            developer: 'Developer',
            notSpecified: 'Not specified',
            unknown: 'Unknown',
            selectGame: 'Select a game',
            selectGameDesc: 'Choose a game from the list to view details',
            gameNotAvailable: 'Game data not available',
            lastPlayedShort: 'Last',
            notPlayed: 'Not played',
            hours: 'h',
            minutes: 'm'
        },
        
        // Store
        store: {
            title: 'Store',
            featured: 'Featured',
            newReleases: 'New Releases',
            popular: 'Popular',
            free: 'Free to Play',
            search: 'Search games...',
            addToLibrary: 'Add to Library',
            inLibrary: 'In Library',
            price: 'Price',
            free_label: 'Free'
        },
        
        // Friends
        friends: {
            title: 'Friends',
            online: 'Online',
            offline: 'Offline',
            addFriend: 'Add Friend',
            sendMessage: 'Send Message',
            removeFriend: 'Remove Friend',
            friendRequests: 'Friend Requests',
            accept: 'Accept',
            decline: 'Decline',
            noFriends: 'No friends yet',
            friendsCount: 'friends',
            searchPlaceholder: 'Find a friend by name...',
            level: 'Level',
            alreadyFriend: 'Already a friend',
            requestSent: 'Request sent',
            allFriends: 'All friends',
            requests: 'Requests',
            findFriends: 'Find friends using the search above',
            noOnline: 'No friends online',
            noRequests: 'No incoming requests',
            statusOnline: 'Online',
            statusOffline: 'Offline',
            playing: 'Playing',
            viewProfile: 'View Profile',
            enterUteamId: 'Enter UTEAM ID (#XXXXXXX)',
            addByCode: 'Add'
        },
        
        // Profile
        profile: {
            title: 'Profile',
            level: 'Level',
            gamesOwned: 'Games Owned',
            achievements: 'Achievements',
            editProfile: 'Edit Profile',
            recentActivity: 'Recent Activity',
            uteamId: 'UTEAM ID',
            copyId: 'Copy ID',
            idCopied: 'ID copied!'
        },
        
        // Auth
        auth: {
            login: 'Login',
            register: 'Register',
            logout: 'Logout',
            username: 'Username',
            email: 'Email',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            rememberMe: 'Remember me',
            forgotPassword: 'Forgot password?',
            noAccount: "Don't have an account?",
            haveAccount: 'Already have an account?',
            loginError: 'Invalid login or password',
            registerError: 'Registration error'
        },
        
        // SubmitGame
        submit: {
            title: 'Submit Your Game',
            subtitle: 'Share your game with the UTEAM community',
            devRequired: 'Developer Access Required',
            devRequiredDesc: 'You need developer privileges to submit games.',
            contactAdmin: 'Contact admin to get developer role.',
            step1: 'Info',
            step2: 'Categories',
            step3: 'System Req',
            step4: 'Files',
            step5: 'Review',
            basicInfo: 'Basic Information',
            gameTitle: 'Game Title',
            gameTitlePlaceholder: 'Enter game title',
            shortDesc: 'Short Description',
            shortDescPlaceholder: 'Brief description for store card (up to 150 chars)',
            fullDesc: 'Full Description',
            fullDescPlaceholder: 'Describe your game in detail',
            price: 'Price ($)',
            pricePlaceholder: '0 = Free',
            execPath: 'Executable Path',
            execPathHint: 'Path to .exe file inside the ZIP archive',
            tags: 'Tags (comma separated)',
            tagsPlaceholder: 'e.g., 2D, pixel art, retro',
            categories: 'Categories',
            selectCategories: 'Select categories (multiple allowed)',
            systemReq: 'System Requirements',
            minimum: 'Minimum',
            recommended: 'Recommended',
            os: 'OS',
            processor: 'Processor',
            memory: 'Memory',
            graphics: 'Graphics',
            storage: 'Storage',
            files: 'Game Files',
            gameArchive: 'Game Archive (ZIP)',
            gameArchiveHint: 'Upload a ZIP archive containing your game. Must include at least one .exe file.',
            selectArchive: 'Select ZIP archive (max 500MB)',
            coverImage: 'Cover Image',
            coverImageHint: 'Main image for store page (recommended: 460x215)',
            selectCover: 'Select cover image',
            gameIcon: 'Game Icon (optional)',
            gameIconHint: 'Small icon for library (recommended: 64x64)',
            selectIcon: 'Select game icon (optional)',
            screenshots: 'Screenshots (up to 5)',
            selectScreenshots: 'Select screenshots',
            screenshotsSelected: 'screenshots selected',
            review: 'Review Your Submission',
            reviewBasicInfo: 'Basic Info',
            reviewCategories: 'Categories',
            reviewSystemReq: 'System Requirements',
            reviewFiles: 'Files',
            reviewNotice: 'Your game will be reviewed by moderators before being published.',
            back: 'Back',
            next: 'Next',
            submitGame: 'Submit Game',
            uploading: 'Uploading...',
            submitted: 'Game submitted for review! You will be notified when it is approved.',
            errorTitle: 'Please fill in title and description',
            errorCategories: 'Please select at least one category',
            errorFiles: 'Please upload game archive and cover image',
            errorArchive: 'Please upload game archive (ZIP)',
            errorCover: 'Please upload cover image',
            errorZipOnly: 'Only ZIP archives are allowed',
            free: 'Free',
            noneSelected: 'None selected',
            notSpecified: 'Not specified',
            uploaded: 'Uploaded',
            notUploaded: 'Not uploaded',
            filesCount: 'files',
            required: 'Required'
        },
        
        // Moderation
        moderation: {
            title: 'Moderation',
            pendingGames: 'Pending Games',
            noGames: 'No games pending review',
            gameInfo: 'Game Information',
            developer: 'Developer',
            submittedAt: 'Submitted',
            price: 'Price',
            free: 'Free',
            categories: 'Categories',
            description: 'Description',
            systemReq: 'System Requirements',
            minimum: 'Minimum',
            recommended: 'Recommended',
            files: 'Files',
            fileCount: 'files',
            totalSize: 'Total Size',
            expandAll: 'Expand All',
            collapseAll: 'Collapse All',
            suspiciousFiles: 'Suspicious Files',
            noneFound: 'None found',
            screenshots: 'Screenshots',
            approve: 'Approve',
            reject: 'Reject',
            approveTitle: 'Approve Game',
            approveMessage: 'Are you sure you want to approve this game?',
            rejectTitle: 'Reject Game',
            rejectReason: 'Rejection Reason',
            rejectReasonPlaceholder: 'Enter reason for rejection...',
            gameApproved: 'Game Approved!',
            gameRejected: 'Game Rejected',
            accessDenied: 'Access Denied',
            adminOnly: 'Only admins and moderators can access this page'
        },
        
        // Profile
        profilePage: {
            editProfile: 'Edit Profile',
            statistics: 'Statistics',
            games: 'Games',
            hoursPlayed: 'hours played',
            achievements: 'Achievements',
            memberSince: 'Member Since',
            information: 'Information',
            country: 'Country'
        },
        
        // Game Page
        gamePage: {
            notFound: 'Game not found',
            developer: 'Developer',
            about: 'About This Game',
            requirements: 'System Requirements',
            minimum: 'Minimum',
            os: 'OS',
            processor: 'Processor',
            memory: 'Memory',
            graphics: 'Graphics',
            storage: 'Storage',
            reviews: 'Reviews',
            noReviews: 'No reviews yet',
            level: 'Level',
            recommended: 'Recommended',
            notRecommended: 'Not Recommended',
            releaseDate: 'Release Date',
            downloads: 'Downloads',
            rating: 'Rating',
            positive: 'positive',
            similarGames: 'Similar Games',
            addError: 'Error adding to library',
            buy: 'Buy'
        },
        
        // Common
        common: {
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            cancel: 'Cancel',
            confirm: 'Confirm',
            save: 'Save',
            delete: 'Delete',
            edit: 'Edit',
            close: 'Close',
            search: 'Search',
            yes: 'Yes',
            no: 'No',
            add: 'PUBLISH',
            unknown: 'Unknown',
            copy: 'Copy'
        }
    },
    
    ru: {
        // Navigation
        nav: {
            store: 'Магазин',
            library: 'Библиотека',
            friends: 'Друзья',
            profile: 'Профиль',
            settings: 'Настройки',
            moderation: 'МОДЕРАЦИЯ'
        },
        
        // Settings
        settings: {
            title: 'Настройки',
            account: 'Аккаунт',
            security: 'Безопасность',
            application: 'Приложение',
            downloads: 'Загрузки',
            about: 'О программе',
            language: 'Язык',
            
            // Account section
            accountSettings: 'Настройки аккаунта',
            username: 'Имя пользователя',
            usernameHint: 'Имя пользователя нельзя изменить',
            email: 'Email',
            realName: 'Настоящее имя (не обязательно)',
            country: 'Страна',
            bio: 'О себе',
            save: 'Сохранить',
            saving: 'Сохранение...',
            saved: 'Настройки сохранены!',
            errorSaving: 'Ошибка сохранения',
            
            // Security section
            changePassword: 'Изменить пароль',
            currentPassword: 'Текущий пароль',
            newPassword: 'Новый пароль',
            confirmPassword: 'Подтвердите пароль',
            changePasswordBtn: 'Изменить пароль',
            changing: 'Изменение...',
            passwordChanged: 'Пароль изменён!',
            passwordsDontMatch: 'Пароли не совпадают',
            passwordTooShort: 'Пароль минимум 6 символов',
            errorChangingPassword: 'Ошибка изменения пароля',
            
            // Devices
            devices: 'Авторизованные устройства',
            devicesDescription: 'Устройства, где выполнен вход',
            thisDevice: 'Это устройство',
            disconnect: 'Отключить',
            disconnectAll: 'Отключить все устройства',
            deviceDisconnected: 'Устройство отключено',
            allDevicesDisconnected: 'Все устройства отключены',
            
            // Application section
            appSettings: 'Настройки приложения',
            minimizeToTray: 'Сворачивать в трей',
            minimizeToTrayDesc: 'Скрывать в системный трей при закрытии окна',
            autoStart: 'Запускать с Windows',
            autoStartDesc: 'Запускать UTEAM при старте Windows',
            startupPage: 'Страница запуска',
            startupPageDesc: 'Страница, открываемая при запуске приложения',
            
            // About section
            version: 'Версия',
            aboutDescription: 'UTEAM — это игровая платформа для распространения и игры в игры, созданные сообществом.',
            allRightsReserved: 'Все права защищены.',
            license: 'Лицензионное соглашение',
            licenseText1: 'Все учётные записи, созданные на платформе UTEAM, являются исключительной собственностью UTEAM.',
            licenseText2: 'Создавая учётную запись, вы подтверждаете, что ваш аккаунт предоставляется вам в аренду только для личного использования. UTEAM оставляет за собой право приостановить или удалить любой аккаунт по своему усмотрению.',
            licenseText3: 'Ваш аккаунт и все связанные данные остаются собственностью UTEAM и предоставляются вам по ограниченной, непередаваемой лицензии.',
            
            // Language section
            selectLanguage: 'Выберите язык',
            languageChanged: 'Язык изменён',
            
            // Delete Account
            dangerZone: 'Опасная зона',
            deleteAccount: 'Удалить аккаунт',
            deleteAccountDesc: 'Безвозвратно удалить аккаунт и все данные',
            deleteAccountTitle: 'Удаление аккаунта',
            deleteAccountWarning: 'Это действие нельзя отменить. Все ваши данные, игры и прогресс будут безвозвратно удалены.',
            enterPasswordToDelete: 'Введите пароль для подтверждения удаления',
            deleting: 'Удаление...',
            confirmDelete: 'Удалить аккаунт',
            deleteError: 'Ошибка удаления аккаунта',
            
            // Privacy section
            privacy: 'Приватность',
            privacySettings: 'Настройки приватности',
            displayStatus: 'Отображаемый статус',
            profileVisibility: 'Видимость профиля',
            publicProfile: 'Публичный',
            publicProfileDesc: 'Любой может видеть ваш профиль',
            privateProfile: 'Приватный',
            privateProfileDesc: 'Только друзья могут видеть ваш профиль',
            showPlayTime: 'Показывать время в игре',
            showGames: 'Показывать игры',
            showFriends: 'Показывать список друзей',
            change: 'Изменить',
            changeEmail: 'Изменить email',
            newEmail: 'Новый email',
            usernameCannotChange: 'Имя пользователя нельзя изменить',
            
            // Notifications section
            notifications: 'Уведомления',
            notificationSettings: 'Настройки уведомлений',
            enableNotifications: 'Включить уведомления',
            enableNotificationsDesc: 'Получать уведомления на рабочем столе',
            
            // Interface section
            interface: 'Интерфейс',
            interfaceSettings: 'Настройки интерфейса',
            startup: 'Запуск',
            startWithWindows: 'Запускать с Windows',
            startWithWindowsDesc: 'Запускать при старте Windows',
            minimizeToTrayDesc: 'Сворачивать в системный трей',
            updates: 'Обновления',
            autoUpdate: 'Автообновление',
            autoUpdateDesc: 'Автоматически устанавливать обновления',
            
            // Additional keys for Settings
            accountDesc: 'Управление вашей информацией',
            shareForFriends: 'Поделитесь для добавления в друзья',
            copied: 'Скопировано!',
            copy: 'Копировать',
            hide: 'Скрыть',
            show: 'Показать',
            personalData: 'Личные данные',
            realNamePlaceholder: 'Ваше имя (необязательно)',
            bioPlaceholder: 'Расскажите о себе...',
            privacyDesc: 'Управление видимостью вашей информации',
            onlineStatus: 'Статус онлайн',
            showPlayTimeDesc: 'Отображать время в играх',
            showGamesDesc: 'Отображать библиотеку',
            showFriendsDesc: 'Отображать список друзей',
            securityDesc: 'Управление паролем и устройствами',
            devicesCount: 'устройств',
            loading: 'Загрузка...',
            noDevices: 'Нет устройств',
            unknown: 'Неизвестно',
            notificationsDesc: 'Настройка уведомлений',
            downloadsDesc: 'Управление настройками загрузки',
            downloadFolder: 'Папка загрузки',
            browse: 'Обзор',
            open: 'Открыть',
            bandwidth: 'Пропускная способность',
            limitSpeed: 'Ограничить скорость',
            limitSpeedDesc: 'Ограничить скорость загрузки',
            maxSpeed: 'Макс. скорость (МБ/с)',
            storage: 'Хранилище',
            clearCache: 'Очистить кэш',
            cacheCleared: 'Кэш очищен',
            interfaceDesc: 'Настройка внешнего вида',
            cancel: 'Отмена',
            password: 'Пароль',
            fillAllFields: 'Заполните все поля',
            emailChanged: 'Email изменён',
            passwordRequired: 'Требуется пароль'
        },
        
        // Status
        status: {
            online: 'В сети',
            offline: 'Не в сети',
            invisible: 'Невидимый',
            away: 'Отошёл'
        },
        
        // Library
        library: {
            title: 'Библиотека',
            games: 'Игры',
            installed: 'Установлено',
            playTime: 'Время игры',
            all: 'Все игры',
            favorites: 'Избранное',
            byName: 'По имени',
            recentlyPlayed: 'Недавно запущенные',
            byPlayTime: 'По времени игры',
            grid: 'Сетка',
            list: 'Список',
            emptyLibrary: 'Ваша библиотека пуста',
            addGames: 'Добавьте игры из магазина',
            browseStore: 'Открыть магазин',
            install: 'Установить',
            play: 'Играть',
            running: 'Запущено',
            uninstall: 'Удалить',
            downloading: 'Загрузка...',
            installing: 'Установка...',
            remove: 'Удалить из библиотеки',
            openFolder: 'Открыть папку',
            verifyFiles: 'Проверить файлы',
            confirmUninstall: 'Удалить {title}?',
            confirmRemove: 'Удалить {title} из библиотеки?',
            categories: 'Категории',
            allCategories: 'Все категории',
            search: 'Поиск в библиотеке...',
            nothingFound: 'Ничего не найдено',
            notInstalled: 'Не установлено',
            properties: 'Свойства',
            version: 'Версия',
            size: 'Размер',
            installDate: 'Дата установки',
            lastPlayed: 'Последний запуск',
            never: 'Никогда',
            about: 'Описание',
            added: 'Добавлено',
            genre: 'Жанр',
            developer: 'Разработчик',
            notSpecified: 'Не указано',
            unknown: 'Неизвестно',
            selectGame: 'Выберите игру',
            selectGameDesc: 'Выберите игру из списка для просмотра подробностей',
            gameNotAvailable: 'Данные игры недоступны',
            lastPlayedShort: 'Последний раз',
            notPlayed: 'Не запускалось',
            hours: 'ч',
            minutes: 'м'
        },
        
        // Store
        store: {
            title: 'Магазин',
            featured: 'Рекомендуемые',
            newReleases: 'Новинки',
            popular: 'Популярные',
            free: 'Бесплатные',
            search: 'Поиск игр...',
            addToLibrary: 'В библиотеку',
            inLibrary: 'В библиотеке',
            price: 'Цена',
            free_label: 'Бесплатно'
        },
        
        // Friends
        friends: {
            title: 'Друзья',
            online: 'В сети',
            offline: 'Не в сети',
            addFriend: 'Добавить',
            sendMessage: 'Написать',
            removeFriend: 'Удалить из друзей',
            friendRequests: 'Заявки в друзья',
            accept: 'Принять',
            decline: 'Отклонить',
            noFriends: 'Пока нет друзей',
            friendsCount: 'друзей',
            searchPlaceholder: 'Найти друга по имени...',
            level: 'Уровень',
            alreadyFriend: 'Уже друг',
            requestSent: 'Запрос отправлен',
            allFriends: 'Все друзья',
            requests: 'Запросы',
            findFriends: 'Найдите друзей через поиск выше',
            noOnline: 'Нет друзей в сети',
            noRequests: 'Нет входящих запросов',
            statusOnline: 'В сети',
            statusOffline: 'Не в сети',
            playing: 'Играет в',
            viewProfile: 'Профиль',
            enterUteamId: 'Введите UTEAM ID (#XXXXXXX)',
            addByCode: 'Добавить'
        },
        
        // Profile
        profile: {
            title: 'Профиль',
            level: 'Уровень',
            gamesOwned: 'Игр в библиотеке',
            achievements: 'Достижения',
            editProfile: 'Редактировать профиль',
            recentActivity: 'Недавняя активность',
            uteamId: 'UTEAM ID',
            copyId: 'Копировать ID',
            idCopied: 'ID скопирован!'
        },
        
        // Auth
        auth: {
            login: 'Войти',
            register: 'Регистрация',
            logout: 'Выйти',
            username: 'Имя пользователя',
            email: 'Email',
            password: 'Пароль',
            confirmPassword: 'Подтвердите пароль',
            rememberMe: 'Запомнить меня',
            forgotPassword: 'Забыли пароль?',
            noAccount: 'Нет аккаунта?',
            haveAccount: 'Уже есть аккаунт?',
            loginError: 'Неверный логин или пароль',
            registerError: 'Ошибка регистрации'
        },
        
        // SubmitGame
        submit: {
            title: 'Опубликовать игру',
            subtitle: 'Поделитесь своей игрой с сообществом UTEAM',
            devRequired: 'Требуется доступ разработчика',
            devRequiredDesc: 'Вам нужны права разработчика для публикации игр.',
            contactAdmin: 'Свяжитесь с администратором для получения роли разработчика.',
            step1: 'Инфо',
            step2: 'Категории',
            step3: 'Сист. треб.',
            step4: 'Файлы',
            step5: 'Обзор',
            basicInfo: 'Основная информация',
            gameTitle: 'Название игры',
            gameTitlePlaceholder: 'Введите название игры',
            shortDesc: 'Краткое описание',
            shortDescPlaceholder: 'Краткое описание для карточки магазина (до 150 символов)',
            fullDesc: 'Полное описание',
            fullDescPlaceholder: 'Опишите вашу игру подробно',
            price: 'Цена ($)',
            pricePlaceholder: '0 = Бесплатно',
            execPath: 'Путь к исполняемому файлу',
            execPathHint: 'Путь к .exe файлу внутри ZIP архива',
            tags: 'Теги (через запятую)',
            tagsPlaceholder: 'напр., 2D, пиксельная графика, ретро',
            categories: 'Категории',
            selectCategories: 'Выберите категории (можно несколько)',
            systemReq: 'Системные требования',
            minimum: 'Минимальные',
            recommended: 'Рекомендуемые',
            os: 'ОС',
            processor: 'Процессор',
            memory: 'Память',
            graphics: 'Видеокарта',
            storage: 'Место на диске',
            files: 'Файлы игры',
            gameArchive: 'Архив игры (ZIP)',
            gameArchiveHint: 'Загрузите ZIP архив с вашей игрой. Должен содержать хотя бы один .exe файл.',
            selectArchive: 'Выберите ZIP архив (макс. 500МБ)',
            coverImage: 'Обложка',
            coverImageHint: 'Главное изображение для страницы магазина (рекомендуется: 460x215)',
            selectCover: 'Выберите обложку',
            gameIcon: 'Иконка игры (необязательно)',
            gameIconHint: 'Маленькая иконка для библиотеки (рекомендуется: 64x64)',
            selectIcon: 'Выберите иконку (необязательно)',
            screenshots: 'Скриншоты (до 5)',
            selectScreenshots: 'Выберите скриншоты',
            screenshotsSelected: 'скриншотов выбрано',
            review: 'Проверьте данные',
            reviewBasicInfo: 'Основная информация',
            reviewCategories: 'Категории',
            reviewSystemReq: 'Системные требования',
            reviewFiles: 'Файлы',
            reviewNotice: 'Ваша игра будет проверена модераторами перед публикацией.',
            back: 'Назад',
            next: 'Далее',
            submitGame: 'Опубликовать',
            uploading: 'Загрузка...',
            submitted: 'Игра отправлена на проверку! Вы получите уведомление после одобрения.',
            errorTitle: 'Заполните название и описание',
            errorCategories: 'Выберите хотя бы одну категорию',
            errorFiles: 'Загрузите архив игры и обложку',
            errorArchive: 'Загрузите архив игры (ZIP)',
            errorCover: 'Загрузите обложку',
            errorZipOnly: 'Допускаются только ZIP архивы',
            free: 'Бесплатно',
            noneSelected: 'Не выбрано',
            notSpecified: 'Не указано',
            uploaded: 'Загружено',
            notUploaded: 'Не загружено',
            filesCount: 'файлов',
            required: 'Обязательно'
        },
        
        // Moderation
        moderation: {
            title: 'Модерация',
            pendingGames: 'Игры на проверке',
            noGames: 'Нет игр на проверке',
            gameInfo: 'Информация об игре',
            developer: 'Разработчик',
            submittedAt: 'Отправлено',
            price: 'Цена',
            free: 'Бесплатно',
            categories: 'Категории',
            description: 'Описание',
            systemReq: 'Системные требования',
            minimum: 'Минимальные',
            recommended: 'Рекомендуемые',
            files: 'Файлы',
            fileCount: 'файлов',
            totalSize: 'Общий размер',
            expandAll: 'Развернуть всё',
            collapseAll: 'Свернуть всё',
            suspiciousFiles: 'Подозрительные файлы',
            noneFound: 'Не найдено',
            screenshots: 'Скриншоты',
            approve: 'Одобрить',
            reject: 'Отклонить',
            approveTitle: 'Одобрить игру',
            approveMessage: 'Вы уверены, что хотите одобрить эту игру?',
            rejectTitle: 'Отклонить игру',
            rejectReason: 'Причина отклонения',
            rejectReasonPlaceholder: 'Введите причину отклонения...',
            gameApproved: 'Игра одобрена!',
            gameRejected: 'Игра отклонена',
            accessDenied: 'Доступ запрещён',
            adminOnly: 'Только админы и модераторы имеют доступ к этой странице'
        },
        
        // Profile
        profilePage: {
            editProfile: 'Редактировать профиль',
            statistics: 'Статистика',
            games: 'Игры',
            hoursPlayed: 'часов в играх',
            achievements: 'Достижения',
            memberSince: 'На платформе с',
            information: 'Информация',
            country: 'Страна'
        },
        
        // Game Page
        gamePage: {
            notFound: 'Игра не найдена',
            developer: 'Разработчик',
            about: 'Об игре',
            requirements: 'Системные требования',
            minimum: 'Минимальные',
            os: 'ОС',
            processor: 'Процессор',
            memory: 'Память',
            graphics: 'Видеокарта',
            storage: 'Место на диске',
            reviews: 'Отзывы',
            noReviews: 'Пока нет отзывов',
            level: 'Уровень',
            recommended: 'Рекомендует',
            notRecommended: 'Не рекомендует',
            releaseDate: 'Дата выхода',
            downloads: 'Загрузки',
            rating: 'Рейтинг',
            positive: 'положительных',
            similarGames: 'Похожие игры',
            addError: 'Ошибка добавления в библиотеку',
            buy: 'Купить'
        },
        
        // Common
        common: {
            loading: 'Загрузка...',
            error: 'Ошибка',
            success: 'Успешно',
            cancel: 'Отмена',
            confirm: 'Подтвердить',
            save: 'Сохранить',
            delete: 'Удалить',
            edit: 'Редактировать',
            close: 'Закрыть',
            search: 'Поиск',
            yes: 'Да',
            no: 'Нет',
            add: 'ОПУБЛИКОВАТЬ',
            unknown: 'Неизвестно',
            copy: 'Копировать'
        }
    }
};

// Get current language from localStorage or default to 'en'
export const getLanguage = () => {
    return localStorage.getItem('uteam_language') || 'en';
};

// Set language
export const setLanguage = (lang) => {
    localStorage.setItem('uteam_language', lang);
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
};

// Translate function
export const t = (key, params = {}) => {
    const lang = getLanguage();
    const keys = key.split('.');
    let value = translations[lang];
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            // Fallback to English
            value = translations['en'];
            for (const k2 of keys) {
                if (value && value[k2]) {
                    value = value[k2];
                } else {
                    return key; // Return key if not found
                }
            }
            break;
        }
    }
    
    // Replace params like {title}
    if (typeof value === 'string' && Object.keys(params).length > 0) {
        for (const [param, val] of Object.entries(params)) {
            value = value.replace(`{${param}}`, val);
        }
    }
    
    return value;
};

// Hook for React components
export const useTranslation = () => {
    const [, forceUpdate] = React.useState({});
    
    React.useEffect(() => {
        const handleLanguageChange = () => forceUpdate({});
        window.addEventListener('languageChange', handleLanguageChange);
        return () => window.removeEventListener('languageChange', handleLanguageChange);
    }, []);
    
    return { t, getLanguage, setLanguage };
};

// Import React for the hook
import React from 'react';

export default translations;
