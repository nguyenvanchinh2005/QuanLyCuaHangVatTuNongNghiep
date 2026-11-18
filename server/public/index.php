<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/http/JsonResponse.php';
require_once __DIR__ . '/../src/middlewares/ErrorHandler.php';
require_once __DIR__ . '/../src/middlewares/Auth.php';
require_once __DIR__ . '/../src/models/AuthData.php';

ErrorHandler::dangKy();
Auth::batDauPhien();

header('Content-Type: application/json; charset=utf-8');

// Một kết nối PDO dùng chung cho cả request
$taoKetNoiGoc = require __DIR__ . '/../src/config/database.php';
$pdoDungChung = null;
$ketNoi = static function () use (&$pdoDungChung, $taoKetNoiGoc): PDO {
    return $pdoDungChung ??= $taoKetNoiGoc();
};

// Đồng bộ vai trò khóa từ CSDL mỗi request
Auth::dongBoPhien(static fn (string $maTK): ?array => (new AuthData($ketNoi()))->timTheoMaTaiKhoan($maTK));

require __DIR__ . '/../src/routes/api.php';
