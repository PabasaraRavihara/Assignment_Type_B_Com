@echo off
title Ashadi Jewellers — Labour Cost & Production Management System
color 06

echo ======================================================================
echo    ASHADI JEWELLERS — PRODUCTION & LABOUR COSTING SYSTEM
echo ======================================================================
echo.
echo [1/3] Starting Backend Server (Port 5000)...
start "Ashadi Jewellers - Backend API" cmd /k "cd /d C:\Users\pabas\Desktop\Personal\Assignment_Job\server && node index.js"

echo [2/3] Waiting for Backend to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Client UI (Port 5173)...
start "Ashadi Jewellers - Frontend UI" cmd /k "cd /d C:\Users\pabas\Desktop\Personal\Assignment_Job\client && npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo.
echo [DONE] Opening Management Dashboard in your browser...
start http://localhost:5173

echo.
echo ======================================================================
echo  System is running smoothly! 
echo  Keep the two small terminal windows minimized while working.
echo ======================================================================
timeout /t 5 >nul
exit
