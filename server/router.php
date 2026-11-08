<?php
declare(strict_types=1);

$duongDan = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if (!is_string($duongDan)) {
    http_response_code(400);
    exit;
}

if (str_starts_with($duongDan, '/server/')) {
    http_response_code(404);
    exit;
}

if (str_starts_with($duongDan, '/api')) {
    require __DIR__ . '/public/index.php';
    return true;
}

return false;
