@echo off
cd /d "%~dp0"

set PORT=8080
set URL=http://127.0.0.1:%PORT%/

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  set PYTHON=python
) else (
  where python3 >nul 2>&1
  if %ERRORLEVEL%==0 (
    set PYTHON=python3
  ) else (
    echo Fehler: Python 3 fehlt. Bitte Python installieren.
    pause
    exit /b 1
  )
)

echo.
echo   Le coin Internet
echo   ================
echo.
echo   Browser oeffnet sich gleich:
echo   -^> %URL%
echo.
echo   Beenden: Strg + C
echo.

start "" "%URL%"
"%PYTHON%" -m http.server %PORT% --bind 127.0.0.1
