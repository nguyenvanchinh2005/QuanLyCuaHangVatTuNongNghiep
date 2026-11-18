<?php
declare(strict_types=1);

/**
 * Migration CLI: Cập nhật cấu trúc bảng hoadon và cthoadon hỗ trợ đặt hàng trực tuyến.
 * 
 * Cách chạy:
 *   php server/scripts/order-migration.php
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

$taoKetNoi = require __DIR__ . '/../src/config/database.php';
$db = $taoKetNoi();

echo "=== MIGRATION: ĐỒNG BỘ HOADON & CTHOADON ===\n";

$cols = $db->query("SHOW COLUMNS FROM hoadon")->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('TenNguoiNhan', $cols, true)) {
    echo "1. Thêm các cột mới vào hoadon...\n";
    $db->exec("ALTER TABLE `hoadon`
      ADD COLUMN `TenNguoiNhan` VARCHAR(100) NULL AFTER `MaNv`,
      ADD COLUMN `SDTNhan` VARCHAR(20) NULL AFTER `TenNguoiNhan`,
      ADD COLUMN `DiaChiGiao` VARCHAR(255) NULL AFTER `SDTNhan`,
      ADD COLUMN `PhuongThucThanhToan` VARCHAR(50) NOT NULL DEFAULT 'cod' AFTER `DiaChiGiao`,
      ADD COLUMN `TrangThai` VARCHAR(50) NOT NULL DEFAULT 'cho_xac_nhan' AFTER `PhuongThucThanhToan`,
      ADD COLUMN `TrangThaiThanhToan` VARCHAR(50) NOT NULL DEFAULT 'cho_thanh_toan' AFTER `TrangThai`,
      ADD COLUMN `NgayThanhToan` DATETIME NULL AFTER `TrangThaiThanhToan`,
      ADD COLUMN `NgayHoanTien` DATETIME NULL AFTER `NgayThanhToan`");
    echo "   -> Đã thêm cột thành công!\n";
} else {
    echo "1. Các cột TenNguoiNhan, SDTNhan, DiaChiGiao,... đã tồn tại trong hoadon.\n";
}

$maHdCol = $db->query("SHOW COLUMNS FROM hoadon LIKE 'MaHD'")->fetch(PDO::FETCH_ASSOC);
if (is_array($maHdCol) && str_contains(strtolower((string) $maHdCol['Type']), 'varchar(6)')) {
    echo "2. Mở rộng MaHD lên VARCHAR(20)...\n";
    $db->exec("ALTER TABLE `cthoadon` DROP FOREIGN KEY `FK_cthoadon_hoadon`");
    $db->exec("ALTER TABLE `hoadon` MODIFY COLUMN `MaHD` VARCHAR(20) NOT NULL");
    $db->exec("ALTER TABLE `cthoadon` MODIFY COLUMN `MaHD` VARCHAR(20) NOT NULL");
    $db->exec("ALTER TABLE `cthoadon` ADD CONSTRAINT `FK_cthoadon_hoadon` FOREIGN KEY (`MaHD`) REFERENCES `hoadon` (`MaHD`) ON DELETE CASCADE");
    echo "   -> Đã mở rộng MaHD lên VARCHAR(20) thành công!\n";
} else {
    echo "2. MaHD đã có kích thước phù hợp.\n";
}

echo "3. Cập nhật dữ liệu mặc định cho các hóa đơn cũ...\n";
$db->exec("UPDATE `hoadon` h
LEFT JOIN `khachhang` k ON k.`MaKH` = h.`MaKH`
SET 
  h.`TenNguoiNhan` = COALESCE(h.`TenNguoiNhan`, k.`TenKH`, 'Khách mua tại quầy'),
  h.`SDTNhan` = COALESCE(h.`SDTNhan`, k.`SDT`, '0900000000'),
  h.`DiaChiGiao` = COALESCE(h.`DiaChiGiao`, k.`DiaChi`, 'Mua trực tiếp tại cửa hàng'),
  h.`TrangThai` = 'hoan_thanh',
  h.`TrangThaiThanhToan` = 'da_thanh_toan'
WHERE h.`TenNguoiNhan` IS NULL OR h.`TrangThai` = 'cho_xac_nhan'");
echo "   -> Cập nhật dữ liệu hóa đơn cũ hoàn tất!\n";

echo "4. Kiểm tra truy vấn lấy dữ liệu từ cả 2 bảng hoadon và cthoadon:\n";
$stmt = $db->query("SELECT h.MaHD, h.Ngaylap,
       COALESCE(h.TenNguoiNhan, k.TenKH, 'Khách lẻ') AS khach,
       h.SDTNhan,
       h.DiaChiGiao,
       h.PhuongThucThanhToan,
       h.TrangThai,
       h.TrangThaiThanhToan,
       COALESCE(ct.soMon, 0) AS soMon,
       COALESCE(ct.tongTien, 0) AS tongTien
 FROM hoadon h
 LEFT JOIN khachhang k ON k.MaKH = h.MaKH
 LEFT JOIN (
     SELECT MaHD, COUNT(*) AS soMon, SUM(ThanhTien) AS tongTien
     FROM cthoadon
     GROUP BY MaHD
 ) ct ON ct.MaHD = h.MaHD
 ORDER BY h.Ngaylap DESC, h.MaHD DESC");

$danhSach = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "   -> Tìm thấy " . count($danhSach) . " đơn hàng/hóa đơn trong CSDL:\n";
foreach ($danhSach as $item) {
    echo "   [{$item['MaHD']}] {$item['khach']} | {$item['Ngaylap']} | {$item['soMon']} món | " . number_format((float) $item['tongTien'], 0, ',', '.') . " đ | {$item['TrangThai']}\n";
}

echo "\n5. Kiểm tra chi tiết 1 hóa đơn gồm cả hoadon + cthoadon + sanpham:\n";
$maHDDemo = $danhSach[0]['MaHD'] ?? 'HD001';
$dongHang = $db->query("SELECT c.MaHD, c.MaSP, s.TenSP, s.DviTinh, c.SlBan, c.GiaBan, c.Giamgia, c.ThanhTien
  FROM cthoadon c
  JOIN sanpham s ON s.MaSP = c.MaSP
  WHERE c.MaHD = '$maHDDemo'")->fetchAll(PDO::FETCH_ASSOC);

echo "   Chi tiết các món của hóa đơn [$maHDDemo]:\n";
foreach ($dongHang as $mon) {
    echo "   - {$mon['TenSP']} ({$mon['MaSP']}): {$mon['SlBan']} {$mon['DviTinh']} x " . number_format((float) $mon['GiaBan'], 0, ',', '.') . " đ = " . number_format((float) $mon['ThanhTien'], 0, ',', '.') . " đ\n";
}

echo "=== MIGRATION HOÀN TẤT THÀNH CÔNG! ===\n";

