#!/bin/bash

# UTEAM Webhook Handler
# Этот скрипт запускается через GitHub Webhook и инициирует развертывание
# Сохраните как: /usr/local/bin/uteam-webhook-handler.sh
# Chmod +x /usr/local/bin/uteam-webhook-handler.sh

DEPLOY_SCRIPT="/var/www/uteam/deploy.sh"
LOG_FILE="/var/www/uteam/logs/webhook.log"

mkdir -p $(dirname "$LOG_FILE")

# Логирование webhook запроса
{
    echo "=========================="
    echo "Webhook triggered at $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Request method: $REQUEST_METHOD"
    echo "Remote address: $REMOTE_ADDR"
    echo "Content type: $CONTENT_TYPE"
    echo "=========================="
} >> $LOG_FILE

# Запускаем скрипт развертывания в фоне
bash $DEPLOY_SCRIPT >> $LOG_FILE 2>&1 &

# Отправляем ответ
echo "Deployment started"
