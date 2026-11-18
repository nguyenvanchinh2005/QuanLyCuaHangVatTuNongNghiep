<?php
declare(strict_types=1);

final class ProfileData
{
    public function __construct(private PDO $database)
    {
    }

    /** Luôn tra theo MaTK lấy từ SESSION, không bao giờ từ request => không có IDOR. */
    public function lay(string $maTK): ?array
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT t.MaTK, t.TenTK, t.Email, k.TenKH, k.SDT, k.DiaChi
             FROM taikhoan t
             LEFT JOIN khachhang k ON k.MaKH = t.MaKH
             WHERE t.MaTK = :maTK
             LIMIT 1'
        );
        $cauTruyVan->execute(['maTK' => $maTK]);
        $hang = $cauTruyVan->fetch();
        if ($hang === false) {
            return null;
        }

        return [
            'tenTaiKhoan' => $hang['TenTK'],
            'email' => $hang['Email'],
            'hoTen' => $hang['TenKH'] ?? '',
            'soDienThoai' => $hang['SDT'] ?? '',
            'diaChi' => $hang['DiaChi'] ?? '',
        ];
    }

    /** Tài khoản đăng ký mới chưa có hàng khachhang => tạo và gắn vào tài khoản. */
    public function capNhat(string $maTK, string $hoTen, ?string $soDienThoai, ?string $diaChi): void
    {
        $this->database->beginTransaction();
        try {
            $timMa = $this->database->prepare('SELECT MaKH FROM taikhoan WHERE MaTK = :maTK FOR UPDATE');
            $timMa->execute(['maTK' => $maTK]);
            $maKH = $timMa->fetchColumn();

            if ($maKH === false) {
                throw new RuntimeException('Tài khoản không tồn tại.');
            }

            if ($maKH === null || $maKH === '') {
                $maKH = $this->taoKhachHangMoi($hoTen, $soDienThoai, $diaChi);
                $gan = $this->database->prepare('UPDATE taikhoan SET MaKH = :maKH WHERE MaTK = :maTK');
                $gan->execute(['maKH' => $maKH, 'maTK' => $maTK]);
            } else {
                $capNhat = $this->database->prepare(
                    'UPDATE khachhang SET TenKH = :ten, SDT = :sdt, DiaChi = :diaChi WHERE MaKH = :maKH'
                );
                $capNhat->execute([
                    'ten' => $hoTen,
                    'sdt' => $soDienThoai,
                    'diaChi' => $diaChi,
                    'maKH' => $maKH,
                ]);
            }

            $this->database->commit();
        } catch (Throwable $loi) {
            if ($this->database->inTransaction()) {
                $this->database->rollBack();
            }
            throw $loi;
        }
    }

    private function taoKhachHangMoi(string $hoTen, ?string $soDienThoai, ?string $diaChi): string
    {
        $dem = $this->database->query(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(MaKH, 3) AS UNSIGNED)), 0) + 1 FROM khachhang WHERE MaKH REGEXP '^KH[0-9]+$' FOR UPDATE"
        );
        $maKH = 'KH' . str_pad((string) $dem->fetchColumn(), 3, '0', STR_PAD_LEFT);

        $them = $this->database->prepare(
            'INSERT INTO khachhang (MaKH, TenKH, DiaChi, SDT) VALUES (:maKH, :ten, :diaChi, :sdt)'
        );
        $them->execute(['maKH' => $maKH, 'ten' => $hoTen, 'diaChi' => $diaChi, 'sdt' => $soDienThoai]);

        return $maKH;
    }
}
