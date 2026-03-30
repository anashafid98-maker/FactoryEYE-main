@echo off
echo ========================================
echo FactoryEYE - Stats API Server
echo ========================================
echo.
echo This will start the stats API server on port 5001
echo that provides statistical endpoints for the frontend.
echo.
echo Make sure you have Python dependencies installed:
echo   pip install flask flask-cors pandas numpy pyodbc
echo.

cd /d "%~dp0SearchEngine\src"

echo Starting Stats API Server on port 5001...
echo.
python stats_aggregator.py

pause
