@echo off
title DatHex v2.0
color 0B
echo  ******************************************************
echo                       DatHex v2.0
echo               ^</^> Created by an1lbayram
echo  ******************************************************
echo.
echo [~] DatHex arka plan servisi baŸlatlyor...
cd server
start /B node index.js
echo [i] Sunucu baŸlatld (http://localhost:3001)
echo [~] Arayz taraycda a‡lyor...
timeout /t 2 >nul
start http://localhost:3001
echo.
echo [+] DatHex 2.0 baŸaryla ‡alŸyor.
echo [!] €kmak i‡in bu pencereyi kapatabilirsiniz.
pause >nul
