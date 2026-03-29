/**
 * Electron Preload Script
 * Мост между main и renderer процессами
 */

const { contextBridge, ipcRenderer } = require('electron');

// Безопасное API для renderer процесса
contextBridge.exposeInMainWorld('electronAPI', {
    // Управление окном
    window: {
        minimize: () => ipcRenderer.send('window:minimize'),
        maximize: () => ipcRenderer.send('window:maximize'),
        close: () => ipcRenderer.send('window:close')
    },

    // Хранилище (для настроек)
    store: {
        get: (key) => ipcRenderer.invoke('store:get', key),
        set: (key, value) => ipcRenderer.invoke('store:set', key, value),
        delete: (key) => ipcRenderer.invoke('store:delete', key)
    },
    
    // Защищённое хранилище (для токенов, паролей) - зашифровано
    secure: {
        get: (key) => ipcRenderer.invoke('secure:get', key),
        set: (key, value) => ipcRenderer.invoke('secure:set', key, value),
        delete: (key) => ipcRenderer.invoke('secure:delete', key)
    },
    
    // Шифрование/дешифрование
    crypto: {
        encrypt: (data) => ipcRenderer.invoke('crypto:encrypt', data),
        decrypt: (encryptedData) => ipcRenderer.invoke('crypto:decrypt', encryptedData)
    },

    // Приложение
    app: {
        getGamesPath: () => ipcRenderer.invoke('app:getGamesPath'),
        getInfo: () => ipcRenderer.invoke('app:getInfo'),
        setAutoLaunch: (enable) => ipcRenderer.invoke('app:setAutoLaunch', enable),
        getAutoLaunch: () => ipcRenderer.invoke('app:getAutoLaunch'),
        clearCache: () => ipcRenderer.invoke('app:clearCache'),
        getVersion: () => ipcRenderer.invoke('app:getVersion'),
        getPath: (name) => ipcRenderer.invoke('app:getPath', name)
    },

    // Shell
    shell: {
        openPath: (path) => ipcRenderer.send('shell:openPath', path)
    },

    // Dialog
    dialog: {
        showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpen', options)
    },

    // Игры - полная система установки EXE игр
    game: {
        // Запуск установленной EXE игры
        launch: (gameData) => ipcRenderer.send('game:launch', gameData),
        
        // Запуск HTML/Web игры в отдельном окне
        launchWeb: (gameData) => ipcRenderer.send('game:launchWeb', gameData),
        
        // Установка игры
        install: (gameData) => ipcRenderer.invoke('game:install', gameData),
        
        // Удаление игры
        uninstall: (gameId) => ipcRenderer.invoke('game:uninstall', gameId),
        
        // Проверить, установлена ли игра
        checkInstalled: (gameId) => ipcRenderer.invoke('game:checkInstalled', gameId),
        
        // Открыть папку с игрой
        openFolder: (gameId) => ipcRenderer.send('game:openFolder', gameId),
        
        // Проверить целостность файлов
        verifyFiles: (gameId) => ipcRenderer.invoke('game:verifyFiles', gameId),
        
        // События
        onLaunched: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('game:launched', handler);
            return () => ipcRenderer.removeListener('game:launched', handler);
        },
        onClosed: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('game:closed', handler);
            return () => ipcRenderer.removeListener('game:closed', handler);
        },
        onError: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('game:error', handler);
            return () => ipcRenderer.removeListener('game:error', handler);
        },
        onDownloadProgress: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('game:downloadProgress', handler);
            return () => ipcRenderer.removeListener('game:downloadProgress', handler);
        }
    },
    
    // Авто-обновление
    updater: {
        checkForUpdates: () => ipcRenderer.invoke('updater:check'),
        downloadUpdate: () => ipcRenderer.invoke('updater:download'),
        installUpdate: () => ipcRenderer.send('updater:install'),
        onUpdateAvailable: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('updater:available', handler);
            return () => ipcRenderer.removeListener('updater:available', handler);
        },
        onDownloadProgress: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('updater:progress', handler);
            return () => ipcRenderer.removeListener('updater:progress', handler);
        }
    }
});
