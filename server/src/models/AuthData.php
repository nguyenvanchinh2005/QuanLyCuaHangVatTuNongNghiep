<?php
declare(strict_types=1);

final class AuthData
{
    public function __construct(private PDO $database)
    {
    }

    public function timTheoTenHoacEmail(string $tenHoacEmail): ?array
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT MaTK AS id,
                    TenTK AS ten_tai_khoan,
                    TenTK AS ho_ten,
                    MatKhau AS mat_khau,
                    VaiTro AS vai_tro,
                    MaKH AS ma_kh,
                    MaNV AS ma_nv,
                    Email AS email,
                    EmailDaXacMinh AS email_da_xac_minh,
                    TrangThai AS trang_thai
             FROM taikhoan
             WHERE TenTK = :nhap1 OR Email = :nhap2
             LIMIT 1'
        );

        $cauTruyVan->execute([
            'nhap1' => $tenHoacEmail,
            'nhap2' => $tenHoacEmail,
        ]);
        $taiKhoan = $cauTruyVan->fetch();

        return $taiKhoan === false ? null : $taiKhoan;
    }

    public function timTheoMaTaiKhoan(string $maTK): ?array
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT MaTK AS id,
                    TenTK AS ten_tai_khoan,
                    TenTK AS ho_ten,
                    MatKhau AS mat_khau,
                    VaiTro AS vai_tro,
                    MaKH AS ma_kh,
                    MaNV AS ma_nv,
                    Email AS email,
                    EmailDaXacMinh AS email_da_xac_minh,
                    TrangThai AS trang_thai
             FROM taikhoan
             WHERE MaTK = :maTK
             LIMIT 1'
        );

        $cauTruyVan->execute(['maTK' => $maTK]);
        $taiKhoan = $cauTruyVan->fetch();

        return $taiKhoan === false ? null : $taiKhoan;
    }

    public function tenTaiKhoanDaTonTai(string $tenTaiKhoan): bool
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT 1 FROM taikhoan WHERE TenTK = :tenTaiKhoan LIMIT 1'
        );
        $cauTruyVan->execute(['tenTaiKhoan' => $tenTaiKhoan]);
        return $cauTruyVan->fetchColumn() !== false;
    }

    public function emailDaTonTai(string $email): bool
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT 1 FROM taikhoan WHERE Email = :email LIMIT 1'
        );
        $cauTruyVan->execute(['email' => $email]);
        return $cauTruyVan->fetchColumn() !== false;
    }

    public function layThoiGianChoGuiLaiOtp(string $email): int
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT GREATEST(0, 60 - TIMESTAMPDIFF(SECOND, tao_luc, NOW()))
             FROM xacnhan_email
             WHERE Email = :email
             LIMIT 1'
        );
        $cauTruyVan->execute(['email' => $email]);
        $giayConLai = $cauTruyVan->fetchColumn();

        return $giayConLai === false ? 0 : (int) $giayConLai;
    }

    public function luuMaOtpEmail(string $email, string $otpHash): void
    {
        $cauTruyVan = $this->database->prepare(
            'INSERT INTO xacnhan_email (Email, token_hash, tao_luc, het_han_luc)
             VALUES (:email, :tokenHash, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
             ON DUPLICATE KEY UPDATE
                token_hash = VALUES(token_hash),
                tao_luc = NOW(),
                het_han_luc = DATE_ADD(NOW(), INTERVAL 10 MINUTE)'
        );

        $cauTruyVan->execute([
            'email' => $email,
            'tokenHash' => $otpHash,
        ]);
    }

    public function kiemTraVaXoaMaOtp(string $email, string $otpHash): bool
    {
        $timMa = $this->database->prepare(
            'SELECT 1
             FROM xacnhan_email
             WHERE Email = :email
               AND token_hash = :tokenHash
               AND het_han_luc > NOW()
             LIMIT 1'
        );

        $timMa->execute([
            'email' => $email,
            'tokenHash' => $otpHash,
        ]);

        if ($timMa->fetchColumn() === false) {
            return false;
        }

        $xoaMa = $this->database->prepare('DELETE FROM xacnhan_email WHERE Email = :email');
        $xoaMa->execute(['email' => $email]);

        return true;
    }

    public function taoTaiKhoanDaXacMinh(
        string $tenTaiKhoan,
        string $email,
        string $matKhau,
        string $vaiTro = 'khach_hang'
    ): array {
        $maTaiKhoan = 'TK' . strtoupper(bin2hex(random_bytes(4)));

        $cauTruyVan = $this->database->prepare(
            'INSERT INTO taikhoan (MaTK, TenTK, MatKhau, VaiTro, Email, EmailDaXacMinh)
             VALUES (:maTaiKhoan, :tenTaiKhoan, :matKhau, :vaiTro, :email, 1)'
        );

        $cauTruyVan->execute([
            'maTaiKhoan' => $maTaiKhoan,
            'tenTaiKhoan' => $tenTaiKhoan,
            'matKhau' => password_hash($matKhau, PASSWORD_DEFAULT),
            'vaiTro' => $vaiTro,
            'email' => $email,
        ]);

        return [
            'id' => $maTaiKhoan,
            'ten_tai_khoan' => $tenTaiKhoan,
            'ho_ten' => $tenTaiKhoan,
            'vai_tro' => $vaiTro,
            'email' => $email,
            'email_da_xac_minh' => 1,
        ];
    }

    public function datLaiMatKhauTheoEmail(string $email, string $matKhauMoi): bool
    {
        $cauTruyVan = $this->database->prepare(
            'UPDATE taikhoan
             SET MatKhau = :matKhau
             WHERE Email = :email'
        );

        $cauTruyVan->execute([
            'matKhau' => password_hash($matKhauMoi, PASSWORD_DEFAULT),
            'email' => $email,
        ]);

        return $cauTruyVan->rowCount() > 0;
    }

    public function capNhatMatKhauTheoMa(string $maTK, string $matKhauMoi): bool
    {
        $cauTruyVan = $this->database->prepare(
            'UPDATE taikhoan
             SET MatKhau = :matKhau
             WHERE MaTK = :maTK'
        );

        $cauTruyVan->execute([
            'matKhau' => password_hash($matKhauMoi, PASSWORD_DEFAULT),
            'maTK' => $maTK,
        ]);

        return $cauTruyVan->rowCount() > 0;
    }

    /** Tạo tài khoản nội bộ (admin tạo nhân viên, hoặc script CLI create-account.php). */
    public function taoTaiKhoan(string $tenTaiKhoan, string $matKhau, string $vaiTro, ?string $email = null): array
    {
        $maTaiKhoan = 'TK' . strtoupper(bin2hex(random_bytes(4)));

        $cauTruyVan = $this->database->prepare(
            'INSERT INTO taikhoan (MaTK, TenTK, MatKhau, VaiTro, Email, EmailDaXacMinh, TrangThai)
             VALUES (:maTaiKhoan, :tenTaiKhoan, :matKhau, :vaiTro, :email, 0, 1)'
        );
        $cauTruyVan->execute([
            'maTaiKhoan' => $maTaiKhoan,
            'tenTaiKhoan' => $tenTaiKhoan,
            'matKhau' => password_hash($matKhau, PASSWORD_DEFAULT),
            'vaiTro' => $vaiTro,
            'email' => $email,
        ]);

        return ['id' => $maTaiKhoan, 'ten_tai_khoan' => $tenTaiKhoan, 'vai_tro' => $vaiTro];
    }

    /** @return string 'ok' | 'khong_tim_thay' | 'tu_thao_tac' | 'admin_cuoi_cung' */
    public function datTrangThaiAnToan(string $maTK, bool $hoatDong, string $maNguoiThucHien): string
    {
        if ($maTK === $maNguoiThucHien) {
            return 'tu_thao_tac';
        }

        return $this->trongGiaoDich(function () use ($maTK, $hoatDong): string {
            $dong = $this->khoaTaiKhoan($maTK);
            if ($dong === null) {
                return 'khong_tim_thay';
            }
            if (!$hoatDong && $dong['VaiTro'] === 'admin' && (int) $dong['TrangThai'] === 1
                && $this->demAdminHoatDong() <= 1) {
                return 'admin_cuoi_cung';
            }

            $capNhat = $this->database->prepare('UPDATE taikhoan SET TrangThai = :trangThai WHERE MaTK = :maTK');
            $capNhat->execute(['trangThai' => $hoatDong ? 1 : 0, 'maTK' => $maTK]);
            return 'ok';
        });
    }

    /** @return string 'ok' | 'khong_tim_thay' | 'tu_thao_tac' | 'admin_cuoi_cung' */
    public function doiVaiTroAnToan(string $maTK, string $vaiTroMoi, string $maNguoiThucHien): string
    {
        if ($maTK === $maNguoiThucHien) {
            return 'tu_thao_tac';
        }

        return $this->trongGiaoDich(function () use ($maTK, $vaiTroMoi): string {
            $dong = $this->khoaTaiKhoan($maTK);
            if ($dong === null) {
                return 'khong_tim_thay';
            }
            if ($dong['VaiTro'] === 'admin' && $vaiTroMoi !== 'admin' && (int) $dong['TrangThai'] === 1
                && $this->demAdminHoatDong() <= 1) {
                return 'admin_cuoi_cung';
            }

            $capNhat = $this->database->prepare('UPDATE taikhoan SET VaiTro = :vaiTro WHERE MaTK = :maTK');
            $capNhat->execute(['vaiTro' => $vaiTroMoi, 'maTK' => $maTK]);
            return 'ok';
        });
    }

    private function khoaTaiKhoan(string $maTK): ?array
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT VaiTro, TrangThai FROM taikhoan WHERE MaTK = :maTK FOR UPDATE'
        );
        $cauTruyVan->execute(['maTK' => $maTK]);
        $dong = $cauTruyVan->fetch();

        return $dong === false ? null : $dong;
    }

    private function demAdminHoatDong(): int
    {
        return (int) $this->database
            ->query("SELECT COUNT(*) FROM taikhoan WHERE VaiTro = 'admin' AND TrangThai = 1 FOR UPDATE")
            ->fetchColumn();
    }

    private function trongGiaoDich(callable $viec): string
    {
        $this->database->beginTransaction();
        try {
            $ketQua = $viec();
            $ketQua === 'ok' ? $this->database->commit() : $this->database->rollBack();
            return $ketQua;
        } catch (Throwable $loi) {
            if ($this->database->inTransaction()) {
                $this->database->rollBack();
            }
            throw $loi;
        }
    }
}
