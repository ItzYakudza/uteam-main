@echo off
chcp 65001 >nul
title UTEAM - Клиент
color 0E

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              UTEAM - Запуск клиента                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Запуск Electron приложения...
echo.

cd client
npm run dev

pause
