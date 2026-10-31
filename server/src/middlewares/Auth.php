<?php
declare(strict_types=1);

final class Auth
{
    public static function batDauPhien(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name('vuonpho_session');
        session_set_cookie_params([
            'httponly' => true,
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'samesite' => 'Lax',
            'path' => '/',
        ]);
        session_start();
    }

    public static function nguoiDungHienTai(): ?array
    {
        $nguoiDung = $_SESSION['nguoi_dung'] ?? null;
        if (!is_array($nguoiDung)) {
            return null;
        }

        $nguoiDung['vaiTro'] = self::chuanHoaVaiTro((string) ($nguoiDung['vaiTro'] ?? ''));
        $_SESSION['nguoi_dung'] = $nguoiDung;

        return $nguoiDung;
    }

    public static function yeuCauVaiTro(array $vaiTroDuocPhep): bool
    {
        $nguoiDung = self::nguoiDungHienTai();
        if ($nguoiDung === null) {
            JsonResponse::gui([
                'error' => ['code' => 'unauthorized', 'message' => 'Vui lòng đăng nhập để tiếp tục.'],
            ], 401);
            return false;
        }

        $vaiTroDuocPhep = array_map(
            static fn (string $vaiTro): string => self::chuanHoaVaiTro($vaiTro),
            $vaiTroDuocPhep
        );
        if (!in_array($nguoiDung['vaiTro'], $vaiTroDuocPhep, true)) {
            JsonResponse::gui([
                'error' => ['code' => 'forbidden', 'message' => 'Tài khoản không có quyền thực hiện thao tác này.'],
            ], 403);
            return false;
        }

        return true;
    }

    public static function taoTokenCsrf(): string
    {
        $_SESSION['csrf_token'] ??= bin2hex(random_bytes(32));
        return $_SESSION['csrf_token'];
    }

    public static function kiemTraTokenCsrf(): bool
    {
        $tokenNhan = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $tokenPhien = $_SESSION['csrf_token'] ?? '';

        if (is_string($tokenNhan) && is_string($tokenPhien) && $tokenNhan !== '' && hash_equals($tokenPhien, $tokenNhan)) {
            return true;
        }

        JsonResponse::gui([
            'error' => ['code' => 'invalid_csrf_token', 'message' => 'Phiên làm việc đã hết hạn. Vui lòng tải lại trang.'],
        ], 403);
        return false;
    }

    public static function taoThongTinNguoiDung(array $nguoiDung): array
    {
        return [
            'id' => (int) $nguoiDung['id'],
            'tenTaiKhoan' => (string) $nguoiDung['ten_tai_khoan'],
            'ten' => (string) $nguoiDung['ho_ten'],
            'vaiTro' => self::chuanHoaVaiTro((string) $nguoiDung['vai_tro']),
        ];
    }

    public static function chuanHoaVaiTro(string $vaiTro): string
    {
        $vaiTro = strtolower(trim($vaiTro));

        return match ($vaiTro) {
            'nvien', 'nhanvien', 'nhan_vien' => 'nhan_vien',
            'admin' => 'admin',
            default => $vaiTro,
        };
    }
}
