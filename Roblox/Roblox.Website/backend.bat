@echo off
title Exoria - Backend
cd /d "%~dp0"
echo Building and starting the backend... output is saved to backend-log.txt
echo (this window stays quiet while it runs; the site is up once http://localhost/ loads)
dotnet run --configuration Release > "%~dp0backend-log.txt" 2>&1
echo.
echo ===== The backend stopped. Last output: =====
powershell -NoProfile -Command "Get-Content '%~dp0backend-log.txt' -Tail 40"
pause
