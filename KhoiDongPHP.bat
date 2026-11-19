
@echo off
title PHP Server - Quan Ly Cua Hang Vat Tu Nong Nghiep

cd /d C:\QuanLyCuaHangVatTuNongNghiep

echo Dang khoi dong PHP Server...
echo.

C:\PHP\PHP\php.exe -S 127.0.0.1:8000 -t public server/router.php

pause
