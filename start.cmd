@echo off
cd /d "%~dp0"
where python >nul 2>nul || (echo Python 3.12+ is required: https://www.python.org/downloads/ & pause & exit /b 1)
where npm >nul 2>nul || (echo Node.js 20+ is required: https://nodejs.org/ & pause & exit /b 1)
python run.py %*
if errorlevel 1 pause
