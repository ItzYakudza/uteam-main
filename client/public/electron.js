/**
 * Electron Main Process
 * UTEAM - Game Store Application
 */

const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

// Cloud Update System
const cloudUpdater = require('./updater');

// Генерация ключа шифрования на основе машины
const getMachineId = () => {
    const os = require('os');
    const machineInfo = `${os.hostname()}-${os.platform()}-${os.arch()}-${os.cpus()[0]?.model || 'cpu'}`;
    return crypto.createHash('sha256').update(machineInfo).digest('hex').substring(0, 32);
};

// Хранилище с шифрованием
const store = new Store({
    name: 'uteam-config',
    encryptionKey: getMachineId(),
    clearInvalidConfig: true
});

// Отдельное хранилище для чувствительных данных
const secureStore = new Store({
    name: 'uteam-secure',
    encryptionKey: getMachineId() + '-secure',
    clearInvalidConfig: true
});

// Ссылки на окна и трей
let mainWindow;
let splashWindow;
let gameWindows = new Map(); // Окна игр (gameId -> BrowserWindow)
let tray;
let isAppReady = false;

// Режим разработки
const isDev = !app.isPackaged;

// Путь к иконке (работает и в dev и в production)
const getIconPath = () => {
    if (isDev) {
        return path.join(__dirname, '../../public/icon.ico');
    }
    // В production иконка находится в ресурсах
    return path.join(process.resourcesPath, 'icon.ico');
};

// Single instance lock - только один экземпляр приложения
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
}

// Создание splash screen (загрузочный экран как в Steam)
function createSplashWindow() {
    const iconPath = getIconPath();
    
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: false,
        show: true,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                background: linear-gradient(135deg, #1b2838 0%, #2a475e 100%);
                color: white;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid rgba(102, 192, 244, 0.3);
            }
            .logo {
                font-size: 42px;
                font-weight: bold;
                background: linear-gradient(90deg, #66c0f4, #4fc3f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 8px;
                letter-spacing: 8px;
            }
            .subtitle {
                font-size: 10px;
                color: rgba(255,255,255,0.5);
                letter-spacing: 6px;
                margin-bottom: 30px;
            }
            .progress-container {
                width: 280px;
                height: 3px;
                background: rgba(255,255,255,0.1);
                border-radius: 2px;
                overflow: hidden;
            }
            .progress-bar {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #66c0f4, #4fc3f7);
                border-radius: 2px;
                transition: width 0.3s ease;
            }
            .status {
                margin-top: 15px;
                font-size: 11px;
                color: rgba(255,255,255,0.6);
                min-height: 16px;
            }
            .version {
                position: absolute;
                bottom: 12px;
                font-size: 10px;
                color: rgba(255,255,255,0.3);
            }
        </style>
    </head>
    <body>
        <div class="logo">UTEAM</div>
        <div class="subtitle">GAME PLATFORM</div>
        <div class="progress-container">
            <div class="progress-bar" id="progress"></div>
        </div>
        <div class="status" id="status">Starting...</div>
        <div class="version">v1.0.0</div>
        <script>
            const { ipcRenderer } = require('electron');
            
            ipcRenderer.on('splash:status', (event, { status, progress }) => {
                document.getElementById('status').textContent = status;
                document.getElementById('progress').style.width = progress + '%';
            });
        </script>
    </body>
    </html>`;

    splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
}

// Обновление статуса в splash screen
function updateSplashStatus(status, progress) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('splash:status', { status, progress });
    }
}

function createWindow() {
    const iconPath = getIconPath();
    
    // Создание главного окна (скрытое изначально)
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        frame: false,
        backgroundColor: '#1b2838',
        show: false, // Не показываем пока не готово
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Загрузка приложения
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    } else {
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

    // Открытие внешних ссылок в браузере
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Показать главное окно и закрыть splash
function showMainWindow() {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
    }
    
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
        
        // DevTools только в dev режиме
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    }
    
    isAppReady = true;
}

// Создание иконки в трее
function createTray() {
    try {
        const iconPath = getIconPath();
        
        // Проверяем существует ли файл иконки
        if (!fs.existsSync(iconPath)) {
            console.error('Tray icon not found at:', iconPath);
            return;
        }
        
        const icon = nativeImage.createFromPath(iconPath);
        
        // Проверяем что иконка загрузилась
        if (icon.isEmpty()) {
            console.error('Failed to load tray icon');
            return;
        }
        
        tray = new Tray(icon.resize({ width: 16, height: 16 }));

        const showWindow = () => {
            if (mainWindow) {
                // Принудительно восстанавливаем и показываем окно
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                if (!mainWindow.isVisible()) {
                    mainWindow.show();
                }
                mainWindow.setAlwaysOnTop(true);
                mainWindow.focus();
                mainWindow.setAlwaysOnTop(false);
            } else {
                // Если окно еще не создано, создаем его
                createWindow();
            }
        };

        const contextMenu = Menu.buildFromTemplate([
            { 
                label: 'Open UTEAM', 
                click: showWindow
            },
            { type: 'separator' },
            { 
                label: 'Exit', 
                click: () => {
                    app.isQuitting = true;
                    app.quit();
                }
            }
        ]);

        tray.setToolTip('UTEAM - Game Store');
        tray.setContextMenu(contextMenu);

        // Клик по иконке - показываем окно
        tray.on('click', showWindow);
        
        // Двойной клик тоже открывает
        tray.on('double-click', showWindow);
        
        console.log('Tray created successfully');
    } catch (error) {
        console.error('Error creating tray:', error);
    }
}

// Запуск приложения
app.whenReady().then(async () => {
    // Проверяем и применяем отложенное обновление
    if (!isDev) {
        const pendingApplied = await cloudUpdater.applyPendingUpdate();
        if (pendingApplied) {
            // Приложение закроется для обновления
            return;
        }
    }
    
    // Сначала показываем splash screen
    createSplashWindow();
    
    // Инициализация с отображением прогресса
    try {
        updateSplashStatus('Initializing...', 10);
        await sleep(300);
        
        updateSplashStatus('Creating window...', 30);
        createWindow();
        
        // Ждём загрузки контента окна
        await new Promise((resolve) => {
            mainWindow.webContents.once('did-finish-load', resolve);
            // Таймаут на случай если загрузка зависла
            setTimeout(resolve, 10000);
        });
        
        updateSplashStatus('Loading resources...', 60);
        await sleep(500);
        
        updateSplashStatus('Checking authorization...', 80);
        await sleep(500);
        
        // Проверяем обновления перед показом главного окна (только в production)
        if (!isDev) {
            updateSplashStatus('Checking for updates...', 90);
            
            try {
                // Проверяем обновления (таймаут 15 секунд для медленного интернета)
                const updateResult = await cloudUpdater.checkForUpdates(false, 15000);
                
                if (updateResult.updateAvailable) {
                    console.log('[Startup] Update available:', updateResult.newVersion);
                    // Закрываем splash и показываем окно обновления
                    if (splashWindow && !splashWindow.isDestroyed()) {
                        splashWindow.close();
                        splashWindow = null;
                    }
                    
                    // Показываем окно обновления
                    const updateWindow = cloudUpdater.createUpdateWindow();
                    
                    // Ждём завершения или пропуска
                    await new Promise((resolve) => {
                        // Если обновление уже скачано - просто показываем кнопку рестарта
                        if (updateResult.pendingRestart) {
                            // Обновление уже скачано, показываем только кнопку рестарта
                            updateWindow.webContents.once('did-finish-load', () => {
                                updateWindow.webContents.send('update:status', {
                                    title: 'Update Ready!',
                                    versionInfo: `${updateResult.currentVersion} → ${updateResult.newVersion}`,
                                    status: 'Restart to apply update',
                                    complete: true
                                });
                            });
                        } else {
                            // Начинаем скачивание
                            cloudUpdater.downloadAndInstallUpdate().catch((err) => {
                                console.error('[Startup] Download error:', err.message);
                                // При ошибке закрываем окно обновления и продолжаем
                                if (updateWindow && !updateWindow.isDestroyed()) {
                                    updateWindow.close();
                                }
                                resolve();
                            });
                        }
                        
                        // Пользователь может пропустить
                        ipcMain.once('update:skip', () => {
                            if (updateWindow && !updateWindow.isDestroyed()) {
                                updateWindow.close();
                            }
                            resolve();
                        });
                        
                        // При закрытии окна - продолжаем
                        updateWindow.once('closed', () => {
                            resolve();
                        });
                    });
                } else {
                    console.log('[Startup] No update available');
                }
            } catch (err) {
                console.error('[Startup] Update check error:', err.message);
                // При любой ошибке - просто продолжаем запуск
            }
        }
        
        updateSplashStatus('Ready!', 100);
        await sleep(300);
        
        // Показываем главное окно
        showMainWindow();
        
        // Создаём трей только после полной инициализации
        createTray();
        
        // Инициализируем систему обновлений после показа окна
        if (!isDev) {
            cloudUpdater.initUpdater(mainWindow);
            cloudUpdater.startPeriodicCheck();
        }
    } catch (error) {
        console.error('Startup error:', error);
        showMainWindow();
        createTray(); // Создаём трей даже при ошибке
    }
});

// Вспомогательная функция для задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Обработка второго экземпляра приложения
app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

// Закрытие при закрытии всех окон (Windows)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Сворачиваем в трей вместо закрытия
        if (!app.isQuitting) {
            return;
        }
        app.quit();
    }
});

// Сворачивание в трей при закрытии окна
app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// ============================================
// IPC обработчики (связь с renderer процессом)
// ============================================

// Управление окном
ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

ipcMain.on('window:close', () => {
    mainWindow?.close();
});

// Хранилище данных (обычное)
ipcMain.handle('store:get', (event, key) => {
    return store.get(key);
});

ipcMain.handle('store:set', (event, key, value) => {
    store.set(key, value);
    return true;
});

ipcMain.handle('store:delete', (event, key) => {
    store.delete(key);
    return true;
});

// Защищённое хранилище (для токенов, паролей)
ipcMain.handle('secure:get', (event, key) => {
    return secureStore.get(key);
});

ipcMain.handle('secure:set', (event, key, value) => {
    secureStore.set(key, value);
    return true;
});

ipcMain.handle('secure:delete', (event, key) => {
    secureStore.delete(key);
    return true;
});

// Шифрование/дешифрование данных
ipcMain.handle('crypto:encrypt', (event, data) => {
    try {
        const key = getMachineId();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { iv: iv.toString('hex'), data: encrypted };
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
});

ipcMain.handle('crypto:decrypt', (event, encryptedData) => {
    try {
        const key = getMachineId();
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
});

// Получение пути для установки игр
ipcMain.handle('app:getGamesPath', () => {
    return path.join(app.getPath('userData'), 'games');
});

// Получение информации о приложении
ipcMain.handle('app:getInfo', () => {
    return {
        version: app.getVersion(),
        name: app.getName(),
        path: app.getAppPath()
    };
});

// Открытие папки с игрой
ipcMain.on('shell:openPath', (event, gamePath) => {
    shell.openPath(gamePath);
});

// Создание окна для запуска HTML/Web игры
function createGameWindow(gameData) {
    const { gameId, title, gameUrl, gamePath } = gameData;
    const iconPath = getIconPath();
    
    // Если окно уже открыто - фокусируемся на нём
    if (gameWindows.has(gameId)) {
        const existingWindow = gameWindows.get(gameId);
        if (!existingWindow.isDestroyed()) {
            existingWindow.focus();
            return existingWindow;
        }
    }
    
    const gameWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: true, // Нативные кнопки Windows!
        backgroundColor: '#1b2838',
        icon: iconPath,
        title: `UTEAM - ${title}`,
        autoHideMenuBar: true, // Скрываем меню
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        }
    });
    
    // Загружаем игру
    const API_BASE = 'http://localhost:3001';
    const fullUrl = gameUrl || `${API_BASE}/games${gamePath}/index.html`;
    gameWindow.loadURL(fullUrl);
    
    // Сохраняем окно в Map
    gameWindows.set(gameId, gameWindow);
    
    // Уведомляем главное окно что игра запущена
    mainWindow?.webContents.send('game:launched', { gameId, title });
    
    gameWindow.on('closed', () => {
        gameWindows.delete(gameId);
        // Уведомляем главное окно что игра закрыта
        mainWindow?.webContents.send('game:closed', { gameId, title });
    });
    
    return gameWindow;
}

// Запуск HTML/Web игры в отдельном окне
ipcMain.on('game:launchWeb', (event, gameData) => {
    createGameWindow(gameData);
});

// Запуск EXE игры
ipcMain.on('game:launch', (event, gameData) => {
    const { executablePath, title, gameId } = gameData;
    
    if (!executablePath || !fs.existsSync(executablePath)) {
        mainWindow?.webContents.send('game:error', { error: 'Game executable not found' });
        return;
    }

    const gameProcess = spawn(executablePath, [], {
        detached: true,
        stdio: 'ignore',
        cwd: path.dirname(executablePath)
    });

    gameProcess.unref();
    mainWindow?.webContents.send('game:launched', { gameId, title });
    
    // Отслеживаем закрытие процесса (опционально)
    gameProcess.on('close', () => {
        mainWindow?.webContents.send('game:closed', { gameId, title });
    });
});

// Установка игры - скачивание ZIP и распаковка
ipcMain.handle('game:install', async (event, gameData) => {
    const { downloadUrl, gameId, title, token } = gameData;
    const gamesPath = path.join(app.getPath('userData'), 'games');
    const gameInstallPath = path.join(gamesPath, gameId);
    const tempZipPath = path.join(app.getPath('temp'), `${gameId}.zip`);

    // Создаём папку для игр если её нет
    if (!fs.existsSync(gamesPath)) {
        fs.mkdirSync(gamesPath, { recursive: true });
    }

    // Если игра уже установлена - удалим
    if (fs.existsSync(gameInstallPath)) {
        fs.rmSync(gameInstallPath, { recursive: true, force: true });
    }

    try {
        // Скачиваем архив
        mainWindow?.webContents.send('game:downloadProgress', {
            gameId,
            status: 'downloading',
            progress: 0,
            speed: '0 B/s'
        });

        const https = require('https');
        const http = require('http');
        
        await new Promise((resolve, reject) => {
            const protocol = downloadUrl.startsWith('https') ? https : http;
            const options = {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            };
            
            const request = protocol.get(downloadUrl, options, (response) => {
                // Обработка редиректов
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    const redirectUrl = response.headers.location;
                    const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
                    redirectProtocol.get(redirectUrl, options, handleResponse).on('error', reject);
                    return;
                }
                
                handleResponse(response);
                
                function handleResponse(res) {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Download failed: ${res.statusCode}`));
                        return;
                    }
                    
                    const totalSize = parseInt(res.headers['content-length'], 10) || 0;
                    let downloadedSize = 0;
                    let lastDownloaded = 0;
                    let lastTime = Date.now();
                    let currentSpeed = 0;
                    const fileStream = fs.createWriteStream(tempZipPath);
                    
                    // Обновляем скорость каждые 500мс
                    const speedInterval = setInterval(() => {
                        const now = Date.now();
                        const timeDiff = (now - lastTime) / 1000; // в секундах
                        if (timeDiff > 0) {
                            currentSpeed = (downloadedSize - lastDownloaded) / timeDiff;
                            lastDownloaded = downloadedSize;
                            lastTime = now;
                        }
                    }, 500);
                    
                    res.on('data', (chunk) => {
                        downloadedSize += chunk.length;
                        const progress = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0;
                        
                        mainWindow?.webContents.send('game:downloadProgress', {
                            gameId,
                            status: 'downloading',
                            progress,
                            downloaded: formatBytes(downloadedSize),
                            total: formatBytes(totalSize),
                            speed: formatBytes(currentSpeed) + '/s'
                        });
                    });
                    
                    res.pipe(fileStream);
                    
                    fileStream.on('finish', () => {
                        clearInterval(speedInterval);
                        fileStream.close();
                        resolve();
                    });
                    
                    fileStream.on('error', (err) => {
                        clearInterval(speedInterval);
                        reject(err);
                    });
                }
            });
            
            request.on('error', reject);
        });

        // Распаковываем
        mainWindow?.webContents.send('game:downloadProgress', {
            gameId,
            status: 'extracting',
            progress: 50
        });

        const AdmZip = require('adm-zip');
        const zip = new AdmZip(tempZipPath);
        
        fs.mkdirSync(gameInstallPath, { recursive: true });
        zip.extractAllTo(gameInstallPath, true);

        // Удаляем временный файл
        fs.unlinkSync(tempZipPath);

        // Ищем exe файл
        const findExe = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    const found = findExe(fullPath);
                    if (found) return found;
                } else if (file.endsWith('.exe')) {
                    return fullPath;
                }
            }
            return null;
        };

        const executablePath = findExe(gameInstallPath);

        mainWindow?.webContents.send('game:downloadProgress', {
            gameId,
            status: 'completed',
            progress: 100
        });

        return {
            success: true,
            installPath: gameInstallPath,
            executablePath
        };
    } catch (error) {
        console.error('Install error:', error);
        
        // Очистка при ошибке
        if (fs.existsSync(tempZipPath)) {
            fs.unlinkSync(tempZipPath);
        }
        if (fs.existsSync(gameInstallPath)) {
            fs.rmSync(gameInstallPath, { recursive: true, force: true });
        }

        mainWindow?.webContents.send('game:downloadProgress', {
            gameId,
            status: 'error',
            error: error.message
        });

        throw error;
    }
});

// Вспомогательная функция форматирования байтов
function formatBytes(bytes) {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
}

// Проверка установлена ли игра
ipcMain.handle('game:checkInstalled', async (event, gameId) => {
    const gamesPath = path.join(app.getPath('userData'), 'games');
    const gameInstallPath = path.join(gamesPath, gameId);
    
    if (!fs.existsSync(gameInstallPath)) {
        return { installed: false };
    }

    // Ищем exe файл
    const files = fs.readdirSync(gameInstallPath);
    const exeFile = files.find(f => f.endsWith('.exe'));
    
    return {
        installed: true,
        installPath: gameInstallPath,
        executablePath: exeFile ? path.join(gameInstallPath, exeFile) : null
    };
});

// Удаление игры
ipcMain.handle('game:uninstall', async (event, gameId) => {
    const gamesPath = path.join(app.getPath('userData'), 'games');
    const gameInstallPath = path.join(gamesPath, gameId);
    
    if (fs.existsSync(gameInstallPath)) {
        fs.rmSync(gameInstallPath, { recursive: true, force: true });
        return { success: true };
    }
    
    return { success: false, error: 'Game not found' };
});

// Открытие папки с игрой в проводнике
ipcMain.on('game:openFolder', (event, gameId) => {
    const gamesPath = path.join(app.getPath('userData'), 'games');
    const gameInstallPath = path.join(gamesPath, gameId);
    
    if (fs.existsSync(gameInstallPath)) {
        shell.openPath(gameInstallPath);
    }
});

// Проверка целостности файлов игры
ipcMain.handle('game:verifyFiles', async (event, gameId, expectedFiles) => {
    const gamesPath = path.join(app.getPath('userData'), 'games');
    const gameInstallPath = path.join(gamesPath, gameId);
    
    if (!fs.existsSync(gameInstallPath)) {
        return { valid: false, error: 'Game not installed' };
    }

    const getAllFiles = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                getAllFiles(filePath, fileList);
            } else {
                fileList.push(path.relative(gameInstallPath, filePath));
            }
        });
        return fileList;
    };

    const installedFiles = getAllFiles(gameInstallPath);
    return { 
        valid: true, 
        filesCount: installedFiles.length,
        files: installedFiles
    };
});

// Автозагрузка
ipcMain.handle('app:setAutoLaunch', async (event, enable) => {
    app.setLoginItemSettings({
        openAtLogin: enable,
        path: app.getPath('exe')
    });
    return { success: true };
});

ipcMain.handle('app:getAutoLaunch', async () => {
    const settings = app.getLoginItemSettings();
    return { enabled: settings.openAtLogin };
});

// Получить версию приложения
ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
});

// Получить путь
ipcMain.handle('app:getPath', (event, name) => {
    try {
        return app.getPath(name);
    } catch (e) {
        return null;
    }
});

// Очистка кэша
ipcMain.handle('app:clearCache', async () => {
    try {
        const session = mainWindow?.webContents?.session;
        if (session) {
            await session.clearCache();
            await session.clearStorageData({
                storages: ['cachestorage', 'serviceworkers']
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Clear cache error:', error);
        return { success: false, error: error.message };
    }
});

// Диалог выбора папки
ipcMain.handle('dialog:showOpen', async (event, options) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, options);
        return result;
    } catch (error) {
        console.error('Dialog error:', error);
        return { canceled: true, filePaths: [] };
    }
});
