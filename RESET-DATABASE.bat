@echo off
title Exoria - Reset database
set "ROOT=%~dp0"
if not exist "%ROOT%api\sql\schema.sql" set "ROOT=%USERPROFILE%\Downloads\exoria-website\"
set "PGBIN=C:\Program Files\PostgreSQL\18\bin"
set "REDISCLI=%USERPROFILE%\Downloads\redis-x64-5.0.14.1\redis-cli.exe"

echo ============================================================
echo  This DELETES every account, item, game and post on your
echo  local Exoria site and starts over with an empty database.
echo  It cannot be undone.
echo ============================================================
echo.
echo First close the "Exoria - Backend" window if it is open.
echo.
set /p CONFIRM=Type YES to reset everything: 
if /I not "%CONFIRM%"=="YES" (
  echo Cancelled. Nothing was changed.
  pause
  exit /b
)
if not exist "%PGBIN%\psql.exe" (
  echo Could not find PostgreSQL in "%PGBIN%".
  pause
  exit /b
)
set /p PGPASSWORD=Your PostgreSQL password: 

echo.
echo Deleting the old database...
"%PGBIN%\dropdb.exe" -U postgres --if-exists --force exoria
if errorlevel 1 (
  echo Could not delete the database. Is the password right, and is the backend window closed?
  pause
  exit /b
)
echo Creating a fresh database...
"%PGBIN%\createdb.exe" -U postgres exoria || (echo Could not create the database. & pause & exit /b)
echo Loading the tables...
"%PGBIN%\psql.exe" -U postgres -d exoria -q -f "%ROOT%api\sql\schema.sql" >nul 2>"%ROOT%reset-log.txt"

echo Clearing Redis (sessions, cooldowns)...
if exist "%REDISCLI%" (
  "%REDISCLI%" FLUSHALL
) else (
  echo redis-cli.exe not found - close and reopen the Redis window instead.
)

set PGPASSWORD=
echo.
echo Done. Everything is reset.
echo Clear your browser's cookies for localhost (or use a private window),
echo then run START-ALL.bat again.
pause
