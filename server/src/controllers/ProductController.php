<?php
declare(strict_types=1);

final class ProductController
{
    public function __construct(private Product $products)
    {
    }

    public function hienThiDanhSach(): void
    {
        JsonResponse::gui($this->products->danhSach());
    }

    public function hienThiChiTiet(string $maSP): void
    {
        $sanPham = $this->products->timTheoMa($maSP);

        if ($sanPham === null) {
            JsonResponse::gui([
                'error' => [
                    'code' => 'product_not_found',
                    'message' => 'Không tìm thấy sản phẩm.',
                ],
            ], 404);
            return;
        }

        JsonResponse::gui($sanPham);
    }

    public function hienThiHinhAnh(string $maSP): void
    {
        $hinhAnh = $this->products->timHinhAnhTheoMa($maSP);

        if ($hinhAnh === null) {
            JsonResponse::gui([
                'error' => [
                    'code' => 'image_not_found',
                    'message' => 'Sản phẩm chưa có hình ảnh.',
                ],
            ], 404);
            return;
        }

        $loaiAnh = $this->xacDinhLoaiHinhAnh($hinhAnh);
        if ($loaiAnh === null) {
            JsonResponse::gui([
                'error' => [
                    'code' => 'unsupported_image',
                    'message' => 'Định dạng ảnh sản phẩm không được hỗ trợ.',
                ],
            ], 415);
            return;
        }

        header('Content-Type: ' . $loaiAnh);
        header('Cache-Control: public, max-age=86400');
        header('X-Content-Type-Options: nosniff');
        echo $hinhAnh;
    }

    public function taoSanPham(array $duLieu): void
    {
        $sanPham = $this->kiemTraSanPham($duLieu);
        if ($sanPham === null) {
            return;
        }

        if ($this->products->timTheoMa($sanPham['MaSP']) !== null) {
            JsonResponse::gui([
                'error' => ['code' => 'product_code_exists', 'message' => 'Mã sản phẩm đã tồn tại. Hãy chọn mã khác.'],
            ], 409);
            return;
        }

        $this->products->tao($sanPham);
        JsonResponse::gui($this->products->timTheoMa($sanPham['MaSP']), 201);
    }

    public function capNhatSanPham(string $maSP, array $duLieu): void
    {
        $sanPham = $this->kiemTraSanPham($duLieu);
        if ($sanPham === null) {
            return;
        }

        if (!$this->products->capNhat($maSP, $sanPham)) {
            JsonResponse::gui([
                'error' => ['code' => 'product_not_found', 'message' => 'Không tìm thấy sản phẩm cần cập nhật.'],
            ], 404);
            return;
        }

        JsonResponse::gui($this->products->timTheoMa($maSP));
    }

    public function xoaSanPham(string $maSP): void
    {
        try {
            $daXoa = $this->products->xoa($maSP);
        } catch (PDOException $error) {
            if ($error->getCode() !== '23000') {
                throw $error;
            }

            JsonResponse::gui([
                'error' => ['code' => 'product_in_use', 'message' => 'Không thể xóa sản phẩm đã được sử dụng trong hóa đơn.'],
            ], 409);
            return;
        }

        if (!$daXoa) {
            JsonResponse::gui([
                'error' => ['code' => 'product_not_found', 'message' => 'Không tìm thấy sản phẩm cần xóa.'],
            ], 404);
            return;
        }

        JsonResponse::gui(['daXoa' => true]);
    }

    private function kiemTraSanPham(array $duLieu): ?array
    {
        $maSPNhap = $duLieu['MaSP'] ?? null;
        $tenSPNhap = $duLieu['TenSP'] ?? null;
        $tenNCCNhap = $duLieu['TenNCC'] ?? null;
        $donViTinhNhap = $duLieu['DviTinh'] ?? null;
        if (!is_string($maSPNhap) || !is_string($tenSPNhap) || !is_string($tenNCCNhap) || !is_string($donViTinhNhap)) {
            JsonResponse::gui([
                'error' => ['code' => 'invalid_product', 'message' => 'Thông tin sản phẩm không hợp lệ.'],
            ], 422);
            return null;
        }

        $maSP = trim($maSPNhap);
        $tenSP = trim($tenSPNhap);
        $tenNCC = trim($tenNCCNhap);
        $donViTinh = trim($donViTinhNhap);
        $doDaiTenSP = preg_match_all('/./us', $tenSP);
        $doDaiTenNCC = preg_match_all('/./us', $tenNCC);
        $doDaiDonViTinh = preg_match_all('/./us', $donViTinh);
        $giaBan = filter_var($duLieu['Giaban'] ?? null, FILTER_VALIDATE_INT);
        $soLuong = filter_var($duLieu['Soluong'] ?? null, FILTER_VALIDATE_INT);

        if ($maSP === '' || strlen($maSP) > 32
            || $tenSP === '' || $doDaiTenSP === false || $doDaiTenSP > 255
            || $tenNCC === '' || $doDaiTenNCC === false || $doDaiTenNCC > 255
            || $donViTinh === '' || $doDaiDonViTinh === false || $doDaiDonViTinh > 50
            || $giaBan === false || $giaBan < 0
            || $soLuong === false || $soLuong < 0) {
            JsonResponse::gui([
                'error' => [
                    'code' => 'invalid_product',
                    'message' => 'Kiểm tra mã, tên, nhà cung cấp, đơn vị, giá và tồn kho sản phẩm.',
                ],
            ], 422);
            return null;
        }

        return [
            'MaSP' => $maSP,
            'TenSP' => $tenSP,
            'Giaban' => $giaBan,
            'Soluong' => $soLuong,
            'TenNCC' => $tenNCC,
            'DviTinh' => $donViTinh,
        ];
    }

    private function xacDinhLoaiHinhAnh(string $hinhAnh): ?string
    {
        if (str_starts_with($hinhAnh, "\x89PNG\r\n\x1a\n")) {
            return 'image/png';
        }

        if (str_starts_with($hinhAnh, "\xFF\xD8\xFF")) {
            return 'image/jpeg';
        }

        if (str_starts_with($hinhAnh, 'GIF87a') || str_starts_with($hinhAnh, 'GIF89a')) {
            return 'image/gif';
        }

        if (substr($hinhAnh, 0, 4) === 'RIFF' && substr($hinhAnh, 8, 4) === 'WEBP') {
            return 'image/webp';
        }

        return null;
    }
}
