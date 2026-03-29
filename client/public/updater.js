/**
 * UTEAM Cloud Update System
 * Manages application updates from cloud storage
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// GitHub token for private repo access (read-only)
const GITHUB_TOKEN = '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';

// Cloud update configuration
const UPDATE_CONFIG = {
    // URL к файлу манифеста обновлений на сервере
    manifestUrl: process.env.UPDATE_MANIFEST_URL || 'http://localhost:3001/api/updates/manifest',
    // Интервал проверки обновлений (30 минут)
    checkInterval: 30 * 60 * 1000,
    // Папка для временных файлов обновления
    tempDir: path.join(app.getPath('userData'), 'updates'),
    // Папка приложения
    appDir: app.isPackaged ? path.dirname(app.getPath('exe')) : path.join(__dirname, '../..')
};

let updateWindow = null;
let mainWindow = null;
let updateInfo = null;
let downloadAborted = false;

/**
 * Инициализация системы обновлений
 */
function initUpdater(mainWin) {
    mainWindow = mainWin;
    
    // Создаём папку для обновлений
    if (!fs.existsSync(UPDATE_CONFIG.tempDir)) {
        fs.mkdirSync(UPDATE_CONFIG.tempDir, { recursive: true });
    }
    
    // Регистрируем IPC обработчики
    registerIPCHandlers();
    
    console.log('[Updater] Initialized');
}

/**
 * Создание окна обновления (показывается при запуске если есть обновление)
 */
function createUpdateWindow() {
    if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.focus();
        return updateWindow;
    }
    
    updateWindow = new BrowserWindow({
        width: 450,
        height: 280,
        frame: false,
        transparent: true,
        resizable: false,
        center: true,
        alwaysOnTop: true,
        skipTaskbar: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
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
                padding: 30px;
            }
            .logo {
                font-size: 36px;
                font-weight: bold;
                background: linear-gradient(90deg, #66c0f4, #4fc3f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 8px;
            }
            .title {
                font-size: 14px;
                color: rgba(255,255,255,0.8);
                margin-bottom: 25px;
            }
            .version-info {
                font-size: 12px;
                color: rgba(255,255,255,0.5);
                margin-bottom: 20px;
            }
            .progress-container {
                width: 100%;
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 15px;
            }
            .progress-bar {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #66c0f4, #4fc3f7);
                border-radius: 3px;
                transition: width 0.3s ease;
            }
            .status {
                font-size: 12px;
                color: rgba(255,255,255,0.6);
                margin-bottom: 8px;
            }
            .speed-info {
                font-size: 11px;
                color: rgba(255,255,255,0.4);
            }
            .error {
                color: #ff6b6b;
                margin-top: 10px;
            }
            .buttons {
                margin-top: 20px;
                display: flex;
                gap: 10px;
            }
            .btn {
                padding: 10px 25px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s;
            }
            .btn-primary {
                background: linear-gradient(90deg, #66c0f4, #4fc3f7);
                color: #1b2838;
            }
            .btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 192, 244, 0.3);
            }
            .btn-secondary {
                background: rgba(255,255,255,0.1);
                color: white;
            }
            .btn-secondary:hover {
                background: rgba(255,255,255,0.2);
            }
            .hidden { display: none; }
        </style>
    </head>
    <body>
        <div class="logo">UTEAM</div>
        <div class="title" id="title">Checking for updates...</div>
        <div class="version-info" id="versionInfo"></div>
        
        <div class="progress-container" id="progressContainer">
            <div class="progress-bar" id="progressBar"></div>
        </div>
        
        <div class="status" id="status">Connecting...</div>
        <div class="speed-info" id="speedInfo"></div>
        <div class="error hidden" id="error"></div>
        
        <div class="buttons hidden" id="buttons">
            <button class="btn btn-secondary" id="skipBtn">Skip</button>
            <button class="btn btn-primary" id="restartBtn">Restart Now</button>
        </div>
        
        <script>
            const { ipcRenderer } = require('electron');
            
            const title = document.getElementById('title');
            const versionInfo = document.getElementById('versionInfo');
            const progressBar = document.getElementById('progressBar');
            const progressContainer = document.getElementById('progressContainer');
            const status = document.getElementById('status');
            const speedInfo = document.getElementById('speedInfo');
            const error = document.getElementById('error');
            const buttons = document.getElementById('buttons');
            const skipBtn = document.getElementById('skipBtn');
            const restartBtn = document.getElementById('restartBtn');
            
            ipcRenderer.on('update:status', (event, data) => {
                title.textContent = data.title || 'Updating...';
                status.textContent = data.status || '';
                
                if (data.versionInfo) {
                    versionInfo.textContent = data.versionInfo;
                }
                
                if (data.progress !== undefined) {
                    progressBar.style.width = data.progress + '%';
                }
                
                if (data.speed) {
                    speedInfo.textContent = data.speed;
                }
                
                if (data.error) {
                    error.textContent = data.error;
                    error.classList.remove('hidden');
                }
                
                if (data.complete) {
                    buttons.classList.remove('hidden');
                    progressContainer.classList.add('hidden');
                }
            });
            
            skipBtn.addEventListener('click', () => {
                ipcRenderer.send('update:skip');
            });
            
            restartBtn.addEventListener('click', () => {
                ipcRenderer.send('update:restart');
            });
        </script>
    </body>
    </html>`;
    
    updateWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    
    updateWindow.on('closed', () => {
        updateWindow = null;
    });
    
    return updateWindow;
}

/**
 * Отправка статуса в окно обновления
 */
function sendUpdateStatus(data) {
    if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.webContents.send('update:status', data);
    }
}

/**
 * Получение манифеста обновлений с сервера
 * @param {number} timeoutMs - таймаут в миллисекундах (по умолчанию 10 секунд)
 */
async function fetchUpdateManifest(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const url = new URL(UPDATE_CONFIG.manifestUrl);
        const protocol = url.protocol === 'https:' ? https : http;
        
        let req;
        let timeoutId;
        let completed = false;
        
        // Создаём таймаут который гарантированно сработает
        timeoutId = setTimeout(() => {
            if (!completed) {
                completed = true;
                if (req) {
                    req.destroy();
                }
                reject(new Error('Request timeout - server may be waking up'));
            }
        }, timeoutMs);
        
        try {
            req = protocol.get(url, {
                headers: {
                    'User-Agent': `UTEAM-Client/${app.getVersion()}`
                }
            }, (res) => {
                if (completed) return;
                clearTimeout(timeoutId);
                
                if (res.statusCode !== 200) {
                    completed = true;
                    reject(new Error(`Server returned ${res.statusCode}`));
                    return;
                }
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (completed) return;
                    completed = true;
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Invalid manifest format'));
                    }
                });
                res.on('error', (err) => {
                    if (completed) return;
                    completed = true;
                    clearTimeout(timeoutId);
                    reject(err);
                });
            });
            
            req.on('error', (err) => {
                if (completed) return;
                completed = true;
                clearTimeout(timeoutId);
                reject(err);
            });
        } catch (err) {
            if (!completed) {
                completed = true;
                clearTimeout(timeoutId);
                reject(err);
            }
        }
    });
}

/**
 * Проверка есть ли уже скачанное обновление
 */
function hasPendingUpdate() {
    const pendingPath = path.join(UPDATE_CONFIG.tempDir, 'pending-update.json');
    if (fs.existsSync(pendingPath)) {
        try {
            const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf-8'));
            return pending.version || null;
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * Проверка наличия обновлений
 * @param {boolean} showWindow - показывать окно обновления
 * @param {number} timeoutMs - таймаут запроса (по умолчанию 10 секунд)
 */
async function checkForUpdates(showWindow = false, timeoutMs = 10000) {
    try {
        console.log('[Updater] Checking for updates...');
        
        // Проверяем есть ли уже скачанное обновление
        const pendingVersion = hasPendingUpdate();
        if (pendingVersion) {
            console.log(`[Updater] Pending update found: ${pendingVersion}`);
            // Возвращаем что обновление доступно, но не скачиваем заново
            return {
                updateAvailable: true,
                currentVersion: app.getVersion(),
                newVersion: pendingVersion,
                pendingRestart: true
            };
        }
        
        const manifest = await fetchUpdateManifest(timeoutMs);
        const currentVersion = app.getVersion();
        const latestVersion = manifest.version;
        
        console.log(`[Updater] Current: ${currentVersion}, Latest: ${latestVersion}`);
        
        if (compareVersions(latestVersion, currentVersion) > 0) {
            updateInfo = manifest;
            
            // Уведомляем главное окно о доступном обновлении
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('updater:available', {
                    currentVersion,
                    newVersion: latestVersion,
                    releaseNotes: manifest.releaseNotes,
                    mandatory: manifest.mandatory || false,
                    size: manifest.size
                });
            }
            
            // Если указано показать окно (при запуске)
            if (showWindow) {
                createUpdateWindow();
                await downloadAndInstallUpdate();
            }
            
            return {
                updateAvailable: true,
                currentVersion,
                newVersion: latestVersion,
                manifest
            };
        }
        
        return { updateAvailable: false, currentVersion };
    } catch (error) {
        console.error('[Updater] Check failed:', error.message);
        return { updateAvailable: false, error: error.message };
    }
}

/**
 * Скачивание и установка обновления
 * @returns {Promise<boolean>} - true если успешно, false если ошибка
 */
async function downloadAndInstallUpdate() {
    if (!updateInfo) {
        sendUpdateStatus({ error: 'No update info available' });
        throw new Error('No update info available');
    }
    
    downloadAborted = false;
    
    sendUpdateStatus({
        title: 'Downloading Update',
        versionInfo: `${app.getVersion()} → ${updateInfo.version}`,
        status: 'Preparing download...',
        progress: 0
    });
    
    try {
        // Скачиваем файл обновления
        const downloadUrl = updateInfo.downloadUrl;
        const fileName = path.basename(new URL(downloadUrl).pathname) || 'update.zip';
        const filePath = path.join(UPDATE_CONFIG.tempDir, fileName);
        
        await downloadFile(downloadUrl, filePath, (progress, speed, downloaded, total) => {
            if (downloadAborted) return;
            
            sendUpdateStatus({
                title: 'Downloading Update',
                versionInfo: `${app.getVersion()} → ${updateInfo.version}`,
                status: `${formatBytes(downloaded)} / ${formatBytes(total)}`,
                speed: `${formatBytes(speed)}/s`,
                progress: Math.round(progress)
            });
        });
        
        if (downloadAborted) {
            throw new Error('Download aborted');
        }
        
        sendUpdateStatus({
            title: 'Installing Update',
            status: 'Extracting files...',
            progress: 100
        });
        
        // Распаковываем и устанавливаем
        await installUpdate(filePath);
        
        sendUpdateStatus({
            title: 'Update Complete!',
            status: 'Restart to apply changes',
            complete: true
        });
        
        return true;
        
    } catch (error) {
        console.error('[Updater] Download failed:', error);
        sendUpdateStatus({
            title: 'Update Failed',
            status: 'Could not download update',
            error: error.message,
            complete: true // Показываем кнопки чтобы можно было закрыть
        });
        throw error; // Пробрасываем ошибку наверх
    }
}

/**
 * Скачивание файла с прогрессом
 */
function downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        // Проверяем нужен ли токен для GitHub
        const isGitHub = url.includes('github.com') || url.includes('githubusercontent.com');
        const headers = {
            'User-Agent': `UTEAM-Client/${app.getVersion()}`
        };
        
        // Добавляем токен для приватного репозитория GitHub
        if (isGitHub && GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
            headers['Accept'] = 'application/octet-stream';
        }
        
        const file = fs.createWriteStream(destPath);
        let downloadedBytes = 0;
        let totalBytes = 0;
        let startTime = Date.now();
        let lastTime = startTime;
        let lastBytes = 0;
        
        const req = protocol.get(url, { headers }, (res) => {
            // Обработка редиректов (GitHub использует редиректы)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                file.close();
                try { fs.unlinkSync(destPath); } catch(e) {}
                // Для редиректа GitHub не нужен токен в URL назначения
                downloadFile(res.headers.location, destPath, onProgress)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                file.close();
                try { fs.unlinkSync(destPath); } catch(e) {}
                reject(new Error(`Download failed: HTTP ${res.statusCode}`));
                return;
            }
            
            totalBytes = parseInt(res.headers['content-length'], 10) || 0;
            
            res.pipe(file);
            
            res.on('data', (chunk) => {
                if (downloadAborted) {
                    req.destroy();
                    return;
                }
                
                downloadedBytes += chunk.length;
                
                const now = Date.now();
                const elapsed = (now - lastTime) / 1000;
                
                if (elapsed >= 0.5) {
                    const speed = (downloadedBytes - lastBytes) / elapsed;
                    const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
                    
                    onProgress(progress, speed, downloadedBytes, totalBytes);
                    
                    lastTime = now;
                    lastBytes = downloadedBytes;
                }
            });
            
            file.on('finish', () => {
                file.close();
                resolve(destPath);
            });
            
            file.on('error', (err) => {
                file.close();
                try { fs.unlinkSync(destPath); } catch(e) {}
                reject(err);
            });
        });
        
        req.on('error', (err) => {
            file.close();
            try { fs.unlinkSync(destPath); } catch(e) {}
            reject(err);
        });
    });
}

/**
 * Установка обновления из архива
 */
async function installUpdate(zipPath) {
    try {
        const zip = new AdmZip(zipPath);
        const extractPath = path.join(UPDATE_CONFIG.tempDir, 'extracted');
        
        // Очищаем папку извлечения
        if (fs.existsSync(extractPath)) {
            fs.rmSync(extractPath, { recursive: true });
        }
        
        // Извлекаем файлы
        zip.extractAllTo(extractPath, true);
        
        // Создаём скрипт обновления который выполнится после закрытия приложения
        const updateScript = createUpdateScript(extractPath, UPDATE_CONFIG.appDir);
        
        // Сохраняем путь к скрипту для выполнения при перезапуске
        const pendingUpdatePath = path.join(UPDATE_CONFIG.tempDir, 'pending-update.json');
        fs.writeFileSync(pendingUpdatePath, JSON.stringify({
            script: updateScript,
            extractPath,
            version: updateInfo.version
        }));
        
        // Удаляем скачанный архив
        fs.unlinkSync(zipPath);
        
        return true;
    } catch (error) {
        console.error('[Updater] Install failed:', error);
        throw error;
    }
}

/**
 * Создание скрипта обновления (Windows batch file)
 * Поддерживает как установленную версию (папка с файлами), так и portable (один exe)
 */
function createUpdateScript(sourcePath, destPath) {
    const scriptPath = path.join(UPDATE_CONFIG.tempDir, 'update.bat');
    const exePath = app.getPath('exe');
    const exeName = path.basename(exePath);
    const appFolder = path.dirname(exePath); // Папка где находится exe
    const pendingPath = path.join(UPDATE_CONFIG.tempDir, 'pending-update.json');
    const logPath = path.join(UPDATE_CONFIG.tempDir, 'update.log');
    
    // Определяем тип установки:
    // - Portable: exe в случайной папке, копируем только exe
    // - Installed: exe в папке с resources, locales и т.д., копируем всё
    const isPortable = exeName.toLowerCase().includes('portable');
    
    console.log('[Updater] Update type:', isPortable ? 'PORTABLE' : 'INSTALLED');
    console.log('[Updater] App folder:', appFolder);
    console.log('[Updater] Exe path:', exePath);
    
    const script = `@echo off
chcp 65001 > nul
echo ========================================= > "${logPath}"
echo UTEAM Updater >> "${logPath}"
echo %date% %time% >> "${logPath}"
echo Update type: ${isPortable ? 'PORTABLE' : 'INSTALLED'} >> "${logPath}"
echo ========================================= >> "${logPath}"
echo. >> "${logPath}"

echo Waiting for application to close...
echo [1/5] Waiting for app to close... >> "${logPath}"

:waitloop
tasklist /FI "IMAGENAME eq ${exeName}" 2>NUL | find /I /N "${exeName}" >NUL
if "%ERRORLEVEL%"=="0" (
    echo App still running, waiting... >> "${logPath}"
    timeout /t 1 /nobreak > nul
    goto waitloop
)

echo Application closed >> "${logPath}"
timeout /t 2 /nobreak > nul

echo. >> "${logPath}"
echo [2/5] Source folder contents: >> "${logPath}"
dir "${sourcePath}" >> "${logPath}" 2>&1
echo. >> "${logPath}"

${isPortable ? `
REM === PORTABLE VERSION: Copy only exe file ===
echo [3/5] Portable mode - copying exe only... >> "${logPath}"

for %%f in ("${sourcePath}\\*.exe") do (
    echo Found: %%f >> "${logPath}"
    echo Copying to: ${exePath} >> "${logPath}"
    copy /Y "%%f" "${exePath}" >> "${logPath}" 2>&1
    if errorlevel 1 (
        echo ERROR: Failed to copy exe >> "${logPath}"
        goto :error
    )
    echo Copy successful! >> "${logPath}"
    goto :cleanup
)
echo ERROR: No exe found >> "${logPath}"
goto :error
` : `
REM === INSTALLED VERSION: Copy all files to app folder ===
echo [3/5] Installed mode - copying all files... >> "${logPath}"
echo Destination: ${appFolder} >> "${logPath}"

REM Копируем все файлы из источника в папку приложения
xcopy /E /Y /I "${sourcePath}\\*" "${appFolder}\\" >> "${logPath}" 2>&1
if errorlevel 1 (
    echo WARNING: xcopy had some issues, checking result... >> "${logPath}"
)

REM Проверяем что exe скопировался
if exist "${appFolder}\\UTEAM.exe" (
    echo Main exe exists - update successful >> "${logPath}"
    goto :cleanup
)

REM Если UTEAM.exe нет, ищем любой exe
for %%f in ("${appFolder}\\*.exe") do (
    echo Found exe after copy: %%f >> "${logPath}"
    goto :cleanup
)

echo ERROR: No exe found after copy >> "${logPath}"
goto :error
`}

:cleanup
echo. >> "${logPath}"
echo [4/5] Cleaning up... >> "${logPath}"
rmdir /S /Q "${sourcePath}" >> "${logPath}" 2>&1
del /Q "${pendingPath}" >> "${logPath}" 2>&1

echo. >> "${logPath}"
echo [5/5] Update complete! >> "${logPath}"
echo ========================================= >> "${logPath}"
echo Starting UTEAM...
timeout /t 1 /nobreak > nul
start "" "${exePath}"
goto :end

:error
echo. >> "${logPath}"
echo ========================================= >> "${logPath}"
echo UPDATE FAILED! >> "${logPath}"
echo Please reinstall UTEAM manually >> "${logPath}"
echo ========================================= >> "${logPath}"
echo.
echo Update failed! Check log: ${logPath}
notepad "${logPath}"
pause

:end
echo. >> "${logPath}"
echo Script finished at %date% %time% >> "${logPath}"
timeout /t 2 /nobreak > nul
del "%~f0"
`;
    
    fs.writeFileSync(scriptPath, script, 'utf-8');
    console.log('[Updater] Update script created:', scriptPath);
    return scriptPath;
}

/**
 * Применение отложенного обновления при запуске
 */
async function applyPendingUpdate() {
    const pendingPath = path.join(UPDATE_CONFIG.tempDir, 'pending-update.json');
    
    if (fs.existsSync(pendingPath)) {
        try {
            const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf-8'));
            
            if (pending.script && fs.existsSync(pending.script)) {
                console.log('[Updater] Applying pending update...');
                
                // Выполняем скрипт обновления
                const { spawn } = require('child_process');
                spawn('cmd.exe', ['/c', pending.script], {
                    detached: true,
                    stdio: 'ignore'
                }).unref();
                
                // Закрываем приложение чтобы скрипт мог обновить файлы
                app.quit();
                return true;
            }
        } catch (error) {
            console.error('[Updater] Failed to apply pending update:', error);
            // Очищаем неудачное обновление
            fs.unlinkSync(pendingPath);
        }
    }
    
    return false;
}

/**
 * Перезапуск приложения для применения обновления
 */
function restartToUpdate() {
    const pendingPath = path.join(UPDATE_CONFIG.tempDir, 'pending-update.json');
    
    if (fs.existsSync(pendingPath)) {
        try {
            const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf-8'));
            
            if (pending.script && fs.existsSync(pending.script)) {
                const { spawn } = require('child_process');
                spawn('cmd.exe', ['/c', pending.script], {
                    detached: true,
                    stdio: 'ignore'
                }).unref();
                
                app.quit();
            }
        } catch (error) {
            console.error('[Updater] Restart failed:', error);
        }
    }
}

/**
 * Сравнение версий
 */
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

/**
 * Форматирование байтов
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Регистрация IPC обработчиков
 */
function registerIPCHandlers() {
    // Проверка обновлений
    ipcMain.handle('updater:check', async () => {
        return await checkForUpdates(false);
    });
    
    // Скачивание обновления
    ipcMain.handle('updater:download', async () => {
        createUpdateWindow();
        await downloadAndInstallUpdate();
    });
    
    // Установка обновления (перезапуск)
    ipcMain.on('updater:install', () => {
        restartToUpdate();
    });
    
    // Пропустить обновление
    ipcMain.on('update:skip', () => {
        downloadAborted = true;
        if (updateWindow && !updateWindow.isDestroyed()) {
            updateWindow.close();
        }
    });
    
    // Перезапуск после обновления
    ipcMain.on('update:restart', () => {
        restartToUpdate();
    });
}

/**
 * Запуск периодической проверки обновлений
 */
function startPeriodicCheck() {
    setInterval(() => {
        checkForUpdates(false);
    }, UPDATE_CONFIG.checkInterval);
}

module.exports = {
    initUpdater,
    checkForUpdates,
    downloadAndInstallUpdate,
    applyPendingUpdate,
    createUpdateWindow,
    startPeriodicCheck
};
