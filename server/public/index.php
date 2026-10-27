<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/http/JsonResponse.php';
require_once __DIR__ . '/../src/middlewares/ErrorHandler.php';
require_once __DIR__ . '/../src/middlewares/Auth.php';

ErrorHandler::dangKy();
Auth::batDauPhien();

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../src/routes/api.php';
