@echo off
echo ========================================
echo FactoryEYE API Server Starter
echo ========================================
echo.

cd /d "%~dp0backend"

echo Installing dependencies...
call npm install

if errorlevel 1 (
    echo Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Starting FactoryEYE API Server...
echo Server will run on http://localhost:5000
echo.

node server.js

pause

