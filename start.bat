@echo off
setlocal
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
    echo Fehler: Python wurde nicht gefunden.
    echo Bitte Python 3 installieren und erneut starten.
    pause
    exit /b 1
  )
)

echo.
echo   Schulprojekte - Localhost
echo   =========================
echo.
echo   Browser oeffnet sich gleich:
echo   -^> %URL%
echo.
echo   Projekte:
echo   * Le coin Internet     %URL%le-coin-internet/
echo   * Ultra-Cool Website   %URL%Projekte%%20Creative/
echo   * DayFlow              %URL%dayflow/
echo.
echo   Server laeuft... (Beenden mit Strg + C)
echo.

start "" "%URL%"
"%PYTHON%" -m http.server %PORT% --bind 127.0.0.1

endlocal
