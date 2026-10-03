@echo off
title Exoria launcher
set "ROOT=%~dp0"
if not exist "%ROOT%Roblox\Roblox.Website\Program.cs" set "ROOT=%USERPROFILE%\Downloads\exoria-website\"
echo Exoria folder: %ROOT%
echo.

if not exist "%ROOT%Roblox\Roblox.Website\appsettings.json" echo MISSING: Roblox\Roblox.Website\appsettings.json
if not exist "%ROOT%2016-roblox-main\config.json" echo MISSING: 2016-roblox-main\config.json

rem --- Make the frontend images available through the backend (/img) ---
robocopy "%ROOT%2016-roblox-main\public\img" "%ROOT%api\public\img" /E /XC /XN /XO /NFL /NDL /NJH /NJS /NP >nul

rem --- Redis ---
tasklist /FI "IMAGENAME eq redis-server.exe" | find /I "redis-server.exe" >nul
if not errorlevel 1 goto redis_ok
if exist "%USERPROFILE%\Downloads\redis-x64-5.0.14.1\redis-server.exe" (
  start "Exoria - Redis" /D "%USERPROFILE%\Downloads\redis-x64-5.0.14.1" redis-server.exe
) else (
  echo Redis is not running. Start redis-server.exe yourself, then run this again.
)
:redis_ok

rem --- Backend ---
start "Exoria - Backend" /D "%ROOT%Roblox\Roblox.Website" backend.bat

rem --- Frontend ---
start "Exoria - Frontend" /D "%ROOT%2016-roblox-main" cmd /k "set NODE_OPTIONS=--openssl-legacy-provider&& npm run dev"

echo Started the Backend and Frontend windows.
echo Waiting for the site to come up (the backend takes a minute or two the first time)...
echo.

:wait
timeout /t 5 /nobreak >nul
powershell -NoProfile -Command "try { $null = Invoke-WebRequest http://localhost/ -UseBasicParsing -TimeoutSec 4 -MaximumRedirection 0 -ErrorAction Stop; exit 0 } catch { if ($_.Exception.Response) { exit 0 } else { exit 1 } }"
if errorlevel 1 goto wait
start "" http://localhost/
echo Exoria is running at http://localhost/
echo You can close this window. Keep the Backend, Frontend and Redis windows open.
pause
