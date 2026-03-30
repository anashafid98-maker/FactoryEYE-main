@echo off
echo ========================================
echo FactoryEYE - Real-time Data Server (SIMULATION MODE)
echo ========================================
echo.
echo This will start the real-time data server in SIMULATION MODE
echo generating fake data without requiring a PLC connection.
echo.
echo Make sure you have Python dependencies installed:
echo   pip install flask flask-cors numpy scipy pyodbc opcua
echo.

cd /d "%~dp0SearchEngine\src"

echo Starting Real-time Server on port 5000 in SIMULATION MODE...
echo.
set SIMULATION_MODE=1
python realtime_spectrum.py

pause

