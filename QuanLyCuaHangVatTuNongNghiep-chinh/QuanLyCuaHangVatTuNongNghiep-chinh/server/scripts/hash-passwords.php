<?php
declare(strict_types=1);

/**
 * Băm các mật khẩu còn lưu dạng chữ thường trong bảng taikhoan.
 *
 * Chạy thử (không ghi gì):  php server/scripts/hash-passwords.php --dry-run
 * Chạy thật:                php server/scripts/hash-passwords.php
 *
 * An toàn khi chạy nhiều lần: mật khẩu đã băm sẽ được bỏ qua.
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

$chayThu = in_array('--dry-run', $argv ?? [], true);

$taoKetNoi = require __DIR__ . '/../src/config/database.php';
$db = $taoKetNoi();

$hang = $db->query('SELECT MaTK, TenTK, MatKhau FROM taikhoan')->fetchAll(PDO::FETCH_ASSOC);
$capNhat = $db->prepare('UPDATE taikhoan SET MatKhau = :hash WHERE MaTK = :id');

$daBam = 0;
$daBo = 0;
$loi = 0;

$db->beginTransaction();
try {
    foreach ($hang as $tk) {
        $matKhau = (string) $tk['MatKhau'];

        if ($matKhau === '') {
            fwrite(STDERR, "Bỏ qua {$tk['TenTK']}: mật khẩu rỗng.\n");
            $loi++;
            continue;
        }

        // Đã là hash (bcrypt/argon2) thì chỉ băm lại nếu thuật toán/cost đã lỗi thời
        $laHash = (password_get_info($matKhau)['algoName'] ?? 'unknown') !== 'unknown';
        if ($laHash && !password_needs_rehash($matKhau, PASSWORD_DEFAULT)) {
            $daBo++;
            continue;
        }
        if ($laHash) {
            // Không thể băm lại từ một hash; giữ nguyên và cập nhật khi người dùng đăng nhập lần sau
            $daBo++;
            continue;
        }

        $hash = password_hash($matKhau, PASSWORD_DEFAULT);
        if ($hash === false) {
            fwrite(STDERR, "Không băm được mật khẩu của {$tk['TenTK']}.\n");
            $loi++;
            continue;
        }

        if (!$chayThu) {
            $capNhat->execute(['hash' => $hash, 'id' => $tk['MaTK']]);
        }
        echo "  - {$tk['TenTK']} ({$tk['MaTK']}): " . ($chayThu ? 'sẽ băm' : 'đã băm') . "\n";
        $daBam++;
    }

    if ($chayThu || $loi > 0) {
        $db->rollBack();
        if ($loi > 0 && !$chayThu) {
            fwrite(STDERR, "Có lỗi nên đã hoàn tác, chưa thay đổi gì.\n");
            exit(1);
        }
    } else {
        $db->commit();
    }
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    fwrite(STDERR, 'Lỗi, đã hoàn tác: ' . $e->getMessage() . "\n");
    exit(1);
}

$tieuDe = $chayThu ? '[Chạy thử] ' : '';
echo "{$tieuDe}Băm: {$daBam} | Bỏ qua (đã băm): {$daBo} | Lỗi: {$loi}\n";
