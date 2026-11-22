@echo off
setlocal
cd /d "%~dp0"
if exist "dist\PrismLab-0.8.1.exe" (
  start "" "dist\PrismLab-0.8.1.exe"
  exit /b 0
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1"
if errorlevel 1 pause
endlocal
