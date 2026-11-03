@echo off
rem Longniang TRPG: manage API keys (Claude, DeepSeek, OpenRouter, relay). Double-click this file.
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found. Please install the LTS version from https://nodejs.org
  echo and then double-click api-keys.bat again.
  echo.
  pause
  exit /b 1
)
node scripts\keys.mjs
if errorlevel 1 pause
