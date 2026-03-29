@echo off
REM ============================================================
REM UTEAM Client Build Script for Windows
REM Builds React app and creates Electron installer
REM ============================================================

setlocal enabledelayedexpansion

REM Colors
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "RESET=[0m"

echo.
echo ============================================================
echo  UTEAM CLIENT BUILD SCRIPT
echo ============================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [91m✗ Node.js is not installed or not in PATH[0m
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo [92m✓ Node.js found: & node --version[0m
echo.

REM Navigate to client directory
cd /d "%~dp0client" || (
    echo [91m✗ Failed to navigate to client directory[0m
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo [93mInstalling dependencies...[0m
    call npm install
    if errorlevel 1 (
        echo [91m✗ npm install failed[0m
        exit /b 1
    )
    echo [92m✓ Dependencies installed[0m
) else (
    echo [92m✓ node_modules already exists[0m
)

echo.
echo [93m--- Building React app...[0m
set "REACT_APP_API_URL=http://72.56.236.196:3001/api"
call npm run react-build
if errorlevel 1 (
    echo [91m✗ React build failed[0m
    exit /b 1
)
echo [92m✓ React build completed[0m

echo.
echo [93m--- Building Electron installer...[0m
call npm run build
if errorlevel 1 (
    echo [91m✗ Electron build failed[0m
    exit /b 1
)
echo [92m✓ Electron build completed[0m

echo.
echo ============================================================
echo [92m✓ BUILD SUCCESSFUL![0m
echo ============================================================
echo.
echo Installer location: dist\UTEAM*.exe
echo Update package: dist\UTEAM-*-full.nupkg
echo.
pause
