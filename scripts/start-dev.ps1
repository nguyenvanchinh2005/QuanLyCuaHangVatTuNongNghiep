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
    throw "Chua tim thay PHP CLI. Hay chay .\scripts\install-php.ps1."
  }
  $phpExe = Join-Path $goiPHP.FullName "php.exe"
}

$cacModule = & $phpExe -m
if ($LASTEXITCODE -ne 0) {
  throw "Khong chay duoc PHP. Kiem tra cai dat PHP trong PATH."
}
if ($cacModule -notcontains "pdo_mysql") {
  throw "PHP chua bat pdo_mysql. Bat extension=pdo_mysql trong php.ini roi mo terminal moi."
}

$tepEnv = Join-Path $thuMucDuAn ".env"
if (-not (Test-Path -LiteralPath $tepEnv)) {
  Copy-Item -LiteralPath (Join-Path $thuMucDuAn ".env.example") -Destination $tepEnv
  Write-Host "Da tao .env tu mau. Kiem tra cau hinh database truoc khi su dung."
}

$env:PATH = "$(Split-Path -Parent $phpExe);$env:PATH"
Push-Location $thuMucDuAn
try {
  Write-Host "Dang khoi chay Vuon Pho Dev Server tai http://127.0.0.1:8000..." -ForegroundColor Green
  & $phpExe -S 127.0.0.1:8000 -t (Join-Path $thuMucDuAn "public") (Join-Path $thuMucDuAn "server\router.php")
  if ($LASTEXITCODE -ne 0) {
    throw "May chu PHP ket thuc voi loi."
  }
} finally {
  Pop-Location
}
