@echo off
chcp 65001 > nul
title تشغيل منصة TecnoRexa - تكنوريكسا
color 0A

echo ==========================================================
echo       🚀 جاري تشغيل منصة TecnoRexa الذكية (Backend + Web)
echo ==========================================================
echo.

echo [1/3] تنظيف المنافذ وإغلاق أي عمليات سابقة معلقة (5000, 8081, 19006)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-NetTCPConnection -LocalPort 5000,8081,19006,3001 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
timeout /t 2 /nobreak > nul

echo [2/3] تشغيل خادم المنصة الموحد (الخادم والواجهة على منفذ 5000)...
cd /d "%~dp0"
start "TecnoRexa Unified Platform (5000)" cmd /k "chcp 65001 > nul && npm run server"

timeout /t 4 /nobreak > nul

echo [3/3] جاري فتح التطبيق في المتصفح تلقائياً...
start http://localhost:5000

echo.
echo ==========================================================
echo  ✅ تم تشغيل المنصة بنجاح!
echo  🌐 رابط المنصة على الكمبيوتر: http://localhost:5000
echo  📱 رابط المنصة من الهاتف (نفس شبكة الواي فاي): http://192.168.1.17:5000
echo ==========================================================
echo.
echo يمكنك إبقاء هذه النافذة أو تصغيرها في شريط المهام.
pause