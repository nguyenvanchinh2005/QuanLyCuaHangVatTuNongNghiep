<?php
declare(strict_types=1);

final class ProfileController
{
    public function __construct(private ProfileData $profile)
    {
    }

    public function hienThi(): void
    {
        $maTK = Auth::idNguoiDung();
        $hoSo = $maTK === null ? null : $this->profile->lay($maTK);
        if ($hoSo === null) {
            JsonResponse::gui(['error' => ['code' => 'not_found', 'message' => 'Không tìm thấy hồ sơ.']], 404);
            return;
        }

        JsonResponse::gui($hoSo);
    }

    public function capNhat(array $duLieu): void
    {
        $maTK = Auth::idNguoiDung();
        if ($maTK === null) {
            return;
        }

        $hoTen = is_string($duLieu['hoTen'] ?? null) ? trim($duLieu['hoTen']) : '';
        $sdt = is_string($duLieu['soDienThoai'] ?? null) ? trim($duLieu['soDienThoai']) : '';
        $diaChi = is_string($duLieu['diaChi'] ?? null) ? trim($duLieu['diaChi']) : '';

        $doDaiTen = preg_match_all('/./us', $hoTen);
        $doDaiDiaChi = preg_match_all('/./us', $diaChi);
        if ($hoTen === '' || $doDaiTen > 100
            || ($sdt !== '' && preg_match('/\A[0-9]{8,15}\z/', $sdt) !== 1)
            || $doDaiDiaChi > 255) {
            JsonResponse::gui(['error' => [
                'code' => 'invalid_input',
                'message' => 'Họ tên bắt buộc (≤100 ký tự), SĐT gồm 8–15 chữ số, địa chỉ ≤255 ký tự.',
            ]], 422);
            return;
        }

        $this->profile->capNhat($maTK, $hoTen, $sdt === '' ? null : $sdt, $diaChi === '' ? null : $diaChi);
        $this->hienThi();
    }
}
