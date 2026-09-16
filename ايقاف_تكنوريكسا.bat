@echo off
chcp 65001 > nul
title إيقاف منصة TecnoRexa
color 0C

echo ==========================================================
echo       🛑 جاري إيقاف جميع خوادم وعمليات TecnoRexa...
echo ==========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-NetTCPConnection -LocalPort 8081,19006,3001 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
taskkill /F /FI "WINDOWTITLE eq TecnoRexa*" 2>nul

echo.
echo ✅ تم إيقاف جميع الخوادم وتحرير المنافذ بنجاح!
echo.
timeout /t 3 > nul