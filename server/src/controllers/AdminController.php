<?php
declare(strict_types=1);

final class AdminController
{
    public function __construct(private AdminData $adminData, private ?ActivityLog $nhatKy = null)
    {
    }

    /** Nhân viên chỉ nhận hóa đơn; danh sách tài khoản chỉ trả khi người gọi có quyền tai_khoan.xem. */
    public function hienThiDuLieu(bool $kemTaiKhoan = false): void
    {
        JsonResponse::gui([
            'donHang' => $this->adminData->danhSachDonHang(),
            'taiKhoan' => $kemTaiKhoan ? $this->adminData->danhSachTaiKhoan() : [],
        ]);
    }

    public function hienThiNhatKy(): void
    {
        JsonResponse::gui(['nhatKy' => $this->nhatKy?->danhSachGanDay() ?? []]);
    }
}
