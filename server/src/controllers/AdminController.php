<?php
declare(strict_types=1);

final class AdminController
{
    public function __construct(private AdminData $adminData)
    {
    }

    public function hienThiDuLieu(): void
    {
        JsonResponse::gui([
            'donHang' => $this->adminData->danhSachDonHang(),
            'taiKhoan' => $this->adminData->danhSachTaiKhoan(),
        ]);
    }
}
