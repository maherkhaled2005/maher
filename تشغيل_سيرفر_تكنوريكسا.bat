@echo off
chcp 65001 > nul
title TecnoRexa - تشغيل السيرفر والنفق السحابي
echo ====================================================
echo 🚀 جاري تشغيل سيرفر تكنوريكسا والنفق السحابي للموبايل...
echo ====================================================

cd /d "%~dp0"

echo 1. تشغيل سيرفر Node.js (Port 5000)...
start "TecnoRexa Backend Server" /min cmd /k "npm run dev"

timeout /t 3 > nul

echo 2. تشغيل النفق السحابي Cloudflare...
start "TecnoRexa Cloudflare Tunnel" cmd /k "npx cloudflared tunnel --protocol http2 --url http://localhost:5000"

echo.
echo ✅ اكتمل التشغيل! السيرفر والنفق السحابي يعملان الآن في الخلفية.
echo يمكنك الآن فتح التطبيق على الهاتف وتجربة كل الرتب والتسجيل بسلاسة.
echo (اترك هذه النوافذ مفتوحة أثناء تجربة التطبيق على الهاتف).
pause
