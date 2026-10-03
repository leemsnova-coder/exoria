@echo off
title Exoria launcher
set "ROOT=%~dp0"
if not exist "%ROOT%Roblox\Roblox.Website\Program.cs" set "ROOT=%USERPROFILE%\Downloads\exoria-website\"
echo Exoria folder: %ROOT%
echo.

if not exist "%ROOT%Roblox\Roblox.Website\appsettings.json" echo MISSING: Roblox\Roblox.Website\appsettings.json

rem --- First-run setup for a freshly unzipped copy ---
if not exist "%ROOT%2016-roblox-main\config.json" powershell -NoProfile -Command "(Get-Content '%ROOT%2016-roblox-main\config.example.json') -replace 'https://your.domain/','http://localhost/' | Set-Content '%ROOT%2016-roblox-main\config.json'"
for %%D in ("api\storage\asset" "api\storage\economy-chat" "api\public\images\thumbnails" "api\public\images\groups") do if not exist "%ROOT%%%~D" mkdir "%ROOT%%%~D"
if not exist "%ROOT%Roblox\Roblox.Website\appsettings.json" echo WARNING: appsettings.json is missing in Roblox\Roblox.Website - the backend will not start.

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
start "Exoria - Frontend" /D "%ROOT%2016-roblox-main" cmd /k "(if not exist node_modules npm install --legacy-peer-deps) & set NODE_OPTIONS=--openssl-legacy-provider&& npm run dev"

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
