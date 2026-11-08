<?php
declare(strict_types=1);

return static function (): PDO {
    $tepCauHinh = dirname(__DIR__, 3) . '/.env';
    $cauHinh = [];

    if (is_file($tepCauHinh)) {
        $cauHinh = parse_ini_file($tepCauHinh, false, INI_SCANNER_RAW);
        if ($cauHinh === false) {
            throw new RuntimeException('Không thể đọc cấu hình .env ở thư mục gốc dự án.');
        }
    }

    $docCauHinh = static function (string $ten, string $macDinh = '') use ($cauHinh): string {
        $giaTriMoiTruong = getenv($ten);
        return $giaTriMoiTruong !== false ? $giaTriMoiTruong : (string) ($cauHinh[$ten] ?? $macDinh);
    };

    $mayChu = $docCauHinh('DB_HOST', '127.0.0.1');
    $cong = $docCauHinh('DB_PORT', '3306');
    $tenCoSoDuLieu = $docCauHinh('DB_NAME', 'quanlycuahangvattunongnghiep');
    $nguoiDung = $docCauHinh('DB_USER', 'root');
    $matKhau = $docCauHinh('DB_PASSWORD');

    return new PDO(
        "mysql:host={$mayChu};port={$cong};dbname={$tenCoSoDuLieu};charset=utf8mb4",
        $nguoiDung,
        $matKhau,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
};
