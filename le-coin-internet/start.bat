@echo off
cd /d "%~dp0"
set PORT=8080
echo.
echo   Le coin Internet - Localhost
echo   =============================
echo.
echo   Oeffne im Browser:
echo   -^> http://localhost:%PORT%
echo.
echo   Beenden mit: Strg + C
echo.
python -m http.server %PORT%
pause
