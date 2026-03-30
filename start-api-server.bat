@echo off
echo ========================================
echo FactoryEYE API Server Starter
echo ========================================
echo.

cd /d "%~dp0frontend"

echo Checking if Node.js dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting FactoryEYE API Server...
echo The server will connect to your FactoryEYE SQL database
echo.

node server.js

pause

