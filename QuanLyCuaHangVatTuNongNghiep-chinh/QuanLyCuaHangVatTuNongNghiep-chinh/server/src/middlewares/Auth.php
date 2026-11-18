<?php
declare(strict_types=1);

final class Auth
{
    public const KHACH_HANG = 'khach_hang';
    public const NHAN_VIEN = 'nhan_vien';
    public const ADMIN = 'admin';

    private const QUYEN_KHACH_HANG = ['san_pham.xem', 'ho_so.xem', 'ho_so.sua'];

    private const QUYEN_NHAN_VIEN = [
        'san_pham.xem', 'quan_tri.xem',
        'san_pham.them', 'san_pham.sua', 'san_pham.an',
    ];

    /**
     * Ma trận phân quyền (RBAC): vai trò => danh sách quyền. Sửa quyền chỉ cần sửa ở đây.
     * Nhân viên KHÔNG có: san_pham.xoa, san_pham.khoi_phuc, tai_khoan.*, nhat_ky.xem.
     */
    private const QUYEN_THEO_VAI_TRO = [
        self::KHACH_HANG => self::QUYEN_KHACH_HANG,
        self::NHAN_VIEN => self::QUYEN_NHAN_VIEN,
        self::ADMIN => [
            ...self::QUYEN_NHAN_VIEN,
            'san_pham.xoa', 'san_pham.khoi_phuc',
            'tai_khoan.xem', 'tai_khoan.tao', 'tai_khoan.khoa', 'tai_khoan.doi_vai_tro',
            'nhat_ky.xem',
        ],
    ];

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

    /**
     * Làm mới thông tin người dùng trong phiên từ CSDL. Tài khoản bị xóa/khóa => hủy phiên.
     * @param callable(string): ?array $timTaiKhoan trả về hàng tài khoản (có khóa 'trang_thai') hoặc null
     */
    public static function dongBoPhien(callable $timTaiKhoan): void
    {
        $nguoiDung = $_SESSION['nguoi_dung'] ?? null;
        if (!is_array($nguoiDung) || ($nguoiDung['id'] ?? '') === '') {
            return;
        }

        $taiKhoan = $timTaiKhoan((string) $nguoiDung['id']);
        if ($taiKhoan === null || (int) ($taiKhoan['trang_thai'] ?? 1) !== 1) {
            unset($_SESSION['nguoi_dung']);
            session_regenerate_id(true);
            return;
        }

        $_SESSION['nguoi_dung'] = self::taoThongTinNguoiDung($taiKhoan);
    }

    public static function nguoiDungHienTai(): ?array
    {
        $nguoiDung = $_SESSION['nguoi_dung'] ?? null;
        if (!is_array($nguoiDung)) {
            return null;
        }

        $nguoiDung['vaiTro'] = self::chuanHoaVaiTro((string) ($nguoiDung['vaiTro'] ?? ''));
        $nguoiDung['quyen'] = self::quyenCuaVaiTro($nguoiDung['vaiTro']);
        $_SESSION['nguoi_dung'] = $nguoiDung;

        return $nguoiDung;
    }

    public static function idNguoiDung(): ?string
    {
        $nguoiDung = self::nguoiDungHienTai();
        return $nguoiDung === null ? null : (string) $nguoiDung['id'];
    }

    /** @return string[] */
    public static function quyenCuaVaiTro(string $vaiTro): array
    {
        return self::QUYEN_THEO_VAI_TRO[$vaiTro] ?? [];
    }

    public static function coQuyen(string $quyen): bool
    {
        $nguoiDung = self::nguoiDungHienTai();

        return $nguoiDung !== null && in_array($quyen, $nguoiDung['quyen'], true);
    }

    /** Chưa đăng nhập -> 401. */
    public static function yeuCauDangNhap(): bool
    {
        if (self::nguoiDungHienTai() !== null) {
            return true;
        }

        JsonResponse::gui([
            'error' => ['code' => 'unauthorized', 'message' => 'Vui lòng đăng nhập để tiếp tục.'],
        ], 401);
        return false;
    }

    /** Đã đăng nhập nhưng thiếu quyền -> 403. */
    public static function yeuCauQuyen(string $quyen): bool
    {
        if (!self::yeuCauDangNhap()) {
            return false;
        }

        if (self::coQuyen($quyen)) {
            return true;
        }

        self::tuChoiQuyen();
        return false;
    }

    public static function yeuCauVaiTro(array $vaiTroDuocPhep): bool
    {
        if (!self::yeuCauDangNhap()) {
            return false;
        }

        $nguoiDung = self::nguoiDungHienTai();
        $vaiTroDuocPhep = array_map(
            static fn (string $vaiTro): string => self::chuanHoaVaiTro($vaiTro),
            $vaiTroDuocPhep
        );
        if (!in_array($nguoiDung['vaiTro'], $vaiTroDuocPhep, true)) {
            self::tuChoiQuyen();
            return false;
        }

        return true;
    }

    private static function tuChoiQuyen(): void
    {
        JsonResponse::gui([
            'error' => ['code' => 'forbidden', 'message' => 'Tài khoản không có quyền thực hiện thao tác này.'],
        ], 403);
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

    public static function taoThongTinNguoiDung(array $taiKhoan): array
    {
        $vaiTro = self::chuanHoaVaiTro((string) ($taiKhoan['vai_tro'] ?? self::KHACH_HANG));

        return [
            'id' => (string) ($taiKhoan['id'] ?? ''),
            'ten' => (string) ($taiKhoan['ho_ten'] ?? $taiKhoan['ten_tai_khoan'] ?? ''),
            'tenTaiKhoan' => (string) ($taiKhoan['ten_tai_khoan'] ?? ''),
            'vaiTro' => $vaiTro,
            'quyen' => self::quyenCuaVaiTro($vaiTro),
            'email' => (string) ($taiKhoan['email'] ?? ''),
            'emailDaXacMinh' => (bool) ($taiKhoan['email_da_xac_minh'] ?? false),
        ];
    }

    public static function chuanHoaVaiTro(string $vaiTro): string
    {
        $vaiTro = strtolower(trim($vaiTro));

        return match ($vaiTro) {
            'nvien', 'nhanvien', 'nhan_vien' => self::NHAN_VIEN,
            'admin' => self::ADMIN,
            'nguoidung', 'nguoi_dung', 'khachhang', 'khach_hang' => self::KHACH_HANG,
            default => '', 
            // vai trò lạ => không có quyền gì
        };
    }
}
