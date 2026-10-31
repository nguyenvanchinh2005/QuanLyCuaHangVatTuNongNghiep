<?php
declare(strict_types=1);

final class AuthData
{
    public function __construct(private PDO $database)
    {
    }

    public function timTheoTenTaiKhoan(string $tenTaiKhoan): ?array
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT MaTK AS id, TenTK AS ten_tai_khoan, TenTK AS ho_ten,
                    MatKhau AS mat_khau, VaiTro AS vai_tro
             FROM taikhoan
             WHERE TenTK = :tenTaiKhoan
             LIMIT 1'
        );
        $cauTruyVan->execute(['tenTaiKhoan' => $tenTaiKhoan]);
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

    public function taoTaiKhoan(string $tenTaiKhoan, string $matKhau, string $vaiTro): array
    {
        $cauTruyVan = $this->database->prepare(
            'INSERT INTO taikhoan (TenTK, MatKhau, VaiTro)
             VALUES (:tenTaiKhoan, :matKhau, :vaiTro)'
        );
        $cauTruyVan->execute([
            'tenTaiKhoan' => $tenTaiKhoan,
            'matKhau' => password_hash($matKhau, PASSWORD_DEFAULT),
            'vaiTro' => $vaiTro,
        ]);

        return [
            'id' => (int) $this->database->lastInsertId(),
            'ten_tai_khoan' => $tenTaiKhoan,
            'ho_ten' => $tenTaiKhoan,
            'vai_tro' => $vaiTro,
        ];
    }
}
