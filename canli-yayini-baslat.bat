@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Polat ve Elif dugun yayini baslatiliyor...
node server.js
echo.
echo Program durdu. Hatayi okumak icin bu pencereyi acik birakabilirsin.
pause

