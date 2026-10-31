$ErrorActionPreference = "Stop"

$thuMucGoi = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
$goiPHP = Get-ChildItem -LiteralPath $thuMucGoi -Directory -Filter "PHP.PHP.8.4_*" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $goiPHP) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "Không tìm thấy winget. Cài PHP 8.4 CLI từ https://www.php.net/downloads.php rồi mở terminal mới."
  }

  winget install --id PHP.PHP.8.4 --exact --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "Không cài được PHP 8.4 qua winget. Kiểm tra thông báo ở trên và thử lại."
  }
  $goiPHP = Get-ChildItem -LiteralPath $thuMucGoi -Directory -Filter "PHP.PHP.8.4_*" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

if (-not $goiPHP) {
  throw "Đã cài PHP nhưng không xác định được thư mục gói để bật pdo_mysql."
}

$tepIni = Join-Path $goiPHP.FullName "php.ini"
$tepMauIni = Join-Path $goiPHP.FullName "php.ini-development"
if (-not (Test-Path -LiteralPath $tepIni)) {
  Copy-Item -LiteralPath $tepMauIni -Destination $tepIni
}

$noiDungIni = Get-Content -Raw -LiteralPath $tepIni
if ($noiDungIni -notmatch '(?m)^\s*extension_dir\s*=') {
  Add-Content -LiteralPath $tepIni -Value "`nextension_dir = `"$($goiPHP.FullName -replace '\\', '/')/ext`"" -Encoding ascii
}
if ($noiDungIni -notmatch '(?m)^\s*extension\s*=\s*pdo_mysql\s*$') {
  Add-Content -LiteralPath $tepIni -Value "extension=pdo_mysql" -Encoding ascii
}

$env:PATH = "$($goiPHP.FullName);$env:PATH"
$modules = & (Join-Path $goiPHP.FullName "php.exe") -m
if ($LASTEXITCODE -ne 0 -or $modules -notcontains "pdo_mysql") {
  throw "PHP đã cài nhưng pdo_mysql chưa nạp được. Kiểm tra php.ini và thư mục ext."
}

Write-Host "Đã cài PHP CLI và bật pdo_mysql. Mở PowerShell mới rồi chạy: php -v"
