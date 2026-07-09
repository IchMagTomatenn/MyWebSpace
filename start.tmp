@echo off
setlocal enableextensions
chcp 65001 >nul
cd /d "%~dp0"

REM ============================================================
REM  mywebspace - Developer Portal: Start-Skript (Windows)
REM  Doppelklick startet das Menue. Alternativ per Argument:
REM    start.bat dev     -> Dev-Server (Hot Reload)
REM    start.bat prod    -> Build + Produktions-Server
REM    start.bat build   -> Nur Build
REM ============================================================

set "PORT=4321"

REM --- Node pruefen ---
where node >nul 2>nul
if errorlevel 1 (
  echo [Fehler] Node.js nicht gefunden.
  echo Bitte Node.js installieren: https://nodejs.org/
  pause
  exit /b 1
)

REM --- Dependencies pruefen ---
if not exist "node_modules" (
  echo [Info] node_modules fehlt - installiere Dependencies ...
  call npm install
  if errorlevel 1 (
    echo [Fehler] npm install fehlgeschlagen.
    pause
    exit /b 1
  )
)

REM --- .env pruefen ---
if not exist ".env" (
  echo [Info] .env fehlt - kopiere von .env.example ...
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo [Hinweis] .env erstellt. Bitte DATABASE_URL und BETTER_AUTH_SECRET setzen.
  ) else (
    echo [Warnung] .env.example fehlt ebenfalls - fahre ohne .env fort.
  )
)

REM --- Direktaufruf per Argument? ---
set "ARG=%~1"
if /i "%ARG%"=="dev"   goto dev
if /i "%ARG%"=="prod"  goto prod
if /i "%ARG%"=="build" goto buildonly

:menu
cls
echo.
echo  mywebspace - Developer Portal
echo  -----------------------------
echo  1) Dev-Server          (Hot Reload, Port %PORT%)
echo  2) Build + Prod-Server  (Port %PORT%)
echo  3) Nur Build
echo  4) Beenden
echo.
set "wahl="
set /p "wahl=Auswahl: "

if "%wahl%"=="1" goto dev
if "%wahl%"=="2" goto prod
if "%wahl%"=="3" goto buildonly
if "%wahl%"=="4" goto end
echo [Fehler] Falsche Eingabe.
ping -n 3 127.0.0.1 >nul
goto menu

:dev
echo.
echo [Dev-Server] http://localhost:%PORT%
echo (Strg+C zum Beenden)
echo.
call npx astro dev --port %PORT%
pause
goto menu

:prod
echo.
echo [Build] Erzeuge Produktions-Build ...
call npm run build
if errorlevel 1 (
  echo [Fehler] Build fehlgeschlagen.
  pause
  goto menu
)
echo.
echo [Prod-Server] http://localhost:%PORT%
echo (Strg+C zum Beenden)
echo.
call npm start
pause
goto menu

:buildonly
echo.
call npm run build
if errorlevel 1 (
  echo [Fehler] Build fehlgeschlagen.
) else (
  echo [OK] Build fertig in dist\
)
pause
goto menu

:end
endlocal
exit /b 0
