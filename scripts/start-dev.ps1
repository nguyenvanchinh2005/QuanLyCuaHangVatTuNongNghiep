$ErrorActionPreference = "Stop"
$thuMucDuAn = Split-Path -Parent $PSScriptRoot

$phpCommand = Get-Command php -ErrorAction SilentlyContinue
if ($phpCommand) {
  $phpExe = $phpCommand.Source
} else {
  $thuMucGoi = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
  $goiPHP = Get-ChildItem -LiteralPath $thuMucGoi -Directory -Filter "PHP.PHP.8.4_*" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $goiPHP) {
    throw "Chưa tìm thấy PHP CLI. Chạy .\scripts\install-php.ps1."
  }
  $phpExe = Join-Path $goiPHP.FullName "php.exe"
}

$cacModule = & $phpExe -m
if ($LASTEXITCODE -ne 0) {
  throw "Không chạy được PHP. Kiểm tra cài đặt PHP trong PATH."
}
if ($cacModule -notcontains "pdo_mysql") {
  throw "PHP chưa bật pdo_mysql. Bật extension=pdo_mysql trong php.ini rồi mở terminal mới."
}

$tepEnv = Join-Path $thuMucDuAn ".env"
if (-not (Test-Path -LiteralPath $tepEnv)) {
  Copy-Item -LiteralPath (Join-Path $thuMucDuAn ".env.example") -Destination $tepEnv
  Write-Host "Đã tạo .env từ mẫu. Kiểm tra cấu hình database trước khi sử dụng."
}

$env:PATH = "$(Split-Path -Parent $phpExe);$env:PATH"
Push-Location $thuMucDuAn
try {
  & $phpExe -S 127.0.0.1:8000 -t (Join-Path $thuMucDuAn "public") (Join-Path $thuMucDuAn "server\router.php")
  if ($LASTEXITCODE -ne 0) {
    throw "Máy chủ PHP kết thúc với lỗi."
  }
} finally {
  Pop-Location
}
