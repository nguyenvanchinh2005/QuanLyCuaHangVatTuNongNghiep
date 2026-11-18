<?php
declare(strict_types=1);

final class AdminData
{
    public function __construct(private readonly PDO $database)
    {
    }

    public function danhSachDonHang(): array
    {
        $cauTruyVan = $this->database->query(
            "SELECT h.MaHD, h.Ngaylap,
                   COALESCE(h.TenNguoiNhan, k.TenKH, h.MaKH, 'Khách lẻ') AS khach,
                   h.SDTNhan AS soDienThoai,
                   h.DiaChiGiao AS diaChiGiao,
                   h.PhuongThucThanhToan AS phuongThuc,
                   h.TrangThai AS trangThai,
                   h.TrangThaiThanhToan AS trangThaiThanhToan,
                   h.NgayThanhToan AS ngayThanhToan,
                   h.NgayHoanTien AS ngayHoanTien,
                   COALESCE(ct.tong, 0) AS tong
             FROM hoadon h
             LEFT JOIN khachhang k ON k.MaKH = h.MaKH
             LEFT JOIN (
                 SELECT MaHD, SUM(ThanhTien) AS tong
                 FROM cthoadon
                 GROUP BY MaHD
             ) ct ON ct.MaHD = h.MaHD
             ORDER BY h.Ngaylap DESC, h.MaHD DESC"
        );

        return $cauTruyVan->fetchAll();
    }

    public function danhSachTaiKhoan(): array
    {
        $cauTruyVan = $this->database->query(
            'SELECT MaTK, TenTK, VaiTro, Email, TrangThai
             FROM taikhoan
             ORDER BY TenTK, MaTK'
        );

        return array_map(static function (array $taiKhoan): array {
            $taiKhoan['VaiTro'] = Auth::chuanHoaVaiTro((string) $taiKhoan['VaiTro']);
            $taiKhoan['TrangThai'] = (int) ($taiKhoan['TrangThai'] ?? 1) === 1;
            return $taiKhoan;
        }, $cauTruyVan->fetchAll());
    }
}
