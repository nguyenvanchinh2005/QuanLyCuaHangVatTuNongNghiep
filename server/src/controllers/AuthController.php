<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/services/EmailService.php';

final class AuthController
{
    public function __construct(private ?AuthData $authData = null)
    {
    }

    public function hienThiPhien(): void
    {
        JsonResponse::gui([
            'nguoiDung' => Auth::nguoiDungHienTai(),
            'csrfToken' => Auth::taoTokenCsrf(),
        ]);
    }

    public function guiMaXacNhan(array $duLieu): void
    {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }

        $emailNhap = $duLieu['email'] ?? null;
        $mucDich = ($duLieu['mucDich'] ?? 'dang_ky') === 'quen_mat_khau'
            ? 'quen_mat_khau'
            : 'dang_ky';

        if (!is_string($emailNhap)) {
            $this->guiLoiDuLieu('Vui lòng nhập địa chỉ Gmail hợp lệ.');
            return;
        }

        $email = strtolower(trim($emailNhap));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->guiLoiDuLieu('Địa chỉ Gmail không đúng định dạng.');
            return;
        }

        if ($this->authData === null) {
            throw new LogicException('AuthData is required.');
        }

        $emailDaCo = $this->authData->emailDaTonTai($email);

        if ($mucDich === 'dang_ky' && $emailDaCo) {
            JsonResponse::gui([
                'error' => ['code' => 'email_exists', 'message' => 'Gmail này đã được đăng ký tài khoản khác.'],
            ], 409);
            return;
        }

        if ($mucDich === 'quen_mat_khau' && !$emailDaCo) {
            JsonResponse::gui([
                'error' => ['code' => 'email_not_found', 'message' => 'Không tìm thấy tài khoản nào gắn với Gmail này.'],
            ], 404);
            return;
        }

        // Chống spam gửi OTP liên tục trong vòng 60 giây
        $giayCho = $this->authData->layThoiGianChoGuiLaiOtp($email);
        if ($giayCho > 0) {
            JsonResponse::gui([
                'error' => [
                    'code' => 'otp_rate_limited',
                    'message' => "Vui lòng đợi {$giayCho} giây nữa trước khi yêu cầu gửi lại mã.",
                ],
            ], 429);
            return;
        }

        $maOtp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $otpHash = hash('sha256', $maOtp);

        $this->authData->luuMaOtpEmail($email, $otpHash);

        try {
            $emailService = new EmailService();
            $emailService->guiMaOtp($email, $maOtp, $mucDich);
        } catch (Throwable $loi) {
            error_log('Lỗi gửi OTP: ' . $loi->getMessage());
            JsonResponse::gui([
                'error' => [
                    'code' => 'email_send_failed',
                    'message' => 'Không gửi được mã về Gmail. Kiểm tra cấu hình SMTP trong .env.',
                ],
            ], 500);
            return;
        }

        JsonResponse::gui([
            'message' => 'Đã gửi mã xác nhận 6 số tới Gmail của bạn.',
        ]);
    }

    public function dangNhap(array $duLieu): void
    {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }

        // Kiểm tra giới hạn nhập sai mật khẩu (tối đa 5 lần / 5 phút)
        $khoaDen = (int) ($_SESSION['login_locked_until'] ?? 0);
        if ($khoaDen > time()) {
            $giayConLai = $khoaDen - time();
            JsonResponse::gui([
                'error' => [
                    'code' => 'too_many_attempts',
                    'message' => "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau {$giayConLai} giây.",
                ],
            ], 429);
            return;
        }

        $tenTaiKhoanNhap = $duLieu['tenTaiKhoan'] ?? null;
        $matKhau = $duLieu['matKhau'] ?? null;

        if (!is_string($tenTaiKhoanNhap) || !is_string($matKhau)) {
            $this->guiLoiDuLieu('Vui lòng nhập tên tài khoản (hoặc Gmail) và mật khẩu.');
            return;
        }

        $dinhDanh = strtolower(trim($tenTaiKhoanNhap));
        $laEmail = filter_var($dinhDanh, FILTER_VALIDATE_EMAIL) !== false;
        $laTenTaiKhoan = preg_match('/\A[a-z0-9._-]{3,32}\z/', $dinhDanh) === 1;

        if ((!$laEmail && !$laTenTaiKhoan) || $matKhau === '') {
            $this->guiLoiDuLieu('Tên tài khoản hoặc Gmail không hợp lệ.');
            return;
        }

        $taiKhoan = $this->authData?->timTheoTenHoacEmail($dinhDanh);

        if ($taiKhoan === null || !$this->kiemTraMatKhau($matKhau, (string) $taiKhoan['mat_khau'])) {
            $soLanSai = (int) ($_SESSION['login_failed_count'] ?? 0) + 1;
            $_SESSION['login_failed_count'] = $soLanSai;

            if ($soLanSai >= 5) {
                $_SESSION['login_locked_until'] = time() + 300;
                $_SESSION['login_failed_count'] = 0;
                JsonResponse::gui([
                    'error' => [
                        'code' => 'too_many_attempts',
                        'message' => 'Bạn đã nhập sai 5 lần liên tiếp. Tài khoản tạm khóa đăng nhập trong 5 phút.',
                    ],
                ], 429);
                return;
            }

            JsonResponse::gui([
                'error' => [
                    'code' => 'invalid_credentials',
                    'message' => "Tên tài khoản/Gmail hoặc mật khẩu không chính xác (còn " . (5 - $soLanSai) . " lần thử).",
                ],
            ], 401);
            return;
        }

        unset($_SESSION['login_failed_count'], $_SESSION['login_locked_until']);

        session_regenerate_id(true);
        $_SESSION['nguoi_dung'] = Auth::taoThongTinNguoiDung($taiKhoan);
        unset($_SESSION['csrf_token']);

        JsonResponse::gui([
            'nguoiDung' => $_SESSION['nguoi_dung'],
            'csrfToken' => Auth::taoTokenCsrf(),
        ]);
    }

    public function dangKy(array $duLieu): void
    {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }

        $tenTaiKhoanNhap = $duLieu['tenTaiKhoan'] ?? null;
        $emailNhap = $duLieu['email'] ?? null;
        $maOtpNhap = $duLieu['maXacNhan'] ?? null;
        $matKhau = $duLieu['matKhau'] ?? null;
        $xacNhanMatKhau = $duLieu['xacNhanMatKhau'] ?? null;

        if (
            !is_string($tenTaiKhoanNhap)
            || !is_string($emailNhap)
            || !is_string($maOtpNhap)
            || !is_string($matKhau)
            || !is_string($xacNhanMatKhau)
        ) {
            $this->guiLoiDuLieu('Vui lòng điền đầy đủ các trường thông tin.');
            return;
        }

        $tenTaiKhoan = strtolower(trim($tenTaiKhoanNhap));
        $email = strtolower(trim($emailNhap));
        $maOtp = trim($maOtpNhap);

        if (!preg_match('/\A[a-z0-9._-]{3,32}\z/', $tenTaiKhoan)) {
            $this->guiLoiDuLieu('Tên tài khoản dài 3–32 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.');
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->guiLoiDuLieu('Địa chỉ Gmail không hợp lệ.');
            return;
        }

        if (!preg_match('/\A\d{6}\z/', $maOtp)) {
            $this->guiLoiDuLieu('Mã xác nhận phải gồm đúng 6 chữ số.');
            return;
        }

        if (strlen($matKhau) < 8) {
            $this->guiLoiDuLieu('Mật khẩu phải có ít nhất 8 ký tự.');
            return;
        }

        if ($matKhau !== $xacNhanMatKhau) {
            $this->guiLoiDuLieu('Mật khẩu nhập lại không khớp.');
            return;
        }

        if ($this->authData === null) {
            throw new LogicException('AuthData is required.');
        }

        if ($this->authData->tenTaiKhoanDaTonTai($tenTaiKhoan)) {
            JsonResponse::gui([
                'error' => ['code' => 'username_exists', 'message' => 'Tên tài khoản này đã được sử dụng.'],
            ], 409);
            return;
        }

        if ($this->authData->emailDaTonTai($email)) {
            JsonResponse::gui([
                'error' => ['code' => 'email_exists', 'message' => 'Gmail này đã được đăng ký.'],
            ], 409);
            return;
        }

        $otpHash = hash('sha256', $maOtp);
        if (!$this->authData->kiemTraVaXoaMaOtp($email, $otpHash)) {
            JsonResponse::gui([
                'error' => ['code' => 'invalid_otp', 'message' => 'Mã xác nhận không đúng hoặc đã hết hạn.'],
            ], 422);
            return;
        }

        $taiKhoan = $this->authData->taoTaiKhoanDaXacMinh($tenTaiKhoan, $email, $matKhau, 'khach_hang');

        session_regenerate_id(true);
        $_SESSION['nguoi_dung'] = Auth::taoThongTinNguoiDung($taiKhoan);
        unset($_SESSION['csrf_token']);

        JsonResponse::gui([
            'message' => 'Đăng ký tài khoản thành công!',
            'nguoiDung' => $_SESSION['nguoi_dung'],
            'csrfToken' => Auth::taoTokenCsrf(),
        ], 201);
    }

    public function quenMatKhau(array $duLieu): void
    {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }

        $emailNhap = $duLieu['email'] ?? null;
        $maOtpNhap = $duLieu['maXacNhan'] ?? null;
        $matKhauMoi = $duLieu['matKhauMoi'] ?? null;
        $xacNhanMatKhau = $duLieu['xacNhanMatKhau'] ?? null;

        if (
            !is_string($emailNhap)
            || !is_string($maOtpNhap)
            || !is_string($matKhauMoi)
            || !is_string($xacNhanMatKhau)
        ) {
            $this->guiLoiDuLieu('Vui lòng nhập đầy đủ Gmail, mã xác nhận và mật khẩu mới.');
            return;
        }

        $email = strtolower(trim($emailNhap));
        $maOtp = trim($maOtpNhap);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->guiLoiDuLieu('Địa chỉ Gmail không hợp lệ.');
            return;
        }

        if (!preg_match('/\A\d{6}\z/', $maOtp)) {
            $this->guiLoiDuLieu('Mã xác nhận phải gồm đúng 6 chữ số.');
            return;
        }

        if (strlen($matKhauMoi) < 8) {
            $this->guiLoiDuLieu('Mật khẩu mới phải có ít nhất 8 ký tự.');
            return;
        }

        if ($matKhauMoi !== $xacNhanMatKhau) {
            $this->guiLoiDuLieu('Mật khẩu nhập lại không khớp.');
            return;
        }

        if ($this->authData === null) {
            throw new LogicException('AuthData is required.');
        }

        if (!$this->authData->emailDaTonTai($email)) {
            JsonResponse::gui([
                'error' => ['code' => 'email_not_found', 'message' => 'Không tìm thấy tài khoản gắn với Gmail này.'],
            ], 404);
            return;
        }

        $otpHash = hash('sha256', $maOtp);
        if (!$this->authData->kiemTraVaXoaMaOtp($email, $otpHash)) {
            JsonResponse::gui([
                'error' => ['code' => 'invalid_otp', 'message' => 'Mã xác nhận không đúng hoặc đã hết hạn.'],
            ], 422);
            return;
        }

        $this->authData->datLaiMatKhauTheoEmail($email, $matKhauMoi);

        $taiKhoan = $this->authData->timTheoTenHoacEmail($email);
        if ($taiKhoan !== null) {
            session_regenerate_id(true);
            $_SESSION['nguoi_dung'] = Auth::taoThongTinNguoiDung($taiKhoan);
            unset($_SESSION['csrf_token']);
        }

        JsonResponse::gui([
            'message' => 'Đặt lại mật khẩu thành công!',
            'nguoiDung' => $_SESSION['nguoi_dung'] ?? null,
            'csrfToken' => Auth::taoTokenCsrf(),
        ]);
    }

    public function doiMatKhau(array $duLieu): void
    {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }

        $nguoiDung = Auth::nguoiDungHienTai();
        if ($nguoiDung === null) {
            JsonResponse::gui([
                'error' => ['code' => 'unauthorized', 'message' => 'Vui lòng đăng nhập để đổi mật khẩu.'],
            ], 401);
            return;
        }

        $matKhauCu = $duLieu['matKhauCu'] ?? null;
        $matKhauMoi = $duLieu['matKhauMoi'] ?? null;
        $xacNhanMatKhau = $duLieu['xacNhanMatKhau'] ?? null;

        if (!is_string($matKhauCu) || !is_string($matKhauMoi) || !is_string($xacNhanMatKhau)) {
            $this->guiLoiDuLieu('Vui lòng nhập đầy đủ thông tin mật khẩu.');
            return;
        }

        if (strlen($matKhauMoi) < 8) {
            $this->guiLoiDuLieu('Mật khẩu mới phải có ít nhất 8 ký tự.');
            return;
        }

        if ($matKhauMoi !== $xacNhanMatKhau) {
            $this->guiLoiDuLieu('Mật khẩu mới nhập lại không khớp.');
            return;
        }

        if ($matKhauCu === $matKhauMoi) {
            $this->guiLoiDuLieu('Mật khẩu mới phải khác mật khẩu hiện tại.');
            return;
        }

        if ($this->authData === null) {
            throw new LogicException('AuthData is required.');
        }

        $taiKhoan = $this->authData->timTheoMaTaiKhoan((string) $nguoiDung['id']);
        if ($taiKhoan === null || !$this->kiemTraMatKhau($matKhauCu, (string) $taiKhoan['mat_khau'])) {
            JsonResponse::gui([
                'error' => ['code' => 'wrong_old_password', 'message' => 'Mật khẩu hiện tại không chính xác.'],
            ], 401);
            return;
        }

        $this->authData->capNhatMatKhauTheoMa((string) $nguoiDung['id'], $matKhauMoi);

        JsonResponse::gui([
            'message' => 'Đổi mật khẩu thành công!',
        ]);
    }

    public function dangXuat(): void
    {
        if (!Auth::kiemTraTokenCsrf()) {
            return;
        }

        $_SESSION = [];
        session_regenerate_id(true);

        JsonResponse::gui([
            'nguoiDung' => null,
            'csrfToken' => Auth::taoTokenCsrf(),
        ]);
    }

    private function kiemTraMatKhau(string $matKhau, string $matKhauTrongDatabase): bool
    {
        $thongTinHash = password_get_info($matKhauTrongDatabase);
        if (($thongTinHash['algoName'] ?? 'unknown') !== 'unknown') {
            return password_verify($matKhau, $matKhauTrongDatabase);
        }
        return hash_equals($matKhauTrongDatabase, $matKhau);
    }

    private function guiLoiDuLieu(string $thongBao): void
    {
        JsonResponse::gui([
            'error' => [
                'code' => 'invalid_input',
                'message' => $thongBao,
            ],
        ], 422);
    }
}