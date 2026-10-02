@echo off
title Exoria website (test)
cd /d "%~dp0\2016-roblox-main"

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed.
  echo Install the LTS version from https://nodejs.org then run this file again.
  echo.
  start https://nodejs.org
  pause
  exit /b
)

if not exist config.json (
  powershell -NoProfile -Command "(Get-Content config.example.json) -replace 'https://your.domain/','http://localhost:3000/' | Set-Content config.json"
)

if not exist node_modules (
  echo Installing packages, this takes a few minutes the first time...
  call npm install --legacy-peer-deps
)

set NODE_OPTIONS=--openssl-legacy-provider
echo.
echo Starting... your browser will open at http://localhost:3000/login
echo Close this window to stop the website.
echo.
start "" cmd /c "timeout /t 12 >nul & start http://localhost:3000/login"
call npm run dev
pause
