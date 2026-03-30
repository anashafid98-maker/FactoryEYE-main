@echo off
echo ========================================
echo FactoryEYE Simulation Server
echo ========================================
echo.

cd /d "%~dp0SearchEngine\src"

echo Starting Simulation Server...
echo This generates REAL vibration data with REAL KPI calculations
echo.
echo KPIs calculated: RMS, Peak, Peak-to-Peak, Crest Factor, Kurtosis, Skewness
echo Frequency bands: 0-10Hz, 10-100Hz, 100-500Hz, 500-1000Hz
echo.
echo API available at: http://localhost:5000
echo.

python simulation_server.py

pause

