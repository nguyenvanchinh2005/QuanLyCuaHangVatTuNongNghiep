-- =============================================================================
-- Migration: Đồng bộ CSDL bảng hoadon và cthoadon với chức năng Giỏ hàng & Đơn hàng
-- =============================================================================

-- 1. Bổ sung các cột phục vụ đặt hàng trực tuyến và giao hàng vào bảng hoadon
ALTER TABLE `hoadon`
  ADD COLUMN `TenNguoiNhan` VARCHAR(100) NULL AFTER `MaNv`,
  ADD COLUMN `SDTNhan` VARCHAR(20) NULL AFTER `TenNguoiNhan`,
  ADD COLUMN `DiaChiGiao` VARCHAR(255) NULL AFTER `SDTNhan`,
  ADD COLUMN `PhuongThucThanhToan` VARCHAR(50) NOT NULL DEFAULT 'cod' AFTER `DiaChiGiao`,
  ADD COLUMN `TrangThai` VARCHAR(50) NOT NULL DEFAULT 'cho_xac_nhan' AFTER `PhuongThucThanhToan`,
  ADD COLUMN `TrangThaiThanhToan` VARCHAR(50) NOT NULL DEFAULT 'cho_thanh_toan' AFTER `TrangThai`,
  ADD COLUMN `NgayThanhToan` DATETIME NULL AFTER `TrangThaiThanhToan`,
  ADD COLUMN `NgayHoanTien` DATETIME NULL AFTER `NgayThanhToan`;

-- 2. Mở rộng độ dài MaHD lên VARCHAR(20) để hỗ trợ mã đơn hàng dạng HD... hoặc VP-...
ALTER TABLE `cthoadon` DROP FOREIGN KEY `FK_cthoadon_hoadon`;
ALTER TABLE `hoadon` MODIFY COLUMN `MaHD` VARCHAR(20) NOT NULL;
ALTER TABLE `cthoadon` MODIFY COLUMN `MaHD` VARCHAR(20) NOT NULL;
ALTER TABLE `cthoadon` ADD CONSTRAINT `FK_cthoadon_hoadon` FOREIGN KEY (`MaHD`) REFERENCES `hoadon` (`MaHD`) ON DELETE CASCADE;

-- 3. Cập nhật dữ liệu mặc định cho các hóa đơn cũ sẵn có trong hệ thống
UPDATE `hoadon` h
LEFT JOIN `khachhang` k ON k.`MaKH` = h.`MaKH`
SET 
  h.`TenNguoiNhan` = COALESCE(h.`TenNguoiNhan`, k.`TenKH`, 'Khách mua tại quầy'),
  h.`SDTNhan` = COALESCE(h.`SDTNhan`, k.`SDT`, '0900000000'),
  h.`DiaChiGiao` = COALESCE(h.`DiaChiGiao`, k.`DiaChi`, 'Mua trực tiếp tại cửa hàng'),
  h.`TrangThai` = 'hoan_thanh',
  h.`TrangThaiThanhToan` = 'da_thanh_toan'
WHERE h.`TenNguoiNhan` IS NULL OR h.`TrangThai` = 'cho_xac_nhan';
