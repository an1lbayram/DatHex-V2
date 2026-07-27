@echo off
title DatHex V2
color 0B
echo  ******************************************************
echo                       DatHex V2
echo               ^</^> Created by an1lbayram
echo  ******************************************************
echo.

cd /d "%~dp0server"
if not exist "node_modules" (
    echo [~] Sunucu bagimliliklari yukleniyor...
    call npm install
)

cd /d "%~dp0client"
if not exist "dist" (
    echo [~] Istemci uygulamasi derleniyor...
    if not exist "node_modules" call npm install
    call npm run build
)

echo [~] DatHex arka plan servisi baslatiliyor...
cd /d "%~dp0server"
start /B node index.js
echo [i] Sunucu baslatildi (http://localhost:3001)
echo [~] Arayuz tarayicida aciliyor...
timeout /t 2 >nul
start http://localhost:3001
echo.
echo [+] DatHex V2 basariyla calisiyor.
echo [!] Cikmak icin bu pencereyi kapatabilirsiniz.
pause >nul
