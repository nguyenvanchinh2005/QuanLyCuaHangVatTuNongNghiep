<?php
declare(strict_types=1);

final class AdminData
{
    public function __construct(private PDO $database)
    {
    }

    public function danhSachDonHang(): array
    {
        $cauTruyVan = $this->database->query(
            "SELECT h.MaHD, h.Ngaylap,
                    COALESCE(k.TenKH, h.MaKH, 'Khách lẻ') AS khach,
                    COALESCE(
                        SUM(COALESCE(c.TongHD, c.SlBan * c.GiaBan - COALESCE(c.Giamgia, 0))),
                        0
                    ) AS tong
             FROM hoadon h
             LEFT JOIN khachhang k ON k.MaKH = h.MaKH
             LEFT JOIN cthoadon c ON c.MaHD = h.MaHD
             GROUP BY h.MaHD, h.Ngaylap, k.TenKH, h.MaKH
             ORDER BY h.Ngaylap DESC, h.MaHD DESC"
        );

        return array_map(static function (array $donHang): array {
            $donHang['tong'] = (int) round((float) $donHang['tong']);
            $donHang['phuongThuc'] = 'Không lưu trong cơ sở dữ liệu';
            $donHang['trangThai'] = 'Đã ghi nhận';

            return $donHang;
        }, $cauTruyVan->fetchAll());
    }

    public function danhSachTaiKhoan(): array
    {
        $cauTruyVan = $this->database->query(
            'SELECT MaTK, TenTK, VaiTro
             FROM taikhoan
             ORDER BY TenTK, MaTK'
        );

        return $cauTruyVan->fetchAll();
    }
}
