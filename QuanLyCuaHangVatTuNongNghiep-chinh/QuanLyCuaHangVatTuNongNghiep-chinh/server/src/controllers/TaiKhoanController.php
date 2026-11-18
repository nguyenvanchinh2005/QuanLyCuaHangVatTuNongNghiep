<?php
declare(strict_types=1);

final class TaiKhoanController
{
    public function __construct(private AuthData $authData, private ActivityLog $nhatKy)
    {
    }

    public function taoNhanVien(array $duLieu): void
    {
        $ten = is_string($duLieu['tenTaiKhoan'] ?? null) ? strtolower(trim($duLieu['tenTaiKhoan'])) : '';
        $matKhau = is_string($duLieu['matKhau'] ?? null) ? $duLieu['matKhau'] : '';
        $emailNhap = is_string($duLieu['email'] ?? null) ? strtolower(trim($duLieu['email'])) : '';

        if (preg_match('/\A[a-z0-9._-]{3,32}\z/', $ten) !== 1) {
            $this->loi(422, 'invalid_input', 'Tên tài khoản dài 3–32 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.');
            return;
        }
        if (strlen($matKhau) < 12) {
            $this->loi(422, 'invalid_input', 'Mật khẩu nhân viên phải có ít nhất 12 ký tự.');
            return;
        }
        if ($emailNhap !== '' && filter_var($emailNhap, FILTER_VALIDATE_EMAIL) === false) {
            $this->loi(422, 'invalid_input', 'Email không hợp lệ.');
            return;
        }
        if ($this->authData->tenTaiKhoanDaTonTai($ten)) {
            $this->loi(409, 'username_exists', 'Tên tài khoản này đã được sử dụng.');
            return;
        }
        if ($emailNhap !== '' && $this->authData->emailDaTonTai($emailNhap)) {
            $this->loi(409, 'email_exists', 'Email này đã được đăng ký.');
            return;
        }

        $taiKhoan = $this->authData->taoTaiKhoan($ten, $matKhau, Auth::NHAN_VIEN, $emailNhap === '' ? null : $emailNhap);
        $this->nhatKy->ghi('tai_khoan.tao', 'taikhoan', $taiKhoan['id'], ['vaiTro' => Auth::NHAN_VIEN]);
        JsonResponse::gui(['message' => 'Đã tạo tài khoản nhân viên.', 'maTK' => $taiKhoan['id']], 201);
    }

    public function datTrangThai(string $maTK, array $duLieu): void
    {
        if (!is_bool($duLieu['hoatDong'] ?? null)) {
            $this->loi(422, 'invalid_input', 'Trường hoatDong phải là true hoặc false.');
            return;
        }

        $ketQua = $this->authData->datTrangThaiAnToan($maTK, $duLieu['hoatDong'], (string) Auth::idNguoiDung());
        if (!$this->baoKetQua($ketQua, 'khóa')) {
            return;
        }

        $this->nhatKy->ghi($duLieu['hoatDong'] ? 'tai_khoan.mo_khoa' : 'tai_khoan.khoa', 'taikhoan', $maTK);
        JsonResponse::gui(['message' => $duLieu['hoatDong'] ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.']);
    }

    public function datVaiTro(string $maTK, array $duLieu): void
    {
        $vaiTro = $duLieu['vaiTro'] ?? null;
        if (!in_array($vaiTro, [Auth::KHACH_HANG, Auth::NHAN_VIEN, Auth::ADMIN], true)) {
            $this->loi(422, 'invalid_input', 'Vai trò phải là khach_hang, nhan_vien hoặc admin.');
            return;
        }

        $ketQua = $this->authData->doiVaiTroAnToan($maTK, $vaiTro, (string) Auth::idNguoiDung());
        if (!$this->baoKetQua($ketQua, 'đổi vai trò')) {
            return;
        }

        $this->nhatKy->ghi('tai_khoan.doi_vai_tro', 'taikhoan', $maTK, ['vaiTroMoi' => $vaiTro]);
        JsonResponse::gui(['message' => 'Đã cập nhật vai trò.']);
    }

    private function baoKetQua(string $ketQua, string $hanhDong): bool
    {
        return match ($ketQua) {
            'ok' => true,
            'khong_tim_thay' => $this->loi(404, 'account_not_found', 'Không tìm thấy tài khoản.'),
            'tu_thao_tac' => $this->loi(409, 'self_action_forbidden', "Bạn không thể tự {$hanhDong} tài khoản của chính mình."),
            'admin_cuoi_cung' => $this->loi(409, 'last_admin', 'Đây là quản trị viên hoạt động cuối cùng của hệ thống nên không thể thực hiện.'),
            default => $this->loi(500, 'internal_server_error', 'Đã xảy ra lỗi máy chủ.'),
        };
    }

    /** Luôn trả false để dùng được trong match / return. */
    private function loi(int $http, string $ma, string $thongBao): bool
    {
        JsonResponse::gui(['error' => ['code' => $ma, 'message' => $thongBao]], $http);
        return false;
    }
}
