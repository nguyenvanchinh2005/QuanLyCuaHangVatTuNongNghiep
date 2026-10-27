<?php
declare(strict_types=1);

require_once __DIR__ . '/../http/JsonResponse.php';
require_once __DIR__ . '/../middlewares/Auth.php';
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/AdminData.php';
require_once __DIR__ . '/../models/AuthData.php';
require_once __DIR__ . '/../controllers/ProductController.php';
require_once __DIR__ . '/../controllers/AdminController.php';
require_once __DIR__ . '/../controllers/AuthController.php';

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

if ($duongDan === '/api/auth/session') {
    if ($phuongThuc !== 'GET') {
        $tuChoiPhuongThuc('GET');
        return;
    }

    (new AuthController())->hienThiPhien();
    return;
}

if (in_array($duongDan, ['/api/auth/login', '/api/auth/register', '/api/auth/logout'], true)) {
    if ($phuongThuc !== 'POST') {
        $tuChoiPhuongThuc('POST');
        return;
    }

    $duLieu = $docDuLieuJson();
    if ($duLieu === null) {
        return;
    }

    if ($duongDan === '/api/auth/login') {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }
        $taoKetNoi = require __DIR__ . '/../config/database.php';
        $dieuKhienAuth = new AuthController(new AuthData($taoKetNoi()));
        $dieuKhienAuth->dangNhap($duLieu);
    } elseif ($duongDan === '/api/auth/register') {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }
        $taoKetNoi = require __DIR__ . '/../config/database.php';
        $dieuKhienAuth = new AuthController(new AuthData($taoKetNoi()));
        $dieuKhienAuth->dangKy($duLieu);
    } else {
        (new AuthController())->dangXuat();
    }
    return;
}

if ($duongDan === '/api/quan-tri') {
    if ($phuongThuc !== 'GET') {
        $tuChoiPhuongThuc('GET');
        return;
    }
    if (!Auth::yeuCauVaiTro(['nhan_vien', 'admin'])) {
        return;
    }

    $taoKetNoi = require __DIR__ . '/../config/database.php';
    (new AdminController(new AdminData($taoKetNoi())))->hienThiDuLieu();
    return;
}

if ($duongDan === '/api/san-pham') {
    if ($phuongThuc === 'GET') {
        $taoKetNoi = require __DIR__ . '/../config/database.php';
        $dieuKhienSanPham = new ProductController(new Product($taoKetNoi()));
        $dieuKhienSanPham->hienThiDanhSach();
        return;
    }
    if ($phuongThuc !== 'POST') {
        $tuChoiPhuongThuc('GET, POST');
        return;
    }
    if (!Auth::yeuCauVaiTro(['admin']) || !Auth::kiemTraTokenCsrf()) {
        return;
    }

    $taoKetNoi = require __DIR__ . '/../config/database.php';
    $dieuKhienSanPham = new ProductController(new Product($taoKetNoi()));
    $duLieu = $docDuLieuJson();
    if ($duLieu !== null) {
        $dieuKhienSanPham->taoSanPham($duLieu);
    }
    return;
}

if (preg_match('#^/api/san-pham/([^/]+)(/hinh-anh)?$#D', $duongDan, $khop) === 1) {
    $maSP = rawurldecode($khop[1]);

    if (($khop[2] ?? '') === '/hinh-anh') {
        if ($phuongThuc !== 'GET') {
            $tuChoiPhuongThuc('GET');
            return;
        }
        $taoKetNoi = require __DIR__ . '/../config/database.php';
        $dieuKhienSanPham = new ProductController(new Product($taoKetNoi()));
        $dieuKhienSanPham->hienThiHinhAnh($maSP);
        return;
    }

    if ($phuongThuc === 'GET') {
        $taoKetNoi = require __DIR__ . '/../config/database.php';
        $dieuKhienSanPham = new ProductController(new Product($taoKetNoi()));
        $dieuKhienSanPham->hienThiChiTiet($maSP);
        return;
    }
    if (!in_array($phuongThuc, ['PUT', 'PATCH', 'DELETE'], true)) {
        $tuChoiPhuongThuc('GET, PUT, PATCH, DELETE');
        return;
    }
    if (!Auth::yeuCauVaiTro(['admin']) || !Auth::kiemTraTokenCsrf()) {
        return;
    }
    $taoKetNoi = require __DIR__ . '/../config/database.php';
    $dieuKhienSanPham = new ProductController(new Product($taoKetNoi()));

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
