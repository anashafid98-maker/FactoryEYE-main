@echo off
echo ========================================
echo FactoryEYE - Real-time Data Server
echo ========================================
echo.
echo This will start the real-time data server
echo that provides API endpoints for the visualization.
echo.
echo Make sure you have Python dependencies installed:
echo   pip install flask flask-cors numpy scipy pyodbc
echo.

cd /d "%~dp0SearchEngine\src"

echo Starting Real-time Server on port 5000...
echo.
python realtime_spectrum.py

pause

