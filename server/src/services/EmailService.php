<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once dirname(__DIR__, 3) . '/vendor/autoload.php';

final class EmailService
{
    private function docCauHinh(string $ten, string $macDinh = ''): string
    {
        static $cauHinh = null;

        if ($cauHinh === null) {
            $tepCauHinh = dirname(__DIR__, 3) . '/.env';
            $cauHinh = is_file($tepCauHinh)
                ? parse_ini_file($tepCauHinh, false, INI_SCANNER_RAW)
                : [];

            if ($cauHinh === false) {
                throw new RuntimeException('Không thể đọc cấu hình .env.');
            }
        }

        $giaTriMoiTruong = getenv($ten);

        return $giaTriMoiTruong !== false
            ? $giaTriMoiTruong
            : (string) ($cauHinh[$ten] ?? $macDinh);
    }

    public function guiMaOtp(string $email, string $maOtp, string $mucDich = 'dang_ky'): void
    {
        $gmail = $this->docCauHinh('MAIL_USERNAME');
        $matKhauUngDung = str_replace(' ', '', $this->docCauHinh('MAIL_PASSWORD'));

        if ($gmail === '' || $matKhauUngDung === '') {
            throw new RuntimeException('Chưa cấu hình Gmail SMTP trong file .env.');
        }

        $laQuenMatKhau = $mucDich === 'quen_mat_khau';
        $tieuDeMail = $laQuenMatKhau
            ? "Mã khôi phục mật khẩu Vườn Phố: {$maOtp}"
            : "Mã xác nhận đăng ký Vườn Phố: {$maOtp}";
        $tieuDeNoiDung = $laQuenMatKhau
            ? 'Khôi phục mật khẩu VƯỜN PHỐ'
            : 'Xác nhận đăng ký tài khoản VƯỜN PHỐ';
        $moTa = $laQuenMatKhau
            ? 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản gắn với Gmail này. Mã xác nhận của bạn là:'
            : 'Cảm ơn bạn đã đăng ký tài khoản tại VƯỜN PHỐ. Mã xác nhận đăng ký của bạn là:';

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = $this->docCauHinh('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth = true;
            $mail->Username = $gmail;
            $mail->Password = $matKhauUngDung;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = (int) $this->docCauHinh('MAIL_PORT', '587');
            $mail->CharSet = 'UTF-8';

            $mail->setFrom(
                $this->docCauHinh('MAIL_FROM_ADDRESS', $gmail),
                $this->docCauHinh('MAIL_FROM_NAME', 'Vườn Phố')
            );

            $mail->addAddress($email);
            $mail->isHTML(true);
            $mail->Subject = $tieuDeMail;

            $maOtpAnToan = htmlspecialchars($maOtp, ENT_QUOTES, 'UTF-8');

            $mail->Body = "
                <div style='font-family:Arial,sans-serif;line-height:1.6;color:#222'>
                    <h2>{$tieuDeNoiDung}</h2>
                    <p>Xin chào,</p>
                    <p>{$moTa}</p>
                    <div style='margin:16px 0;padding:14px 24px;background:#e9f2e8;border:1px solid #176b42;border-radius:8px;display:inline-block;font-size:28px;font-weight:bold;letter-spacing:6px;color:#176b42'>
                        {$maOtpAnToan}
                    </div>
                    <p>Mã có hiệu lực trong vòng <strong>10 phút</strong>.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
                    <p>Trân trọng,<br><strong>VƯỜN PHỐ</strong></p>
                </div>
            ";

            $mail->AltBody = "{$tieuDeNoiDung}: {$maOtp}. Mã có hiệu lực trong 10 phút.";

            $mail->send();
        } catch (Exception $loi) {
            throw new RuntimeException(
                'Không thể gửi email xác nhận: ' . $mail->ErrorInfo,
                0,
                $loi
            );
        }
    }
}