#!/bin/bash

# UTEAM Deployment Script
# Скрипт для автоматического развертывания приложения с GitHub
# Используется с GitHub Webhooks и Cron

DEPLOY_PATH="/var/www/uteam"
BRANCH="main"  # Измените на вашу основную ветку (main, master, develop и т.д.)
LOG_FILE="/var/www/uteam/logs/deploy.log"

# Функция для логирования
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# Функция для ошибок
log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> $LOG_FILE
}

# Создаем директорию для логов если её нет
mkdir -p $(dirname "$LOG_FILE")

log_message "=========================================="
log_message "Начало развертывания UTEAM"
log_message "=========================================="

# Переходим в директорию приложения
cd $DEPLOY_PATH || { log_error "Не удалось перейти в $DEPLOY_PATH"; exit 1; }

# Сохраняем текущий коммит
CURRENT_COMMIT=$(git rev-parse HEAD)
log_message "Текущий коммит: $CURRENT_COMMIT"

# Получаем последние обновления с GitHub
log_message "Получение обновлений с GitHub..."
git fetch origin >> $LOG_FILE 2>&1 || { log_error "Ошибка при git fetch"; exit 1; }

# Получаем последний коммит с GitHub для нужной ветки
REMOTE_COMMIT=$(git rev-parse origin/$BRANCH)
log_message "Последний коммит на GitHub ($BRANCH): $REMOTE_COMMIT"

# Если есть новые обновления
if [ "$CURRENT_COMMIT" != "$REMOTE_COMMIT" ]; then
    log_message "Найдены новые обновления! Начинаем развертывание..."
    
    # Проверяем, не запущено ли уже развертывание
    if [ -f "$DEPLOY_PATH/.deploy.lock" ]; then
        log_error "Развертывание уже запущено. Пропускаем..."
        exit 1
    fi
    
    # Создаем блокировку
    touch "$DEPLOY_PATH/.deploy.lock"
    
    # Останавливаем PM2 приложение
    log_message "Остановка PM2 приложения..."
    pm2 stop uteam-server >> $LOG_FILE 2>&1
    sleep 2
    
    # Резервная копия перед развертыванием (опционально)
    log_message "Создание резервной копии..."
    cp -r $DEPLOY_PATH/server/uploads $DEPLOY_PATH/backups/uploads_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    
    # Стягиваем новые изменения
    log_message "Загрузка новых изменений..."
    git reset --hard origin/$BRANCH >> $LOG_FILE 2>&1 || { 
        log_error "Ошибка при git reset"; 
        rm -f "$DEPLOY_PATH/.deploy.lock"
        exit 1; 
    }
    log_message "Новые изменения загружены успешно"
    
    # Устанавливаем зависимости (если они изменились)
    log_message "Установка зависимостей сервера..."
    cd $DEPLOY_PATH/server
    npm install --production >> $LOG_FILE 2>&1
    if [ $? -eq 0 ]; then
        log_message "Зависимости установлены успешно"
    else
        log_error "Ошибка при установке зависимостей"
        rm -f "$DEPLOY_PATH/.deploy.lock"
        exit 1
    fi
    
    # Перезагружаем PM2 приложение
    log_message "Перезагрузка PM2 приложения..."
    cd $DEPLOY_PATH
    pm2 restart uteam-server >> $LOG_FILE 2>&1
    sleep 3
    
    # Проверяем, что приложение запустилось
    if pm2 status uteam-server | grep -q "online"; then
        log_message "✓ Развертывание завершено успешно"
        log_message "✓ PM2 приложение перезагружено и работает"
    else
        log_error "Приложение не запустилось после развертывания!"
        pm2 logs uteam-server >> $LOG_FILE 2>&1
        rm -f "$DEPLOY_PATH/.deploy.lock"
        exit 1
    fi
    
    # Удаляем блокировку
    rm -f "$DEPLOY_PATH/.deploy.lock"
    
    log_message "=========================================="
    
    # Отправляем уведомление в Discord (опционально)
    # Раскомментируйте и добавьте ваш Discord webhook URL
    # DISCORD_WEBHOOK="YOUR_DISCORD_WEBHOOK_URL"
    # curl -X POST -H 'Content-type: application/json' \
    #     --data '{"content":"✅ UTEAM Server successfully deployed!\nCommit: '"$REMOTE_COMMIT"'"}' \
    #     "$DISCORD_WEBHOOK"
    
else
    log_message "Нет новых обновлений. Развертывание пропущено."
    log_message "=========================================="
fi

echo "" >> $LOG_FILE
