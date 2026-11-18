<?php
declare(strict_types=1);

final class OrderData
{
    private const CHUYEN_TRANG_THAI = [
        'cho_xac_nhan' => ['dang_xu_ly', 'da_huy'],
        'dang_xu_ly' => ['dang_giao', 'da_huy'],
        'dang_giao' => ['hoan_thanh', 'da_hoan_hang'],
        'hoan_thanh' => ['da_hoan_hang'],
        'da_huy' => [],
        'da_hoan_hang' => [],
    ];

    public function __construct(private PDO $database)
    {
    }

    // =========================================================================
    // LUỒNG TẠO ĐƠN HÀNG VÀ GIAO DỊCH DATABASE (TRANSACTION & TRỪ TỒN KHO)
    // =========================================================================
    public function taoDonHang(string $maTK, array $donHang): array
    {
        // 1. Mở giao dịch Transaction đảm bảo an toàn tuyệt đối
        $this->database->beginTransaction();

        try {
            // 2. Khóa dòng tài khoản và xác thực vai trò khách hàng
            $taiKhoan = $this->layTaiKhoanKhoa($maTK);
            if ($taiKhoan === null) {
                throw new OrderException('account_not_found', 401, 'Tài khoản không còn hoạt động.');
            }
            if (Auth::chuanHoaVaiTro((string) $taiKhoan['VaiTro']) !== 'khach_hang') {
                throw new OrderException('forbidden', 403, 'Chỉ khách hàng mới có thể đặt hàng.');
            }

            // 3. Liên kết hồ sơ khách hàng (khachhang) với tài khoản
            $maKH = $this->layHoacTaoKhachHang($maTK, $taiKhoan, $donHang);
            // 4. Khóa dòng sản phẩm bằng SELECT ... FOR UPDATE để chống bán vượt số lượng tồn kho
            $sanPham = $this->laySanPhamKhoa($donHang['dongHang']);

            // 5. Kiểm tra sản phẩm hợp lệ, giá bán và kiểm tra đủ tồn kho
            foreach ($donHang['dongHang'] as $dongHang) {
                $maSP = $dongHang['MaSP'];
                if (!isset($sanPham[$maSP])) {
                    throw new OrderException(
                        'product_not_found',
                        422,
                        'Một sản phẩm trong giỏ hàng không còn tồn tại.'
                    );
                }
                if (str_starts_with((string) $sanPham[$maSP]['Giaban'], '-')) {
                    throw new OrderException(
                        'invalid_product_price',
                        409,
                        'Giá của một sản phẩm không hợp lệ. Vui lòng liên hệ cửa hàng.'
                    );
                }
                if ((int) $sanPham[$maSP]['Soluong'] < $dongHang['SlBan']) {
                    throw new OrderException(
                        'insufficient_stock',
                        409,
                        'Một sản phẩm trong giỏ hàng không đủ số lượng tồn kho.'
                    );
                }
            }

            // 6. Ghi thông tin đơn hàng mới vào bảng hoadon
            $taoHoaDon = $this->database->prepare(
                'INSERT INTO hoadon (
                    MaHD, Ngaylap, MaKH, MaNv, TenNguoiNhan, SDTNhan, DiaChiGiao,
                    PhuongThucThanhToan, TrangThai, TrangThaiThanhToan
                ) VALUES (
                    :maHD, CURDATE(), :maKH, NULL, :tenNguoiNhan, :sdtNhan, :diaChiGiao,
                    :phuongThuc, :trangThai, :trangThaiThanhToan
                )'
            );
            $maHD = '';
            $taoThanhCong = false;
            for ($lanThu = 0; $lanThu < 8; $lanThu++) {
                $maHD = $this->taoMaHoaDon();
                try {
                    $taoHoaDon->execute([
                        'maHD' => $maHD,
                        'maKH' => $maKH,
                        'tenNguoiNhan' => $donHang['tenNguoiNhan'],
                        'sdtNhan' => $donHang['soDienThoai'],
                        'diaChiGiao' => $donHang['diaChiGiao'],
                        'phuongThuc' => $donHang['phuongThucThanhToan'],
                        'trangThai' => 'cho_xac_nhan',
                        'trangThaiThanhToan' => 'cho_thanh_toan',
                    ]);
                    $taoThanhCong = true;
                    break;
                } catch (PDOException $loi) {
                    if ((int) ($loi->errorInfo[1] ?? 0) !== 1062 || $lanThu === 7) {
                        throw $loi;
                    }
                }
            }
            if (!$taoThanhCong) {
                throw new RuntimeException('Không thể tạo mã hóa đơn duy nhất.');
            }

            // 7. Lưu từng món vào cthoadon và trừ tồn kho sanpham.Soluong trong cùng Transaction
            $taoChiTiet = $this->database->prepare(
                'INSERT INTO cthoadon (MaHD, MaSP, SlBan, GiaBan, Giamgia, ThanhTien)
                 SELECT :maHD, MaSP, :soLuongLuu, Giaban, 0.00, Giaban * :soLuongTinh
                 FROM sanpham
                 WHERE MaSP = :maSP'
            );
            $truTonKho = $this->database->prepare(
                'UPDATE sanpham
                 SET Soluong = Soluong - :soLuong
                 WHERE MaSP = :maSP AND Soluong >= :soLuongConLai'
            );

            foreach ($donHang['dongHang'] as $dongHang) {
                $taoChiTiet->execute([
                    'maHD' => $maHD,
                    'soLuongLuu' => $dongHang['SlBan'],
                    'soLuongTinh' => $dongHang['SlBan'],
                    'maSP' => $dongHang['MaSP'],
                ]);
                if ($taoChiTiet->rowCount() !== 1) {
                    throw new OrderException(
                        'product_not_found',
                        422,
                        'Không thể lưu một sản phẩm trong đơn hàng.'
                    );
                }

                $truTonKho->execute([
                    'soLuong' => $dongHang['SlBan'],
                    'maSP' => $dongHang['MaSP'],
                    'soLuongConLai' => $dongHang['SlBan'],
                ]);
                if ($truTonKho->rowCount() !== 1) {
                    throw new OrderException(
                        'insufficient_stock',
                        409,
                        'Tồn kho đã thay đổi. Vui lòng kiểm tra lại giỏ hàng.'
                    );
                }
            }

            // 8. Đọc lại thông tin đơn hàng vừa tạo để chuẩn bị trả về
            $ketQua = $this->timDonHang($maHD, null);
            if ($ketQua === null) {
                throw new RuntimeException('Không thể đọc lại đơn hàng vừa tạo.');
            }

            // 9. Xác nhận giao dịch thành công (Commit)
            $this->database->commit();
            return $ketQua;
        } catch (Throwable $loi) {
            // 10. Hoàn tác mọi thay đổi nếu có lỗi (Rollback)
            if ($this->database->inTransaction()) {
                $this->database->rollBack();
            }
            throw $loi;
        }
    }

    public function danhSachDonHang(?string $maTK = null): array
    {
        $dieuKien = '';
        $thamSo = [];
        if ($maTK !== null) {
            $dieuKien = 'WHERE h.MaKH = (SELECT t.MaKH FROM taikhoan t WHERE t.MaTK = :maTK)';
            $thamSo['maTK'] = $maTK;
        }

        $cauTruyVan = $this->database->prepare(
            "SELECT h.MaHD, h.Ngaylap, h.MaKH, h.MaNv,
                    h.TenNguoiNhan AS tenNguoiNhan, h.SDTNhan AS soDienThoai,
                    h.DiaChiGiao AS diaChiGiao,
                    h.PhuongThucThanhToan AS phuongThuc,
                    h.TrangThai AS trangThai,
                    h.TrangThaiThanhToan AS trangThaiThanhToan,
                    h.NgayThanhToan AS ngayThanhToan,
                    h.NgayHoanTien AS ngayHoanTien,
                    COALESCE(ct.tong, 0) AS tong,
                    COALESCE(h.TenNguoiNhan, k.TenKH, h.MaKH, 'Khách hàng') AS khach
             FROM hoadon h
             LEFT JOIN khachhang k ON k.MaKH = h.MaKH
             LEFT JOIN (
                 SELECT MaHD, SUM(ThanhTien) AS tong
                 FROM cthoadon
                 GROUP BY MaHD
             ) ct ON ct.MaHD = h.MaHD
             {$dieuKien}
             ORDER BY h.Ngaylap DESC, h.MaHD DESC"
        );
        $cauTruyVan->execute($thamSo);
        $donHang = $cauTruyVan->fetchAll();

        if ($donHang === []) {
            return [];
        }

        $thamSoMa = [];
        $danhSachMa = [];
        foreach ($donHang as $viTri => $don) {
            $tenThamSo = 'maHD' . $viTri;
            $danhSachMa[] = ':' . $tenThamSo;
            $thamSoMa[$tenThamSo] = (string) $don['MaHD'];
        }

        $layDongHang = $this->database->prepare(
            'SELECT c.MaHD, c.MaSP, s.TenSP, s.DviTinh, c.SlBan, c.GiaBan,
                    c.Giamgia, c.ThanhTien AS TongHD, c.ThanhTien
             FROM cthoadon c
             LEFT JOIN sanpham s ON s.MaSP = c.MaSP
             WHERE c.MaHD IN (' . implode(', ', $danhSachMa) . ')
             ORDER BY c.MaHD, c.MaSP'
        );
        $layDongHang->execute($thamSoMa);

        $dongTheoHoaDon = [];
        foreach ($layDongHang->fetchAll() as $dong) {
            $maHD = (string) $dong['MaHD'];
            unset($dong['MaHD']);
            $dong['SlBan'] = (int) $dong['SlBan'];
            $dongTheoHoaDon[$maHD][] = $dong;
        }

        foreach ($donHang as &$don) {
            $don['dongHang'] = $dongTheoHoaDon[(string) $don['MaHD']] ?? [];
        }
        unset($don);

        return $donHang;
    }

    public function chiTietDonHang(string $maHD, ?string $maTK = null): ?array
    {
        return $this->timDonHang($maHD, $maTK);
    }

    public function capNhatDonHang(
        string $maHD,
        ?string $trangThaiMoi,
        ?string $trangThaiThanhToanMoi
    ): array {
        $this->database->beginTransaction();

        try {
            $timHoaDon = $this->database->prepare(
                'SELECT MaHD, PhuongThucThanhToan, TrangThai, TrangThaiThanhToan
                 FROM hoadon
                 WHERE MaHD = :maHD
                 FOR UPDATE'
            );
            $timHoaDon->execute(['maHD' => $maHD]);
            $hoaDon = $timHoaDon->fetch();
            if ($hoaDon === false) {
                throw new OrderException('order_not_found', 404, 'Không tìm thấy đơn hàng.');
            }

            $trangThaiHienTai = (string) ($hoaDon['TrangThai'] ?? '');
            $thanhToanHienTai = (string) ($hoaDon['TrangThaiThanhToan'] ?? 'cho_thanh_toan');
            $phuongThuc = (string) ($hoaDon['PhuongThucThanhToan'] ?? '');

            if ($trangThaiMoi !== null && $trangThaiMoi !== $trangThaiHienTai) {
                if (!in_array($trangThaiMoi, self::CHUYEN_TRANG_THAI[$trangThaiHienTai] ?? [], true)) {
                    throw new OrderException(
                        'invalid_order_transition',
                        409,
                        'Không thể chuyển đơn hàng từ trạng thái hiện tại sang trạng thái này.'
                    );
                }

                if (in_array($trangThaiMoi, ['da_huy', 'da_hoan_hang'], true)) {
                    $this->hoanTonKho($maHD);
                    $thanhToanHienTai = $thanhToanHienTai === 'da_thanh_toan'
                        ? 'cho_hoan_tien'
                        : 'khong_can_thanh_toan';
                }

                if ($trangThaiMoi === 'hoan_thanh' && $phuongThuc === 'cod'
                    && $thanhToanHienTai === 'cho_thanh_toan') {
                    $thanhToanHienTai = 'da_thanh_toan';
                }
                $trangThaiHienTai = $trangThaiMoi;
            }

            if ($trangThaiThanhToanMoi === 'da_thanh_toan') {
                if (!in_array($phuongThuc, ['cod', 'bank_transfer'], true)) {
                    throw new OrderException(
                        'invalid_payment_transition',
                        409,
                        'Không thể xác nhận thanh toán cho hóa đơn chưa có phương thức hợp lệ.'
                    );
                }
                if (in_array($trangThaiHienTai, ['da_huy', 'da_hoan_hang'], true)) {
                    throw new OrderException(
                        'invalid_payment_transition',
                        409,
                        'Không thể xác nhận thanh toán cho đơn đã hủy hoặc đã hoàn hàng.'
                    );
                }
                if ($phuongThuc === 'cod' && $trangThaiHienTai !== 'hoan_thanh') {
                    throw new OrderException(
                        'payment_not_collectable',
                        409,
                        'Chỉ xác nhận thu tiền COD sau khi đơn hàng hoàn thành.'
                    );
                }
                if ($thanhToanHienTai === 'cho_hoan_tien' || $thanhToanHienTai === 'da_hoan_tien') {
                    throw new OrderException(
                        'invalid_payment_transition',
                        409,
                        'Trạng thái hoàn tiền hiện tại không thể chuyển thành đã thanh toán.'
                    );
                }
                $thanhToanHienTai = 'da_thanh_toan';
            } elseif ($trangThaiThanhToanMoi === 'da_hoan_tien'
                && $thanhToanHienTai !== 'da_hoan_tien') {
                if ($thanhToanHienTai !== 'cho_hoan_tien') {
                    throw new OrderException(
                        'invalid_payment_transition',
                        409,
                        'Chỉ có thể xác nhận hoàn tiền khi đơn đang chờ hoàn tiền.'
                    );
                }
                $thanhToanHienTai = 'da_hoan_tien';
            }

            $capNhat = $this->database->prepare(
                'UPDATE hoadon
                 SET TrangThai = :trangThai,
                     TrangThaiThanhToan = :trangThaiThanhToan,
                     NgayThanhToan = CASE
                         WHEN :thanhToanNgay = \'da_thanh_toan\' AND NgayThanhToan IS NULL THEN NOW()
                         ELSE NgayThanhToan
                     END,
                     NgayHoanTien = CASE
                         WHEN :hoanTienNgay = \'da_hoan_tien\' AND NgayHoanTien IS NULL THEN NOW()
                         ELSE NgayHoanTien
                     END
                 WHERE MaHD = :maHD'
            );
            $capNhat->execute([
                'trangThai' => $trangThaiHienTai,
                'trangThaiThanhToan' => $thanhToanHienTai,
                'thanhToanNgay' => $thanhToanHienTai,
                'hoanTienNgay' => $thanhToanHienTai,
                'maHD' => $maHD,
            ]);

            $ketQua = $this->timDonHang($maHD, null);
            if ($ketQua === null) {
                throw new RuntimeException('Không thể đọc lại đơn hàng vừa cập nhật.');
            }

            $this->database->commit();
            return $ketQua;
        } catch (Throwable $loi) {
            if ($this->database->inTransaction()) {
                $this->database->rollBack();
            }
            throw $loi;
        }
    }

    private function layTaiKhoanKhoa(string $maTK): ?array
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT MaKH, VaiTro
             FROM taikhoan
             WHERE MaTK = :maTK
             FOR UPDATE'
        );
        $cauTruyVan->execute(['maTK' => $maTK]);
        $taiKhoan = $cauTruyVan->fetch();

        return $taiKhoan === false ? null : $taiKhoan;
    }

    private function layHoacTaoKhachHang(string $maTK, array $taiKhoan, array $donHang): string
    {
        $maKH = $taiKhoan['MaKH'];
        if (is_string($maKH) && $maKH !== '') {
            $timKhach = $this->database->prepare(
                'SELECT MaKH FROM khachhang WHERE MaKH = :maKH FOR UPDATE'
            );
            $timKhach->execute(['maKH' => $maKH]);
            if ($timKhach->fetchColumn() === false) {
                throw new OrderException(
                    'customer_profile_missing',
                    409,
                    'Tài khoản đang liên kết tới hồ sơ khách hàng không tồn tại.'
                );
            }

            return $maKH;
        }

        for ($lanThu = 0; $lanThu < 8; $lanThu++) {
            $maKH = strtoupper(bin2hex(random_bytes(3)));
            $kiemTraMa = $this->database->prepare(
                'SELECT 1 FROM khachhang WHERE MaKH = :maKH LIMIT 1'
            );
            $kiemTraMa->execute(['maKH' => $maKH]);
            if ($kiemTraMa->fetchColumn() !== false) {
                continue;
            }

            $taoKhach = $this->database->prepare(
                'INSERT INTO khachhang (MaKH, TenKH, DiaChi, SDT)
                 VALUES (:maKH, :tenKH, :diaChi, :sdt)'
            );
            try {
                $taoKhach->execute([
                    'maKH' => $maKH,
                    'tenKH' => $donHang['tenNguoiNhan'],
                    'diaChi' => $donHang['diaChiGiao'],
                    'sdt' => $donHang['soDienThoai'],
                ]);
            } catch (PDOException $loi) {
                if ((int) ($loi->errorInfo[1] ?? 0) === 1062) {
                    continue;
                }
                throw $loi;
            }

            $ganKhach = $this->database->prepare(
                "UPDATE taikhoan
                 SET MaKH = :maKH
                 WHERE MaTK = :maTK AND (MaKH IS NULL OR MaKH = '')"
            );
            $ganKhach->execute(['maKH' => $maKH, 'maTK' => $maTK]);
            if ($ganKhach->rowCount() !== 1) {
                throw new OrderException(
                    'customer_link_conflict',
                    409,
                    'Không thể liên kết hồ sơ khách hàng với tài khoản.'
                );
            }

            return $maKH;
        }

        throw new RuntimeException('Không thể tạo mã hồ sơ khách hàng duy nhất.');
    }

    private function laySanPhamKhoa(array $dongHang): array
    {
        $thamSo = [];
        $danhSachMa = [];
        foreach ($dongHang as $viTri => $dong) {
            $tenThamSo = 'maSP' . $viTri;
            $danhSachMa[] = ':' . $tenThamSo;
            $thamSo[$tenThamSo] = $dong['MaSP'];
        }

        $cauTruyVan = $this->database->prepare(
            'SELECT MaSP, TenSP, Giaban, Soluong
             FROM sanpham
             WHERE MaSP IN (' . implode(', ', $danhSachMa) . ')
             ORDER BY MaSP
             FOR UPDATE'
        );
        $cauTruyVan->execute($thamSo);

        $sanPham = [];
        foreach ($cauTruyVan->fetchAll() as $dong) {
            $sanPham[(string) $dong['MaSP']] = $dong;
        }

        return $sanPham;
    }

    private function taoMaHoaDon(): string
    {
        $kiemTraMa = $this->database->prepare(
            'SELECT 1 FROM hoadon WHERE MaHD = :maHD LIMIT 1'
        );

        for ($lanThu = 0; $lanThu < 8; $lanThu++) {
            $maHD = strtoupper(bin2hex(random_bytes(3)));
            $kiemTraMa->execute(['maHD' => $maHD]);
            if ($kiemTraMa->fetchColumn() === false) {
                return $maHD;
            }
        }

        throw new RuntimeException('Không thể tạo mã hóa đơn duy nhất.');
    }

    private function timDonHang(string $maHD, ?string $maTK): ?array
    {
        $dieuKienTaiKhoan = '';
        $thamSo = ['maHD' => $maHD];
        if ($maTK !== null) {
            $dieuKienTaiKhoan = 'AND h.MaKH = (SELECT t.MaKH FROM taikhoan t WHERE t.MaTK = :maTK)';
            $thamSo['maTK'] = $maTK;
        }

        $cauTruyVan = $this->database->prepare(
            "SELECT h.MaHD, h.Ngaylap, h.MaKH, h.MaNv,
                    h.TenNguoiNhan AS tenNguoiNhan, h.SDTNhan AS soDienThoai,
                    h.DiaChiGiao AS diaChiGiao,
                    h.PhuongThucThanhToan AS phuongThuc,
                    h.TrangThai AS trangThai,
                    h.TrangThaiThanhToan AS trangThaiThanhToan,
                    h.NgayThanhToan AS ngayThanhToan,
                    h.NgayHoanTien AS ngayHoanTien,
                    COALESCE(ct.tong, 0) AS tong,
                    COALESCE(h.TenNguoiNhan, k.TenKH, h.MaKH, 'Khách hàng') AS khach
             FROM hoadon h
             LEFT JOIN khachhang k ON k.MaKH = h.MaKH
             LEFT JOIN (
                 SELECT MaHD, SUM(ThanhTien) AS tong
                 FROM cthoadon
                 GROUP BY MaHD
             ) ct ON ct.MaHD = h.MaHD
             WHERE h.MaHD = :maHD {$dieuKienTaiKhoan}
             LIMIT 1"
        );
        $cauTruyVan->execute($thamSo);
        $donHang = $cauTruyVan->fetch();

        if ($donHang === false) {
            return null;
        }

        $layDongHang = $this->database->prepare(
            'SELECT c.MaSP, s.TenSP, s.DviTinh, c.SlBan, c.GiaBan,
                    c.Giamgia, c.ThanhTien AS TongHD, c.ThanhTien
             FROM cthoadon c
             LEFT JOIN sanpham s ON s.MaSP = c.MaSP
             WHERE c.MaHD = :maHD
             ORDER BY c.MaSP'
        );
        $layDongHang->execute(['maHD' => $maHD]);
        $donHang['dongHang'] = $layDongHang->fetchAll();
        foreach ($donHang['dongHang'] as &$dong) {
            $dong['SlBan'] = (int) $dong['SlBan'];
        }
        unset($dong);

        return $donHang;
    }

    private function hoanTonKho(string $maHD): void
    {
        $layDongHang = $this->database->prepare(
            'SELECT MaSP, SlBan
             FROM cthoadon
             WHERE MaHD = :maHD
             ORDER BY MaSP
             FOR UPDATE'
        );
        $layDongHang->execute(['maHD' => $maHD]);

        $congTonKho = $this->database->prepare(
            'UPDATE sanpham
             SET Soluong = Soluong + :soLuongCong
             WHERE MaSP = :maSP AND Soluong <= 2147483647 - :soLuongGioiHan'
        );
        foreach ($layDongHang->fetchAll() as $dong) {
            $soLuong = (int) $dong['SlBan'];
            $congTonKho->execute([
                'soLuongCong' => $soLuong,
                'maSP' => $dong['MaSP'],
                'soLuongGioiHan' => $soLuong,
            ]);
            if ($congTonKho->rowCount() !== 1) {
                throw new OrderException(
                    'stock_restore_conflict',
                    409,
                    'Không thể hoàn lại tồn kho; vui lòng kiểm tra sản phẩm trước khi tiếp tục.'
                );
            }
        }
    }
}
