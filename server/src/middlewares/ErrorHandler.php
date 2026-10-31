<?php
declare(strict_types=1);

final class ErrorHandler
{
    public static function dangKy(): void
    {
        set_exception_handler(static function (Throwable $error): void {
            error_log(sprintf(
                '[Vuon Pho API] %s: %s in %s:%d',
                $error::class,
                $error->getMessage(),
                $error->getFile(),
                $error->getLine()
            ));

            if ($error instanceof PDOException) {
                JsonResponse::gui([
                    'error' => [
                        'code' => 'database_unavailable',
                        'message' => 'Không thể kết nối cơ sở dữ liệu.',
                    ],
                ], 503);
                return;
            }

            JsonResponse::gui([
                'error' => [
                    'code' => 'internal_server_error',
                    'message' => 'Đã xảy ra lỗi máy chủ.',
                ],
            ], 500);
        });
    }
}
