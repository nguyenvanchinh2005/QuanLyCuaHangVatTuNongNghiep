<?php
declare(strict_types=1);

// =============================================================================
// LUỒNG KẾT NỐI CƠ SỞ DỮ LIỆU (DATABASE CONNECTION)
// =============================================================================
// Hàm factory trả về một đối tượng PDO đã được cấu hình bảo vệ và chuẩn hóa truy vấn.
return static function (): PDO {
    // 1. Xác định đường dẫn file cấu hình môi trường .env tại thư mục gốc dự án
    $tepCauHinh = dirname(__DIR__, 3) . '/.env';
    $cauHinh = [];

    // 2. Đọc file .env nếu tồn tại
    if (is_file($tepCauHinh)) {
        $cauHinh = parse_ini_file($tepCauHinh, false, INI_SCANNER_RAW);
        if ($cauHinh === false) {
            throw new RuntimeException('Không thể đọc cấu hình .env ở thư mục gốc dự án.');
        }
    }

    // 3. Hàm tiện ích lấy biến môi trường: ưu tiên biến hệ thống, sau đó đến .env, cuối cùng là giá trị mặc định
    $docCauHinh = static function (string $ten, string $macDinh = '') use ($cauHinh): string {
        $giaTriMoiTruong = getenv($ten);
        return $giaTriMoiTruong !== false ? $giaTriMoiTruong : (string) ($cauHinh[$ten] ?? $macDinh);
    };

    // 4. Thiết lập các thông số kết nối MySQL
    $mayChu = $docCauHinh('DB_HOST', '127.0.0.1');
    $cong = $docCauHinh('DB_PORT', '3306');
    $tenCoSoDuLieu = $docCauHinh('DB_NAME', 'quanlycuahangvattunongnghiep');
    $nguoiDung = $docCauHinh('DB_USER', 'root');
    $matKhau = $docCauHinh('DB_PASSWORD');

    // 5. Khởi tạo đối tượng PDO với các thuộc tính an toàn (ném Exception, dùng mảng kết hợp, chống SQL Injection)
    return new PDO(
        "mysql:host={$mayChu};port={$cong};dbname={$tenCoSoDuLieu};charset=utf8mb4",
        $nguoiDung,
        $matKhau,
        [
            // Ném ngoại lệ khi có lỗi SQL để kích hoạt rollback trong transaction
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            // Trả kết quả truy vấn dưới dạng mảng kết hợp (key là tên cột)
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Sử dụng native prepared statements của MySQL, tắt giả lập để bảo vệ triệt để
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
};
