@echo off
title SmritiNER - Clinical Cognitive Platform for Elderly Dementia Care
color 0A

echo ===============================================================================
echo                SmritiNER (smritiNER) - Digital Cognitive Therapeutics
echo     AI-Powered Memory & Neuro-Cognitive Platform for North East India
echo ===============================================================================
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    echo Please wait a moment...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install dependencies. Please check your Node.js setup.
        pause
        exit /b %errorlevel%
    )
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

echo [INFO] Launching Vite platform server...
echo [INFO] Opening SmritiNER in your browser at http://localhost:5173 ...
echo.

:: Launch browser after 2 seconds
start "" http://localhost:5173

:: Start the Vite server
call npm run dev

pause
