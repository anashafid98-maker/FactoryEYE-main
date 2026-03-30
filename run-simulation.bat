@echo off
echo ========================================
echo FactoryEYE PLC-to-SPL Simulation
echo ========================================
echo.
echo This script runs plc_to_spl.py in simulation mode
echo It generates REAL vibration signals with REAL KPI calculations
echo.

cd /d "%~dp0SearchEngine\src"

echo Starting PLC-to-SPL in simulation mode...
echo API will be available at: http://localhost:5000
echo.

python plc_to_spl.py

pause

