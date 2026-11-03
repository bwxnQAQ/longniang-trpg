@echo off
rem Longniang TRPG: one-click start. Double-click this file.
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found. Please install the LTS version from https://nodejs.org
  echo and then double-click start.bat again.
  echo.
  pause
  exit /b 1
)
node scripts\start.mjs
if errorlevel 1 pause
