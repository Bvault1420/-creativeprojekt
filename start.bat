@echo off
cd /d "%~dp0"

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

"%PYTHON%" "%~dp0server.py" %*
