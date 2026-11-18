<?php
declare(strict_types=1);

final class ActivityLog
{
    public function __construct(private PDO $database)
    {
    }

    /** Ghi nhật ký cho người đang đăng nhập. Lỗi ghi log không làm hỏng thao tác chính. */
    public function ghi(string $hanhDong, string $doiTuong, ?string $maDoiTuong = null, ?array $chiTiet = null): void
    {
        try {
            $cauTruyVan = $this->database->prepare(
                'INSERT INTO nhatky_hoatdong (MaTK, HanhDong, DoiTuong, MaDoiTuong, ChiTiet, DiaChiIp)
                 VALUES (:maTK, :hanhDong, :doiTuong, :maDoiTuong, :chiTiet, :ip)'
            );
            $cauTruyVan->execute([
                'maTK' => Auth::idNguoiDung(),
                'hanhDong' => $hanhDong,
                'doiTuong' => $doiTuong,
                'maDoiTuong' => $maDoiTuong,
                'chiTiet' => $chiTiet === null ? null : json_encode($chiTiet, JSON_UNESCAPED_UNICODE),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            ]);
        } catch (Throwable $loi) {
            error_log('Không ghi được nhật ký hoạt động: ' . $loi->getMessage());
        }
    }

    public function danhSachGanDay(int $gioiHan = 200): array
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT l.MaLog, l.ThoiGian, l.HanhDong, l.DoiTuong, l.MaDoiTuong, l.ChiTiet, l.DiaChiIp,
                    l.MaTK, t.TenTK, t.VaiTro
             FROM nhatky_hoatdong l
             LEFT JOIN taikhoan t ON t.MaTK = l.MaTK
             ORDER BY l.MaLog DESC
             LIMIT :gioiHan'
        );
        $cauTruyVan->bindValue('gioiHan', max(1, min($gioiHan, 500)), PDO::PARAM_INT);
        $cauTruyVan->execute();

        return $cauTruyVan->fetchAll();
    }
}
