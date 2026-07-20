@echo off
REM Doppelklick (Windows): startet einen Localhost und oeffnet direkt "Le coin Internet".
cd /d "%~dp0"

set PORT=8080
set URL=http://localhost:%PORT%/le-coin-internet/

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  set PY=python
) else (
  where python3 >nul 2>&1
  if %ERRORLEVEL%==0 (
    set PY=python3
  ) else (
    echo Python 3 wird benoetigt. Bitte installieren: https://www.python.org/downloads/
    pause
    exit /b 1
  )
)

echo.
echo   Le coin Internet
echo   ----------------
echo   Oeffnet sich im Browser: %URL%
echo   Beenden: dieses Fenster schliessen oder Strg + C
echo.

start "" "%URL%"
"%PY%" -m http.server %PORT%
