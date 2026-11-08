<?php
declare(strict_types=1);

final class AuthController
{
    public function __construct(private ?AuthData $authData = null)
    {
    }

    public function hienThiPhien(): void
    {
        JsonResponse::gui([
            'nguoiDung' => Auth::nguoiDungHienTai(),
            'csrfToken' => Auth::taoTokenCsrf(),
        ]);
    }

    public function dangNhap(array $duLieu): void
    {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }

        $tenTaiKhoanNhap = $duLieu['tenTaiKhoan'] ?? null;
        $matKhau = $duLieu['matKhau'] ?? null;
        if (!is_string($tenTaiKhoanNhap) || !is_string($matKhau)) {
            $this->guiLoiDuLieu();
            return;
        }

        $tenTaiKhoan = strtolower(trim($tenTaiKhoanNhap));
        if (!preg_match('/\A[a-z0-9._-]{3,32}\z/', $tenTaiKhoan) || $matKhau === '') {
            $this->guiLoiDuLieu();
            return;
        }

        $taiKhoan = $this->authData?->timTheoTenTaiKhoan($tenTaiKhoan);
        if ($taiKhoan === null || !$this->kiemTraMatKhau($matKhau, (string) $taiKhoan['mat_khau'])) {
            JsonResponse::gui([
                'error' => ['code' => 'invalid_credentials', 'message' => 'Tên tài khoản hoặc mật khẩu không chính xác.'],
            ], 401);
            return;
        }

        session_regenerate_id(true);
        $_SESSION['nguoi_dung'] = Auth::taoThongTinNguoiDung($taiKhoan);
        unset($_SESSION['csrf_token']);

        JsonResponse::gui([
            'nguoiDung' => $_SESSION['nguoi_dung'],
            'csrfToken' => Auth::taoTokenCsrf(),
        ]);
    }

    public function dangKy(array $duLieu): void
    {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }

        $tenTaiKhoanNhap = $duLieu['tenTaiKhoan'] ?? null;
        $matKhau = $duLieu['matKhau'] ?? null;
        if (!is_string($tenTaiKhoanNhap) || !is_string($matKhau)) {
            $this->guiLoiDuLieu();
            return;
        }

        $tenTaiKhoan = strtolower(trim($tenTaiKhoanNhap));
        if (!preg_match('/\A[a-z0-9._-]{3,32}\z/', $tenTaiKhoan) || strlen($matKhau) < 8) {
            $this->guiLoiDuLieu();
            return;
        }
        if ($this->authData === null) {
            throw new LogicException('AuthData is required to register accounts.');
        }
        if ($this->authData->tenTaiKhoanDaTonTai($tenTaiKhoan)) {
            JsonResponse::gui([
                'error' => ['code' => 'username_exists', 'message' => 'Tên tài khoản này đã được sử dụng. Hãy chọn tên khác.'],
            ], 409);
            return;
        }

        $taiKhoan = $this->authData->taoTaiKhoan($tenTaiKhoan, $matKhau, 'khach_hang');
        session_regenerate_id(true);
        $_SESSION['nguoi_dung'] = Auth::taoThongTinNguoiDung($taiKhoan);
        unset($_SESSION['csrf_token']);

        JsonResponse::gui([
            'nguoiDung' => $_SESSION['nguoi_dung'],
            'csrfToken' => Auth::taoTokenCsrf(),
        ], 201);
    }

    public function dangXuat(): void
    {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }

        $_SESSION = [];
        session_regenerate_id(true);
        JsonResponse::gui([
            'nguoiDung' => null,
            'csrfToken' => Auth::taoTokenCsrf(),
        ]);
    }

    private function kiemTraMatKhau(string $matKhau, string $matKhauTrongDatabase): bool
    {
        $thongTinHash = password_get_info($matKhauTrongDatabase);
        if (($thongTinHash['algoName'] ?? 'unknown') !== 'unknown') {
            return password_verify($matKhau, $matKhauTrongDatabase);
        }

        return hash_equals($matKhauTrongDatabase, $matKhau);
    }

    private function guiLoiDuLieu(): void
    {
        JsonResponse::gui([
            'error' => [
                'code' => 'invalid_input',
                'message' => 'Tên tài khoản phải có 3–32 ký tự (chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang) và mật khẩu ít nhất 8 ký tự.',
            ],
        ], 422);
    }
}
