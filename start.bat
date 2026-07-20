@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set PORT=8080
set LOCAL_URL=http://127.0.0.1:%PORT%/

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  set PYTHON=python
) else (
  where python3 >nul 2>&1
  if %ERRORLEVEL%==0 (
    set PYTHON=python3
  ) else (
    echo Fehler: Python wurde nicht gefunden.
    echo Bitte Python 3 installieren und erneut starten.
    pause
    exit /b 1
  )
)

REM LAN-IP fuer Tablet ermitteln
set LAN_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set "CAND=%%a"
  set "CAND=!CAND: =!"
  echo !CAND! | findstr /r "^192\.|^10\.|^172\." >nul
  if !ERRORLEVEL!==0 if not defined LAN_IP set "LAN_IP=!CAND!"
)

if defined LAN_IP (
  set "TABLET_URL=http://!LAN_IP!:%PORT%/"
) else (
  set "TABLET_URL=(IP nicht gefunden - in ipconfig nachschauen)"
)

echo !TABLET_URL!> ".tablet-url.txt"

echo.
echo   Schulprojekte - Localhost (PC + Tablet)
echo   =======================================
echo.
echo   Am Computer (Browser oeffnet sich):
echo   -^> %LOCAL_URL%
echo.
echo   Am Tablet / iPad (Safari, gleiches WLAN):
echo   -^> !TABLET_URL!
echo.
echo   So geht's auf dem Tablet:
echo   1. Tablet und Computer im gleichen WLAN
echo   2. Safari oeffnen
echo   3. Oben die Adresse eingeben
echo   4. Fertig - Seite waehlen
echo.
echo   Server laeuft im ganzen WLAN... (Beenden mit Strg + C)
echo.

start "" "%LOCAL_URL%"
"%PYTHON%" -m http.server %PORT% --bind 0.0.0.0

endlocal
