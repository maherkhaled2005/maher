@echo off
chcp 65001 > nul
title تشغيل منصة TecnoRexa - تكنوريكسا
color 0A

echo ==========================================================
echo       🚀 جاري تشغيل منصة TecnoRexa الذكية (Backend + Web)
echo ==========================================================
echo.

echo [1/4] تنظيف المنافذ وإغلاق أي عمليات سابقة معلقة (8081, 19006, 3001)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-NetTCPConnection -LocalPort 8081,19006,3001 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
timeout /t 2 /nobreak > nul

echo [2/4] تشغيل الخادم الخلفي (Backend Server على منفذ 8081)...
cd /d "c:\Users\mylap\Desktop\ooo2"
start "TecnoRexa Backend (8081)" cmd /k "chcp 65001 > nul && npm run server"

timeout /t 3 /nobreak > nul

echo [3/4] تشغيل واجهة الويب (Expo Web على منفذ 19006)...
cd /d "c:\Users\mylap\Desktop\ooo2\mobile"
start "TecnoRexa Web Frontend (19006)" cmd /k "chcp 65001 > nul && npx expo start --web --port 19006"

echo.
echo [4/4] جاري فتح التطبيق في المتصفح تلقائياً...
timeout /t 5 /nobreak > nul
start http://localhost:19006

echo.
echo ==========================================================
echo  ✅ تم تشغيل المنصة بنجاح!
echo  🌐 رابط الويب على الكمبيوتر: http://localhost:19006
echo  📱 رابط الويب من الهاتف: http://192.168.1.6:19006
echo ==========================================================
echo.
echo يمكنك إبقاء هذه النافذة أو تصغيرها في شريط المهام.
pause