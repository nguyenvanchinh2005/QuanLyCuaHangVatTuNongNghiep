<?php
declare(strict_types=1);

final class Product
{
    public function __construct(private PDO $database)
    {
    }

    public function danhSach(): array
    {
        $cauTruyVan = $this->database->query(
            'SELECT MaSP, TenSP, Giaban, Soluong, TenNCC, DviTinh,
                    (HinhAnh IS NOT NULL AND OCTET_LENGTH(HinhAnh) > 0) AS CoHinhAnh
             FROM sanpham
             ORDER BY TenSP, MaSP'
        );

        return array_map([$this, 'chuanHoaSanPham'], $cauTruyVan->fetchAll());
    }

    public function timTheoMa(string $maSP): ?array
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT MaSP, TenSP, Giaban, Soluong, TenNCC, DviTinh,
                    (HinhAnh IS NOT NULL AND OCTET_LENGTH(HinhAnh) > 0) AS CoHinhAnh
             FROM sanpham
             WHERE MaSP = :maSP
             LIMIT 1'
        );
        $cauTruyVan->execute(['maSP' => $maSP]);
        $sanPham = $cauTruyVan->fetch();

        return $sanPham === false ? null : $this->chuanHoaSanPham($sanPham);
    }

    public function timHinhAnhTheoMa(string $maSP): ?string
    {
        $cauTruyVan = $this->database->prepare(
            'SELECT HinhAnh
             FROM sanpham
             WHERE MaSP = :maSP
             LIMIT 1'
        );
        $cauTruyVan->execute(['maSP' => $maSP]);
        $hinhAnh = $cauTruyVan->fetchColumn();

        return $hinhAnh === false || $hinhAnh === null || $hinhAnh === '' ? null : $hinhAnh;
    }

    public function tao(array $sanPham): void
    {
        $cauTruyVan = $this->database->prepare(
            'INSERT INTO sanpham (MaSP, TenSP, Giaban, Soluong, TenNCC, DviTinh)
             VALUES (:maSP, :tenSP, :giaBan, :soLuong, :tenNCC, :donViTinh)'
        );
        $cauTruyVan->execute($this->thamSoSanPham($sanPham));
    }

    public function capNhat(string $maSP, array $sanPham): bool
    {
        $thamSo = $this->thamSoSanPham($sanPham);
        unset($thamSo['maSP']);
        $thamSo['maSP'] = $maSP;
        $cauTruyVan = $this->database->prepare(
            'UPDATE sanpham
             SET TenSP = :tenSP, Giaban = :giaBan, Soluong = :soLuong,
                 TenNCC = :tenNCC, DviTinh = :donViTinh
             WHERE MaSP = :maSP'
        );
        $cauTruyVan->execute($thamSo);

        return $cauTruyVan->rowCount() > 0 || $this->timTheoMa($maSP) !== null;
    }

    public function xoa(string $maSP): bool
    {
        $cauTruyVan = $this->database->prepare('DELETE FROM sanpham WHERE MaSP = :maSP');
        $cauTruyVan->execute(['maSP' => $maSP]);

        return $cauTruyVan->rowCount() > 0;
    }

    private function thamSoSanPham(array $sanPham): array
    {
        return [
            'maSP' => $sanPham['MaSP'],
            'tenSP' => $sanPham['TenSP'],
            'giaBan' => $sanPham['Giaban'],
            'soLuong' => $sanPham['Soluong'],
            'tenNCC' => $sanPham['TenNCC'],
            'donViTinh' => $sanPham['DviTinh'],
        ];
    }

    private function chuanHoaSanPham(array $sanPham): array
    {
        $sanPham['Giaban'] = $sanPham['Giaban'] === null ? null : (int) $sanPham['Giaban'];
        $sanPham['Soluong'] = $sanPham['Soluong'] === null ? null : (int) $sanPham['Soluong'];
        $sanPham['DanhMuc'] = $this->xacDinhDanhMuc((string) ($sanPham['TenSP'] ?? ''));
        $sanPham['NhomDanhMuc'] = $this->xacDinhNhomDanhMuc((string) ($sanPham['TenSP'] ?? ''));
        $sanPham['anh'] = (bool) $sanPham['CoHinhAnh']
            ? '/api/san-pham/' . rawurlencode((string) $sanPham['MaSP']) . '/hinh-anh'
            : null;
        unset($sanPham['CoHinhAnh']);

        return $sanPham;
    }

    private function xacDinhDanhMuc(string $tenSanPham): string
    {
        $cacNhomTuKhoa = [
            'Thuốc Bảo Vệ Thực Vật' => '/thuốc|trừ sâu|trừ bệnh|trừ nấm|sâu bệnh|antracol|neemnim|nấm 3 màu/iu',
            'Vật Tư Trồng Lan' => '/hoa lan|trồng lan|giá thể lan|chậu lan|phân bón lan/iu',
            'Vật Tư Trồng Hoa Hồng' => '/hoa hồng|trồng hồng|phân bón hoa hồng/iu',
            'Vật Tư Trồng Bonsai' => '/bonsai/iu',
            'Vật Tư Kiểng Lá' => '/kiểng lá/iu',
            'Vật Tư Trồng Rau' => '/trồng rau|rau sạch|khay trồng rau|phân bón rau|đất.*rau/iu',
            'Vật Tư Trồng Hoa Kiểng' => '/hoa kiểng|hoa hồng|bonsai|kiểng lá|cây cảnh|phân bón hoa/iu',
            'Vật Tư Aquaponics' => '/aquaponics|thủy canh|thuỷ canh|bơm nước|máy bơm/iu',
            'Kích Thích Sinh Trưởng' => '/kích rễ|kích chồi|kích thích sinh trưởng|điều hòa sinh trưởng|điều hoà sinh trưởng|dưỡng hoa|dưỡng trái|comcat|dek[a]?mon/iu',
            'Phân Bón' => '/phân bón|phân hữu cơ|phân vi sinh|phân npk|kali|dưỡng cây/iu',
            'Hạt Giống' => '/hạt giống|hạt gieo|hạt rau|hạt hoa/iu',
            'Đất Sạch & Giá Thể' => '/đất|giá thể|xơ dừa|mụn dừa|perlite|vermiculite|potting soil/iu',
            'Mẫu Chậu Mới 2026' => '/chậu|khay trồng|bầu ươm/iu',
            'Dụng Cụ Làm Vườn' => '/bình tưới|bình xịt|dụng cụ|kéo cắt|máy phun/iu',
        ];

        foreach ($cacNhomTuKhoa as $danhMuc => $tuKhoa) {
            if (preg_match($tuKhoa, $tenSanPham) === 1) {
                return $danhMuc;
            }
        }

        return 'Vật Tư Khác';
    }

    private function xacDinhNhomDanhMuc(string $tenSanPham): string
    {
        $cacNhomTuKhoa = [
            'Thuốc Bảo Vệ Thực Vật' => [
                'Trừ sâu' => '/trừ sâu|sâu hại/iu',
                'Trừ bệnh' => '/trừ bệnh|bệnh cây|trị thối|thối nhũn/iu',
                'Trừ nấm' => '/trừ nấm|nấm bệnh/iu',
                'Chế phẩm sinh học' => '/nấm 3 màu|bio-hk/iu',
            ],
            'Phân Bón' => [
                'Phân hữu cơ' => '/hữu cơ|organic|bio-humic/iu',
                'Phân NPK' => '/npk|đa lượng|kali/iu',
                'Phân vi sinh' => '/vi sinh|microbe/iu',
                'Phân bón lá' => '/bón lá|dưỡng lá/iu',
            ],
            'Hạt Giống' => [
                'Hạt giống rau' => '/hạt giống.*rau|rau.*hạt giống|cải xoăn|kale|mồng tơi/iu',
                'Hạt giống hoa' => '/hạt giống.*hoa|hoa.*hạt giống|mai địa thảo/iu',
            ],
            'Đất Sạch & Giá Thể' => [
                'Đất trồng cây' => '/đất trồng|potting soil/iu',
                'Giá thể trồng cây' => '/giá thể|xơ dừa|mụn dừa|perlite|vermiculite|đất nung|sỏi nhẹ/iu',
            ],
            'Vật Tư Aquaponics' => [
                'Máy bơm & sục khí' => '/bơm|sục khí/iu',
                'Dung dịch thủy canh' => '/dung dịch|thủy canh|thuỷ canh/iu',
            ],
            'Vật Tư Trồng Lan' => [
                'Giá thể trồng lan' => '/giá thể lan/iu',
                'Chậu trồng lan' => '/chậu lan/iu',
                'Phân bón cho lan' => '/phân bón lan/iu',
            ],
            'Vật Tư Trồng Hoa Hồng' => [
                'Đất trồng hoa hồng' => '/đất.*hoa hồng/iu',
                'Phân bón hoa hồng' => '/phân.*hoa hồng/iu',
                'Thuốc dưỡng hoa hồng' => '/dưỡng.*hoa hồng/iu',
                'Kéo cắt tỉa' => '/kéo cắt/iu',
            ],
            'Vật Tư Trồng Bonsai' => [
                'Đất trồng bonsai' => '/đất.*bonsai/iu',
                'Chậu bonsai' => '/chậu.*bonsai/iu',
                'Phân bón bonsai' => '/phân.*bonsai/iu',
                'Dụng cụ bonsai' => '/dụng cụ.*bonsai/iu',
            ],
            'Vật Tư Kiểng Lá' => [
                'Đất trộn kiểng lá' => '/đất.*kiểng lá/iu',
                'Chậu kiểng lá' => '/chậu.*kiểng lá/iu',
                'Phân bón kiểng lá' => '/phân.*kiểng lá/iu',
            ],
            'Vật Tư Trồng Rau' => [
                'Khay trồng rau' => '/khay.*rau|trồng rau/iu',
                'Đất trồng rau' => '/đất.*rau/iu',
                'Phân bón rau' => '/phân.*rau/iu',
            ],
            'Vật Tư Trồng Hoa Kiểng' => [
                'Chậu trồng hoa' => '/chậu.*hoa/iu',
                'Đất & giá thể' => '/đất|giá thể/iu',
                'Phân bón hoa' => '/phân.*hoa/iu',
                'Dụng cụ cắt tỉa' => '/kéo|cắt tỉa/iu',
            ],
            'Kích Thích Sinh Trưởng' => [
                'Kích rễ' => '/kích rễ/iu',
                'Kích chồi' => '/kích chồi/iu',
                'Dưỡng hoa & trái' => '/dưỡng hoa|dưỡng trái/iu',
            ],
            'Dụng Cụ Làm Vườn' => [
                'Bình tưới' => '/bình tưới/iu',
                'Kéo cắt tỉa' => '/kéo cắt/iu',
                'Dụng cụ chăm sóc' => '/dụng cụ|bình xịt|máy phun/iu',
            ],
            'Mẫu Chậu Mới 2026' => [
                'Chậu trồng' => '/chậu/iu',
                'Khay & kệ trồng rau' => '/khay|kệ/iu',
                'Bầu ươm' => '/bầu ươm/iu',
            ],
        ];
        $danhMuc = $this->xacDinhDanhMuc($tenSanPham);

        foreach ($cacNhomTuKhoa[$danhMuc] ?? [] as $nhom => $tuKhoa) {
            if (preg_match($tuKhoa, $tenSanPham) === 1) {
                return $nhom;
            }
        }

        if ($danhMuc === 'Hạt Giống') {
            return 'Hạt giống rau';
        }

        return $danhMuc;
    }
}
