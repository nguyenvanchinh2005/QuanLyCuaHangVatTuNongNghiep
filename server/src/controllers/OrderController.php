<?php
declare(strict_types=1);

final class OrderController
{
    public function __construct(private OrderData $orderData)
    {
    }

    public function hienThiDanhSach(array $nguoiDung): void
    {
        $maTK = $nguoiDung['vaiTro'] === 'khach_hang'
            ? (string) $nguoiDung['id']
            : null;
        $donHang = array_map(
            fn (array $don): array => $this->themHuongDanThanhToan($don),
            $this->orderData->danhSachDonHang($maTK)
        );

        JsonResponse::gui([
            'donHang' => $donHang,
        ]);
    }

    public function hienThiChiTiet(string $maHD, array $nguoiDung): void
    {
        if (!preg_match('/\A[A-Za-z0-9_-]{3,20}\z/', $maHD)) {
            $this->guiLoi('invalid_order_code', 'Mã đơn hàng không hợp lệ.', 400);
            return;
        }

        $maTK = $nguoiDung['vaiTro'] === 'khach_hang'
            ? (string) $nguoiDung['id']
            : null;
        $donHang = $this->orderData->chiTietDonHang($maHD, $maTK);
        if ($donHang === null) {
            $this->guiLoi('order_not_found', 'Không tìm thấy đơn hàng.', 404);
            return;
        }

        JsonResponse::gui(['donHang' => $this->themHuongDanThanhToan($donHang)]);
    }

    public function hienThiPhuongThucThanhToan(): void
    {
        $phuongThuc = [
            ['ma' => 'cod', 'ten' => 'Thanh toán khi nhận hàng'],
        ];
        $chuyenKhoan = $this->layCauHinhChuyenKhoan();
        if ($chuyenKhoan !== null) {
            $phuongThuc[] = [
                'ma' => 'bank_transfer',
                'ten' => 'Chuyển khoản thủ công',
                'nganHang' => $chuyenKhoan['nganHang'],
                'soTaiKhoan' => $chuyenKhoan['soTaiKhoan'],
                'chuTaiKhoan' => $chuyenKhoan['chuTaiKhoan'],
            ];
        }

        JsonResponse::gui(['phuongThuc' => $phuongThuc]);
    }

    public function taoDonHang(array $duLieu, array|string $nguoiDung): void
    {
        $maTK = is_array($nguoiDung) ? (string) ($nguoiDung['id'] ?? '') : (string) $nguoiDung;
        if ($maTK === '') {
            $this->guiLoi('unauthorized', 'Vui lòng đăng nhập để tiếp tục.', 401);
            return;
        }

        $donHang = $this->kiemTraDonHang($duLieu);
        if ($donHang === null) {
            return;
        }

        if ($donHang['phuongThucThanhToan'] === 'bank_transfer'
            && $this->layCauHinhChuyenKhoan() === null) {
            $this->guiLoi(
                'payment_method_unavailable',
                'Chuyển khoản chưa được cấu hình. Vui lòng chọn thanh toán khi nhận hàng.',
                422
            );
            return;
        }

        try {
            $donDaTao = $this->orderData->taoDonHang($maTK, $donHang);
        } catch (OrderException $loi) {
            $this->guiLoi($loi->errorCode, $loi->getMessage(), $loi->httpStatus);
            return;
        }

        JsonResponse::gui([
            'donHang' => $this->themHuongDanThanhToan($donDaTao),
        ], 201);
    }

    public function capNhatDonHang(string $maHD, array $duLieu): void
    {
        if (!preg_match('/\A[A-Za-z0-9_-]{3,20}\z/', $maHD)) {
            $this->guiLoi('invalid_order_code', 'Mã đơn hàng không hợp lệ.', 400);
            return;
        }

        $trangThai = $duLieu['trangThai'] ?? null;
        $thanhToan = $duLieu['trangThaiThanhToan'] ?? null;
        if ($trangThai !== null
            && (!is_string($trangThai) || !in_array($trangThai, [
                'cho_xac_nhan',
                'dang_xu_ly',
                'dang_giao',
                'hoan_thanh',
                'da_huy',
                'da_hoan_hang',
            ], true))) {
            $this->guiLoi('invalid_order_status', 'Trạng thái đơn hàng không hợp lệ.', 422);
            return;
        }
        if ($thanhToan !== null
            && (!is_string($thanhToan) || !in_array($thanhToan, [
                'da_thanh_toan',
                'da_hoan_tien',
            ], true))) {
            $this->guiLoi('invalid_payment_status', 'Trạng thái thanh toán không hợp lệ.', 422);
            return;
        }
        if ($trangThai === null && $thanhToan === null) {
            $this->guiLoi('empty_order_update', 'Hãy cung cấp trạng thái cần cập nhật.', 422);
            return;
        }

        try {
            $donHang = $this->orderData->capNhatDonHang($maHD, $trangThai, $thanhToan);
        } catch (OrderException $loi) {
            $this->guiLoi($loi->errorCode, $loi->getMessage(), $loi->httpStatus);
            return;
        }

        JsonResponse::gui(['donHang' => $donHang]);
    }

    private function kiemTraDonHang(array $duLieu): ?array
    {
        $ten = $duLieu['tenNguoiNhan'] ?? null;
        $sdt = $duLieu['soDienThoai'] ?? null;
        $diaChi = $duLieu['diaChiGiao'] ?? null;
        $phuongThuc = $duLieu['phuongThucThanhToan'] ?? null;
        $dongHangNhap = $duLieu['dongHang'] ?? null;

        if (!is_string($ten) || !is_string($sdt) || !is_string($diaChi)
            || !is_string($phuongThuc) || !is_array($dongHangNhap)) {
            $this->guiLoi('invalid_order_data', 'Vui lòng cung cấp đầy đủ thông tin nhận hàng và sản phẩm.', 422);
            return null;
        }

        $ten = trim($ten);
        $sdt = trim($sdt);
        $diaChi = trim($diaChi);
        if (
            $ten === '' || preg_match_all('/./us', $ten) > 100
            || preg_match('/\A[0-9]{8,15}\z/', $sdt) !== 1
            || $diaChi === '' || preg_match_all('/./us', $diaChi) > 255
        ) {
            $this->guiLoi('invalid_shipping_details', 'Tên, số điện thoại hoặc địa chỉ nhận hàng không hợp lệ.', 422);
            return null;
        }

        if (!in_array($phuongThuc, ['cod', 'bank_transfer'], true)) {
            $this->guiLoi('invalid_payment_method', 'Phương thức thanh toán không hợp lệ.', 422);
            return null;
        }
        if (!array_is_list($dongHangNhap) || $dongHangNhap === [] || count($dongHangNhap) > 50) {
            $this->guiLoi('invalid_order_items', 'Đơn hàng phải có từ 1 đến 50 dòng sản phẩm.', 422);
            return null;
        }

        $dongHangDaGop = [];
        foreach ($dongHangNhap as $dong) {
            if (!is_array($dong)) {
                $this->guiLoi('invalid_order_items', 'Thông tin sản phẩm trong giỏ hàng không hợp lệ.', 422);
                return null;
            }

            $maSP = $dong['MaSP'] ?? null;
            $soLuong = $dong['SlBan'] ?? null;
            if (!is_string($maSP) || preg_match('/\A[A-Za-z0-9_-]{1,6}\z/', $maSP) !== 1
                || !is_int($soLuong) || $soLuong < 1 || $soLuong > 2147483647) {
                $this->guiLoi('invalid_order_items', 'Mã sản phẩm hoặc số lượng trong giỏ hàng không hợp lệ.', 422);
                return null;
            }

            $dongHangDaGop[$maSP] = ($dongHangDaGop[$maSP] ?? 0) + $soLuong;
            if ($dongHangDaGop[$maSP] > 2147483647) {
                $this->guiLoi('invalid_order_items', 'Số lượng sản phẩm vượt quá giới hạn cho phép.', 422);
                return null;
            }
        }

        $dongHang = [];
        foreach ($dongHangDaGop as $maSP => $soLuong) {
            $dongHang[] = ['MaSP' => $maSP, 'SlBan' => $soLuong];
        }

        return [
            'tenNguoiNhan' => $ten,
            'soDienThoai' => $sdt,
            'diaChiGiao' => $diaChi,
            'phuongThucThanhToan' => $phuongThuc,
            'dongHang' => $dongHang,
        ];
    }

    private function themHuongDanThanhToan(array $donHang): array
    {
        if (($donHang['phuongThuc'] ?? '') !== 'bank_transfer'
            || ($donHang['trangThaiThanhToan'] ?? '') !== 'cho_thanh_toan') {
            return $donHang;
        }

        $chuyenKhoan = $this->layCauHinhChuyenKhoan();
        if ($chuyenKhoan !== null) {
            $donHang['thongTinChuyenKhoan'] = [
                'nganHang' => $chuyenKhoan['nganHang'],
                'soTaiKhoan' => $chuyenKhoan['soTaiKhoan'],
                'chuTaiKhoan' => $chuyenKhoan['chuTaiKhoan'],
                'noiDung' => 'VUONPHO ' . (string) $donHang['MaHD'],
            ];
        }

        return $donHang;
    }

    private function layCauHinhChuyenKhoan(): ?array
    {
        $tepCauHinh = dirname(__DIR__, 3) . '/.env';
        $cauHinh = [];
        if (is_file($tepCauHinh)) {
            $cauHinh = parse_ini_file($tepCauHinh, false, INI_SCANNER_RAW);
            if ($cauHinh === false) {
                throw new RuntimeException('Không thể đọc cấu hình .env ở thư mục gốc dự án.');
            }
        }

        $docGiaTri = static function (string $ten) use ($cauHinh): string {
            $giaTriMoiTruong = getenv($ten);
            return trim((string) ($giaTriMoiTruong !== false ? $giaTriMoiTruong : ($cauHinh[$ten] ?? '')));
        };
        $nganHang = $docGiaTri('BANK_TRANSFER_BANK');
        $soTaiKhoan = $docGiaTri('BANK_TRANSFER_ACCOUNT');
        $chuTaiKhoan = $docGiaTri('BANK_TRANSFER_HOLDER');

        if ($nganHang === '' || $soTaiKhoan === '' || $chuTaiKhoan === '') {
            return null;
        }

        return [
            'nganHang' => $nganHang,
            'soTaiKhoan' => $soTaiKhoan,
            'chuTaiKhoan' => $chuTaiKhoan,
        ];
    }

    private function guiLoi(string $ma, string $thongBao, int $maHttp): void
    {
        JsonResponse::gui([
            'error' => ['code' => $ma, 'message' => $thongBao],
        ], $maHttp);
    }
}
