<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

if ($argc !== 3 || !in_array($argv[2], ['nhan_vien', 'admin'], true)) {
    fwrite(STDERR, "Cách dùng: php server/scripts/create-account.php <ten_tai_khoan> <nhan_vien|admin>\n");
    exit(2);
}

$tenTaiKhoan = strtolower(trim($argv[1]));
if (!preg_match('/\A[a-z0-9._-]{3,32}\z/', $tenTaiKhoan)) {
    fwrite(STDERR, "Tên tài khoản không hợp lệ.\n");
    exit(2);
}

fwrite(STDOUT, 'Nhập mật khẩu (tối thiểu 12 ký tự): ');
$matKhau = rtrim((string) fgets(STDIN), "\r\n");
if (strlen($matKhau) < 12) {
    fwrite(STDERR, "\nMật khẩu phải có ít nhất 12 ký tự.\n");
    exit(2);
}

$taoKetNoi = require __DIR__ . '/../src/config/database.php';
require_once __DIR__ . '/../src/models/AuthData.php';
$authData = new AuthData($taoKetNoi());

if ($authData->tenTaiKhoanDaTonTai($tenTaiKhoan)) {
    fwrite(STDERR, "Tên tài khoản này đã tồn tại.\n");
    exit(1);
}

$authData->taoTaiKhoan($tenTaiKhoan, $matKhau, $argv[2]);
fwrite(STDOUT, "\nĐã tạo tài khoản {$argv[2]} ({$tenTaiKhoan}).\n");
