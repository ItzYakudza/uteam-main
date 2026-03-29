@echo off
chcp 65001 >nul
title UTEAM - Сервер
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              UTEAM - Запуск сервера                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Запуск API сервера на http://localhost:3001
echo.

cd server
npm run dev

pause
