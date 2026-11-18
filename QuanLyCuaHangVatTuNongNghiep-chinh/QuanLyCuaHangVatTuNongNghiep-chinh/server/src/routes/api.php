<?php
declare(strict_types=1);

require_once __DIR__ . '/../http/JsonResponse.php';
require_once __DIR__ . '/../middlewares/Auth.php';
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/AdminData.php';
require_once __DIR__ . '/../models/AuthData.php';
require_once __DIR__ . '/../models/ActivityLog.php';
require_once __DIR__ . '/../models/ProfileData.php';
require_once __DIR__ . '/../controllers/ProductController.php';
require_once __DIR__ . '/../controllers/AdminController.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/TaiKhoanController.php';
require_once __DIR__ . '/../controllers/ProfileController.php';

// Dùng lại kết nối chung do public/index.php tạo; nếu file này được gọi riêng thì tự tạo.
if (!isset($ketNoi) || !is_callable($ketNoi)) {
    $taoKetNoiGoc = require __DIR__ . '/../config/database.php';
    $pdoDungChung = null;
    $ketNoi = static function () use (&$pdoDungChung, $taoKetNoiGoc): PDO {
        return $pdoDungChung ??= $taoKetNoiGoc();
    };
}

$phuongThuc = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$duongDan = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if (!is_string($duongDan)) {
    JsonResponse::gui(['error' => ['code' => 'bad_request', 'message' => 'Đường dẫn không hợp lệ.']], 400);
    return;
}

$docDuLieuJson = static function (): ?array {
    $duLieu = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($duLieu)) {
        JsonResponse::gui([
            'error' => ['code' => 'invalid_json', 'message' => 'Nội dung yêu cầu phải là JSON hợp lệ.'],
        ], 400);
        return null;
    }

    return $duLieu;
};

$tuChoiPhuongThuc = static function (string $choPhep): void {
    header('Allow: ' . $choPhep);
    JsonResponse::gui([
        'error' => ['code' => 'method_not_allowed', 'message' => 'Phương thức không được hỗ trợ.'],
    ], 405);
};

$taoDieuKhienSanPham = static fn (): ProductController => new ProductController(
    new Product($ketNoi()),
    new ActivityLog($ketNoi())
);

// ---------- Xác thực ----------
if ($duongDan === '/api/auth/session') {
    if ($phuongThuc !== 'GET') {
        $tuChoiPhuongThuc('GET');
        return;
    }

    (new AuthController())->hienThiPhien();
    return;
}

if (in_array($duongDan, [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/send-otp',
    '/api/auth/reset-password',
    '/api/auth/change-password',
], true)) {
    if ($phuongThuc !== 'POST') {
        $tuChoiPhuongThuc('POST');
        return;
    }

    $duLieu = $docDuLieuJson();
    if ($duLieu === null) {
        return;
    }

    if ($duongDan === '/api/auth/logout') {
        (new AuthController())->dangXuat();
        return;
    }

    if (!Auth::kiemTraTokenCsrf()) {
        return;
    }

    $dieuKhienAuth = new AuthController(new AuthData($ketNoi()));

    match ($duongDan) {
        '/api/auth/send-otp' => $dieuKhienAuth->guiMaXacNhan($duLieu),
        '/api/auth/login' => $dieuKhienAuth->dangNhap($duLieu),
        '/api/auth/register' => $dieuKhienAuth->dangKy($duLieu),
        '/api/auth/reset-password' => $dieuKhienAuth->quenMatKhau($duLieu),
        '/api/auth/change-password' => $dieuKhienAuth->doiMatKhau($duLieu),
    };
    return;
}

//Hồ sơ cá nhân (khách hàng) 
if ($duongDan === '/api/ho-so') {
    if ($phuongThuc === 'GET') {
        if (Auth::yeuCauQuyen('ho_so.xem')) {
            (new ProfileController(new ProfileData($ketNoi())))->hienThi();
        }
        return;
    }
    if (!in_array($phuongThuc, ['PUT', 'PATCH'], true)) {
        $tuChoiPhuongThuc('GET, PUT, PATCH');
        return;
    }
    if (!Auth::yeuCauQuyen('ho_so.sua') || !Auth::kiemTraTokenCsrf()) {
        return;
    }
    $duLieu = $docDuLieuJson();
    if ($duLieu !== null) {
        (new ProfileController(new ProfileData($ketNoi())))->capNhat($duLieu);
    }
    return;
}

//  quản trị
if ($duongDan === '/api/quan-tri') {
    if ($phuongThuc !== 'GET') {
        $tuChoiPhuongThuc('GET');
        return;
    }
    if (!Auth::yeuCauQuyen('quan_tri.xem')) {
        return;
    }

    // Danh sách tài khoản chỉ gửi cho người có quyền tai_khoan.xem (admin).
    (new AdminController(new AdminData($ketNoi())))->hienThiDuLieu(Auth::coQuyen('tai_khoan.xem'));
    return;
}

if ($duongDan === '/api/nhat-ky') {
    if ($phuongThuc !== 'GET') {
        $tuChoiPhuongThuc('GET');
        return;
    }
    if (!Auth::yeuCauQuyen('nhat_ky.xem')) {
        return;
    }

    (new AdminController(new AdminData($ketNoi()), new ActivityLog($ketNoi())))->hienThiNhatKy();
    return;
}

//  Quản lý tài khoản (admin)
if ($duongDan === '/api/tai-khoan') {
    if ($phuongThuc !== 'POST') {
        $tuChoiPhuongThuc('POST');
        return;
    }
    if (!Auth::yeuCauQuyen('tai_khoan.tao') || !Auth::kiemTraTokenCsrf()) {
        return;
    }
    $duLieu = $docDuLieuJson();
    if ($duLieu !== null) {
        (new TaiKhoanController(new AuthData($ketNoi()), new ActivityLog($ketNoi())))->taoNhanVien($duLieu);
    }
    return;
}

if (preg_match('#^/api/tai-khoan/([^/]+)/(trang-thai|vai-tro)$#D', $duongDan, $khop) === 1) {
    if ($phuongThuc !== 'PATCH') {
        $tuChoiPhuongThuc('PATCH');
        return;
    }
    $quyenCan = $khop[2] === 'trang-thai' ? 'tai_khoan.khoa' : 'tai_khoan.doi_vai_tro';
    if (!Auth::yeuCauQuyen($quyenCan) || !Auth::kiemTraTokenCsrf()) {
        return;
    }
    $duLieu = $docDuLieuJson();
    if ($duLieu === null) {
        return;
    }

    $dieuKhienTaiKhoan = new TaiKhoanController(new AuthData($ketNoi()), new ActivityLog($ketNoi()));
    $maTK = rawurldecode($khop[1]);
    if ($khop[2] === 'trang-thai') {
        $dieuKhienTaiKhoan->datTrangThai($maTK, $duLieu);
    } else {
        $dieuKhienTaiKhoan->datVaiTro($maTK, $duLieu);
    }
    return;
}

//Sản phẩm 
if ($duongDan === '/api/san-pham') {
    if ($phuongThuc === 'GET') {
        // Chỉ nhân viên/admin mới được xem cả sản phẩm đã ẩn (?tatca=1).
        $kemDaAn = ($_GET['tatca'] ?? '') === '1' && Auth::coQuyen('quan_tri.xem');
        $taoDieuKhienSanPham()->hienThiDanhSach($kemDaAn);
        return;
    }
    if ($phuongThuc !== 'POST') {
        $tuChoiPhuongThuc('GET, POST');
        return;
    }
    if (!Auth::yeuCauQuyen('san_pham.them') || !Auth::kiemTraTokenCsrf()) {
        return;
    }

    $duLieu = $docDuLieuJson();
    if ($duLieu !== null) {
        $taoDieuKhienSanPham()->taoSanPham($duLieu);
    }
    return;
}

if (preg_match('#^/api/san-pham/([^/]+)(/hinh-anh|/an|/khoi-phuc)?$#D', $duongDan, $khop) === 1) {
    $maSP = rawurldecode($khop[1]);
    $hauTo = $khop[2] ?? '';

    if ($hauTo === '/hinh-anh') {
        if ($phuongThuc !== 'GET') {
            $tuChoiPhuongThuc('GET');
            return;
        }
        $taoDieuKhienSanPham()->hienThiHinhAnh($maSP);
        return;
    }

    if ($hauTo === '/an' || $hauTo === '/khoi-phuc') {
        if ($phuongThuc !== 'POST') {
            $tuChoiPhuongThuc('POST');
            return;
        }
        $quyenCan = $hauTo === '/an' ? 'san_pham.an' : 'san_pham.khoi_phuc';
        if (!Auth::yeuCauQuyen($quyenCan) || !Auth::kiemTraTokenCsrf()) {
            return;
        }
        $taoDieuKhienSanPham()->anSanPham($maSP, $hauTo === '/an');
        return;
    }

    if ($phuongThuc === 'GET') {
        $taoDieuKhienSanPham()->hienThiChiTiet($maSP, Auth::coQuyen('quan_tri.xem'));
        return;
    }
    if (!in_array($phuongThuc, ['PUT', 'PATCH', 'DELETE'], true)) {
        $tuChoiPhuongThuc('GET, PUT, PATCH, DELETE');
        return;
    }

    // Sửa: nhân viên + admin. Xóa vĩnh viễn: chỉ admin.
    $quyenCan = $phuongThuc === 'DELETE' ? 'san_pham.xoa' : 'san_pham.sua';
    if (!Auth::yeuCauQuyen($quyenCan) || !Auth::kiemTraTokenCsrf()) {
        return;
    }
    $dieuKhienSanPham = $taoDieuKhienSanPham();

    if ($phuongThuc === 'DELETE') {
        $dieuKhienSanPham->xoaSanPham($maSP);
        return;
    }

    $duLieu = $docDuLieuJson();
    if ($duLieu !== null) {
        $dieuKhienSanPham->capNhatSanPham($maSP, $duLieu);
    }
    return;
}

JsonResponse::gui(['error' => ['code' => 'not_found', 'message' => 'Không tìm thấy API.']], 404);
