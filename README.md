# Vườn Phố – Phân quyền (RBAC) cho Website Quản lý cửa hàng vật tư nông nghiệp

Tài liệu này ghi lại **những gì đã sửa/thêm so với bản gốc**, **phần nào đã được phân quyền**, cách hoạt động của **hash-passwords.php**, và **cách chạy dự án**. Dành cho thành viên mới đọc để hiểu nhanh.

---

## 1. Tóm tắt

- Hệ thống có 3 vai trò trong bảng `taikhoan.VaiTro`: `khach_hang`, `nhan_vien`, `admin`.
- Quyền được kiểm tra **ở backend** (PHP, trả HTTP 401/403 dạng JSON). Phần giao diện (JS) chỉ ẩn/hiện nút cho gọn, **không phải lớp bảo vệ chính**.
- Quyền định nghĩa tại **một chỗ duy nhất**: hằng số `QUYEN_THEO_VAI_TRO` trong `server/src/middlewares/Auth.php`.
- Mật khẩu lưu dạng băm (bcrypt), không lưu chữ thường.

---

## 2. Thay đổi cơ sở dữ liệu (so với CSDL cũ)

File cũ: `QuanLyCuaHangVatTuNongNghiep_1.sql`  |  File mới: `quanlycuahangvattunongnghiep_moi.sql`

| Bảng | Thay đổi | Mục đích |
|---|---|---|
| `taikhoan` | **Thêm cột** `TrangThai TINYINT(1) NOT NULL DEFAULT 1` (1 = hoạt động, 0 = bị khóa) | Admin khóa/mở khóa tài khoản |
| `taikhoan` | **Chuẩn hóa dữ liệu vai trò**: `Nvien` → `nhan_vien`, `NguoiDung` → `khach_hang` | Chỉ còn đúng 3 giá trị |
| `taikhoan` | **Thêm ràng buộc** `CK_taikhoan_vaitro CHECK (VaiTro IN ('khach_hang','nhan_vien','admin'))` | CSDL từ chối vai trò lạ |
| `sanpham` | **Thêm cột** `DaAn TINYINT(1) NOT NULL DEFAULT 0` (1 = đã ẩn khỏi cửa hàng) | Xóa mềm: nhân viên chỉ được ẩn, không xóa vĩnh viễn |
| `nhatky_hoatdong` | **Bảng mới** (MaLog, MaTK, HanhDong, DoiTuong, MaDoiTuong, ChiTiet, DiaChiIp, ThoiGian), khóa ngoại `MaTK → taikhoan` (`ON DELETE SET NULL`) | Nhật ký hoạt động của nhân viên/admin |

Các bảng còn lại (`hoadon`, `cthoadon`, `khachhang`, `nhanvien`, `ncc`, `hinhanhsanpham`, `pnhap`, `ctpnhap`, `tonkho`, `doanhthu`, `xacnhan_email`) **giữ nguyên**.

Dữ liệu mẫu: 3 tài khoản, mật khẩu ban đầu đều là `123456` (chữ thường, phải chạy `hash-passwords.php` để băm).

| Tài khoản | Vai trò |
|---|---|
| `admin` | `admin` |
| `nhanvien` | `nhan_vien` |
| `Khach1` | `khach_hang` |

Hai cách có CSDL mới:
- **Máy mới / làm lại từ đầu:** import `quanlycuahangvattunongnghiep_moi.sql` (xem mục 6).
- **Đã có CSDL cũ và muốn giữ dữ liệu:** chạy `server/database/rbac-migration.sql` một lần (nó chỉ thêm cột/bảng và chuẩn hóa vai trò, không xóa dữ liệu).

> ⚠️ File `quanlycuahangvattunongnghiep_moi.sql` bắt đầu bằng `DROP DATABASE IF EXISTS quanlycuahangvattunongnghiep;` nên **import sẽ xóa sạch CSDL cũ cùng tên**. Hãy sao lưu trước.
> ⚠️ Bảng `xacnhan_email` trong file dump có sẵn một địa chỉ Gmail thật và mã băm OTP. Nên xóa dòng `insert` đó trước khi chia sẻ hoặc đưa lên Git.

---

## 3. Phân quyền đã thực hiện

### 3.1. Ma trận quyền

| Chức năng | Khách vãng lai | Khách hàng | Nhân viên | Admin |
|---|:-:|:-:|:-:|:-:|
| Xem sản phẩm, tìm kiếm, đăng ký/đăng nhập/quên mật khẩu | ✔ | ✔ | ✔ | ✔ |
| Xem/sửa hồ sơ cá nhân của chính mình (`/api/ho-so`) | | ✔ | | |
| Vào trang quản trị, xem hóa đơn (`/api/quan-tri`) | | | ✔ | ✔ |
| Xem cả sản phẩm đã ẩn | | | ✔ | ✔ |
| Thêm sản phẩm | | | ✔ | ✔ |
| Sửa sản phẩm | | | ✔ | ✔ |
| Ẩn sản phẩm (xóa mềm) | | | ✔ | ✔ |
| Khôi phục sản phẩm đã ẩn | | | | ✔ |
| Xóa vĩnh viễn sản phẩm | | | | ✔ |
| Xem danh sách tài khoản | | | | ✔ |
| Tạo tài khoản nhân viên | | | | ✔ |
| Khóa / mở khóa tài khoản | | | | ✔ |
| Đổi vai trò tài khoản | | | | ✔ |
| Xem nhật ký hoạt động | | | | ✔ |

### 3.2. Bảng API và quyền cần có

Mã lỗi: chưa đăng nhập → **401**; đăng nhập nhưng thiếu quyền → **403**; thiếu/sai CSRF token → **403**.

| API | Quyền (`Auth::yeuCauQuyen`) | Ghi chú |
|---|---|---|
| `GET /api/san-pham` | công khai | `?tatca=1` chỉ có tác dụng với tài khoản có `quan_tri.xem` (mới thấy hàng đã ẩn) |
| `GET /api/san-pham/{ma}` | công khai | Hàng đã ẩn chỉ nhân viên/admin xem được |
| `POST /api/san-pham` | `san_pham.them` | + CSRF |
| `PUT/PATCH /api/san-pham/{ma}` | `san_pham.sua` | + CSRF |
| `POST /api/san-pham/{ma}/an` | `san_pham.an` | + CSRF |
| `POST /api/san-pham/{ma}/khoi-phuc` | `san_pham.khoi_phuc` | + CSRF (chỉ admin) |
| `DELETE /api/san-pham/{ma}` | `san_pham.xoa` | + CSRF (chỉ admin) |
| `GET /api/quan-tri` | `quan_tri.xem` | Danh sách tài khoản chỉ trả cho người có `tai_khoan.xem`; nhân viên nhận mảng rỗng |
| `GET /api/nhat-ky` | `nhat_ky.xem` | Chỉ admin |
| `POST /api/tai-khoan` | `tai_khoan.tao` | Chỉ tạo vai trò `nhan_vien`, mật khẩu ≥ 12 ký tự |
| `PATCH /api/tai-khoan/{ma}/trang-thai` | `tai_khoan.khoa` | Body `{"hoatDong": true/false}` |
| `PATCH /api/tai-khoan/{ma}/vai-tro` | `tai_khoan.doi_vai_tro` | Body `{"vaiTro": "khach_hang|nhan_vien|admin"}` |
| `GET /api/ho-so` | `ho_so.xem` | Luôn lấy tài khoản từ **session**, không nhận mã từ client |
| `PUT/PATCH /api/ho-so` | `ho_so.sua` | Như trên (chống IDOR) |

### 3.3. Quy tắc bảo mật đã áp dụng

1. **Đồng bộ phiên với CSDL mỗi request** (`Auth::dongBoPhien`): admin khóa hoặc đổi vai trò ai thì phiên đang đăng nhập của người đó đổi/hết hiệu lực ngay.
2. **Tài khoản bị khóa không đăng nhập được** và không được tự đăng nhập qua chức năng quên mật khẩu (`AuthController`).
3. **Admin không thể tự khóa hoặc tự đổi vai trò của chính mình.**
4. **Không thể khóa hoặc hạ quyền admin hoạt động cuối cùng** (kiểm tra trong transaction, `SELECT ... FOR UPDATE`, tránh hai admin thao tác cùng lúc làm hệ thống không còn admin).
5. **Chống IDOR hồ sơ:** `ProfileController` lấy mã tài khoản từ session, không đọc từ request.
6. **Xóa mềm sản phẩm:** nhân viên chỉ ẩn; hàng đã ẩn không hiện ở cửa hàng nhưng vẫn giữ lịch sử hóa đơn.
7. **Nhật ký hoạt động:** thêm/sửa/ẩn/khôi phục/xóa sản phẩm, tạo tài khoản, khóa/mở khóa, đổi vai trò đều được ghi (kèm tài khoản thực hiện và IP).
8. Mọi thao tác ghi (POST/PUT/PATCH/DELETE) đều cần **CSRF token** (header `X-CSRF-Token`).

### 3.4. Phần giao diện (`app.js`)

- Nhân viên: thấy nút **Thêm, Sửa, Ẩn**; **không thấy nút Xóa**, không thấy tab "Tài khoản & Phân quyền" và "Nhật ký hoạt động".
- Admin: thấy đủ nút, form **tạo nhân viên**, nút **Khóa/Mở khóa**, ô chọn **đổi vai trò**, tab **Nhật ký hoạt động**.
- Sản phẩm đã ẩn hiện nhãn "Đã ẩn" và nút **Khôi phục** (chỉ admin).
- Phiên hết hạn hoặc bị khóa (API trả 401) ở trang quản trị → tự chuyển về trang đăng nhập.
- Quyền phía giao diện lấy từ danh sách `quyen` mà `/api/auth/session` trả về, qua hàm `coQuyenUI(...)`.

---

## 4. Danh sách file đã sửa / thêm

**Sửa** (giữ nguyên phần còn lại của file gốc):

| File | Đã sửa gì |
|---|---|
| `server/public/index.php` | Tạo 1 kết nối PDO dùng chung; gọi `Auth::dongBoPhien` |
| `server/src/middlewares/Auth.php` | Mở rộng ma trận quyền; thêm `dongBoPhien`, `idNguoiDung` |
| `server/src/routes/api.php` | Đổi sang kiểm tra theo quyền; thêm route tài khoản, hồ sơ, nhật ký, ẩn/khôi phục |
| `server/src/models/AuthData.php` | Đọc `TrangThai`; thêm `taoTaiKhoan`, `datTrangThaiAnToan`, `doiVaiTroAnToan` |
| `server/src/models/AdminData.php` | Danh sách tài khoản có thêm Email, TrangThai |
| `server/src/models/Product.php` | Hỗ trợ cột `DaAn`: lọc hàng ẩn, `datDaAn` |
| `server/src/controllers/AuthController.php` | Chặn tài khoản bị khóa đăng nhập / đặt lại mật khẩu |
| `server/src/controllers/AdminController.php` | Chỉ trả danh sách tài khoản khi đủ quyền; thêm `hienThiNhatKy` |
| `server/src/controllers/ProductController.php` | Thêm ẩn/khôi phục; ghi nhật ký |
| `server/scripts/hash-passwords.php` | Viết lại (xem mục 5) |
| `public/assets/js/app.js` | Ẩn/hiện nút theo quyền; tab tài khoản, nhật ký; xử lý 401 |

**Thêm mới:**

| File | Vai trò |
|---|---|
| `server/src/models/ActivityLog.php` | Ghi và đọc nhật ký hoạt động |
| `server/src/models/ProfileData.php` | Truy vấn/cập nhật hồ sơ khách hàng |
| `server/src/controllers/TaiKhoanController.php` | Tạo nhân viên, khóa/mở khóa, đổi vai trò |
| `server/src/controllers/ProfileController.php` | Xem/sửa hồ sơ của chính mình |
| `server/database/rbac-migration.sql` | Nâng cấp CSDL cũ lên cấu trúc mới |

**Lỗi cũ đã sửa kèm:** `server/scripts/create-account.php` gọi hàm `taoTaiKhoan()` chưa tồn tại trong `AuthData`; đã bổ sung hàm này.

---

## 5. `hash-passwords.php` – hàm băm mật khẩu

### Vì sao cần?
Dữ liệu mẫu lưu mật khẩu chữ thường (`123456`). Khi chạy script này, mỗi mật khẩu được thay bằng chuỗi băm một chiều. Không thể dịch ngược chuỗi băm về mật khẩu gốc.

### Hàm băm dùng gì?
```php
password_hash($matKhau, PASSWORD_DEFAULT)   // tạo chuỗi băm (hiện tại là bcrypt, dạng $2y$10$...)
password_verify($matKhauNhap, $chuoiBam)    // kiểm tra khi đăng nhập
```
- Mỗi lần băm có **muối (salt) ngẫu nhiên** nên cùng một mật khẩu sẽ ra chuỗi khác nhau; vì vậy phải dùng `password_verify`, không so sánh chuỗi trực tiếp.
- Cột `taikhoan.MatKhau` dài `varchar(255)` nên đủ chứa chuỗi băm.
- Khi đăng nhập, `AuthController::kiemTraMatKhau` dùng `password_verify`. Nếu cột đó còn là chữ thường (chưa băm) thì nó vẫn so khớp được để dữ liệu mẫu chạy ngay; **nên bỏ nhánh này sau khi băm xong** (chưa làm).

### Script làm gì?
1. Chỉ chạy trên dòng lệnh (`PHP_SAPI === 'cli'`), gọi qua web sẽ bị 403.
2. Đọc tất cả tài khoản (`MaTK`, `TenTK`, `MatKhau`).
3. Dùng `password_get_info` để biết mật khẩu **đã băm chưa**; đã băm thì **bỏ qua** (chạy nhiều lần vẫn an toàn).
4. Mật khẩu chữ thường → `password_hash` rồi `UPDATE`.
5. Toàn bộ nằm trong **một transaction**: có lỗi thì hoàn tác, không để dữ liệu nửa vời.
6. Mật khẩu rỗng bị báo lỗi và hoàn tác.
7. Tùy chọn `--dry-run`: chỉ liệt kê tài khoản sẽ băm, **không ghi gì**.

### Cách dùng
```powershell
php server/scripts/hash-passwords.php --dry-run   # xem thử
php server/scripts/hash-passwords.php             # băm thật
```
Kết quả cuối có dạng: `Băm: 3 | Bỏ qua (đã băm): 0 | Lỗi: 0`.

---

## 6. Hướng dẫn chạy

### 6.1. Yêu cầu
- **PHP 8.1 trở lên** (có `pdo_mysql`). Dự án dùng `match`, `readonly`/constructor promotion, spread trong hằng số.
- **MySQL 8.0.16 trở lên** (cần để `CHECK` có hiệu lực). Dump gốc xuất từ MySQL 9.5.
- Windows PowerShell hoặc terminal tương đương.
- Composer đã có sẵn thư mục `vendor/` (PHPMailer). Nếu thiếu: `composer install`.

Kiểm tra:
```powershell
php -v
php -m | findstr pdo_mysql
```
Chưa có PHP: chạy `scripts\install-php.ps1` (dùng winget) rồi mở terminal mới.

### 6.2. Cấu hình `.env` (ở thư mục gốc dự án, ngang hàng `server`, `public`)
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=quanlycuahangvattunongnghiep
DB_USER=root
DB_PASSWORD=mat_khau_mysql_cua_ban

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=gmail_cua_ban@gmail.com
MAIL_PASSWORD=mat_khau_ung_dung_gmail
MAIL_FROM_ADDRESS=gmail_cua_ban@gmail.com
MAIL_FROM_NAME=Vườn Phố
```
- Các biến `MAIL_*` chỉ cần cho đăng ký và quên mật khẩu qua OTP Gmail (dùng *mật khẩu ứng dụng* của Google).
- **Không đưa file `.env` lên Git.**

### 6.3. Tạo CSDL
**Cách A – Máy mới (khuyến nghị):** import `quanlycuahangvattunongnghiep_moi.sql`.
- MySQL Workbench: *Server → Data Import → Import from Self-Contained File*.
- Hoặc dòng lệnh:
  ```powershell
  mysql -u root -p < quanlycuahangvattunongnghiep_moi.sql
  ```
- Nhớ cảnh báo ở mục 2: file này **xóa CSDL cũ cùng tên**.

**Cách B – Đã có CSDL cũ, giữ dữ liệu:** chạy `server/database/rbac-migration.sql` **một lần**. Nếu báo `Duplicate column` nghĩa là đã chạy rồi, không chạy lại.

Kiểm tra:
```sql
SHOW COLUMNS FROM taikhoan LIKE 'TrangThai';
SHOW COLUMNS FROM sanpham  LIKE 'DaAn';
SHOW TABLES LIKE 'nhatky_hoatdong';
SELECT TenTK, VaiTro FROM taikhoan;   -- chỉ còn admin / nhan_vien / khach_hang
```

### 6.4. Băm mật khẩu mẫu
Đứng ở thư mục gốc dự án (thư mục có `server`, `public`, `vendor`):
```powershell
php server/scripts/hash-passwords.php --dry-run
php server/scripts/hash-passwords.php
```

### 6.5. Chạy website
```powershell
php -S 127.0.0.1:8000 -t public server/router.php
```
Giữ cửa sổ này mở, vào trình duyệt: `http://127.0.0.1:8000` (nhấn **Ctrl+F5** để tải lại `app.js` mới).

Có thể dùng script thay thế: `powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1` (xem mục 8 nếu gặp lỗi chữ tiếng Việt bị vỡ).

Trang quản trị:
- Admin: `http://127.0.0.1:8000/pages/admin.html`
- Nhân viên: `http://127.0.0.1:8000/pages/nhan-vien.html`

### 6.6. Tạo thêm tài khoản bằng dòng lệnh (tùy chọn)
```powershell
php server/scripts/create-account.php ten_dang_nhap nhan_vien
php server/scripts/create-account.php ten_dang_nhap admin
```
Script hỏi mật khẩu (≥ 12 ký tự). Admin cũng có thể tạo nhân viên ngay trong giao diện.

### 6.7. Kiểm thử nhanh theo vai trò
Mật khẩu mẫu: `123456`.

1. **Chưa đăng nhập:** mở `admin.html` / `nhan-vien.html` → bị chuyển về trang chủ.
2. **`nhanvien`:** vào `nhan-vien.html`; có Thêm/Sửa/Ẩn, **không** có Xóa; không có tab Tài khoản/Nhật ký.
3. **`admin`:** vào `admin.html`; tạo nhân viên, khóa/mở khóa, đổi vai trò; thử tự khóa chính mình → bị chặn.
4. **Ẩn sản phẩm:** nhân viên bấm Ẩn → sản phẩm biến khỏi trang cửa hàng; admin Khôi phục → hiện lại.
5. **Khóa tài khoản:** admin khóa tài khoản đang đăng nhập ở trình duyệt khác → thao tác kế tiếp bị đẩy ra.
6. **Nhật ký:** admin mở tab "Nhật ký hoạt động" xem các thao tác vừa làm.

---

## 7. Chưa làm / lưu ý cho giai đoạn sau

- **Bình luận, bài viết, banner/slider/cấu hình trang chủ, quản lý nhà cung cấp/thương hiệu:** CSDL chưa có bảng và giao diện chưa có. Khi làm, thêm bảng, thêm quyền mới vào `QUYEN_THEO_VAI_TRO` và bảo vệ API bằng `Auth::yeuCauQuyen(...)` như các route hiện có.
- **Hóa đơn:** hiện chỉ xem được, chưa có API tạo/sửa nên chưa có gì để phân quyền thêm.
- **Hồ sơ khách hàng:** mới có API, chưa có form sửa trên giao diện; chưa có ảnh đại diện (bảng `khachhang` chưa có cột).
- **Nên bỏ nhánh so sánh mật khẩu chữ thường** trong `AuthController::kiemTraMatKhau` sau khi đã băm toàn bộ.
- **Giới hạn đăng nhập sai** đang lưu theo session nên có thể bị lách bằng cách xóa cookie; nên chuyển sang lưu ở CSDL theo tài khoản/IP.
- Chưa kiểm thử tự động. Cần chạy tay theo mục 6.7 sau mỗi lần sửa quyền.

---

## 8. Lỗi thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| `Could not open input file: server/scripts/...` | Terminal đang đứng sai thư mục (hay gặp khi giải nén hai lớp thư mục). Dùng `Get-Location`, `dir` để kiểm tra rồi `cd` vào thư mục có `server`, `public`. |
| `File ... is not digitally signed` khi chạy `.ps1` | Chính sách chạy script của Windows. Dùng `powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1`, hoặc chạy thẳng lệnh `php -S ...` ở mục 6.5. |
| Chữ tiếng Việt trong `.ps1` bị vỡ (`áºt`, `rá»“i`) và báo lỗi cú pháp | File lưu UTF-8 không có BOM. Trong VS Code: *Save with Encoding → UTF-8 with BOM*. Hoặc bỏ qua script, chạy lệnh `php -S ...`. |
| API trả 503 "Không thể kết nối cơ sở dữ liệu" | MySQL chưa chạy, sai `.env`, hoặc chưa tạo cột `TrangThai`/`DaAn` (chưa chạy SQL ở mục 6.3). |
| API trả 500 | Xem cửa sổ đang chạy `php -S`, dòng `[Vuon Pho API] ...` cho biết file và dòng lỗi. Thường do thiếu file mới ở mục 4. |
| Giao diện vẫn như cũ | Nhấn Ctrl+F5; kiểm tra `app.js` đã đặt đúng `public/assets/js/`. |
| Báo thiếu `pdo_mysql` | Bật `extension=pdo_mysql` trong `php.ini` rồi mở terminal mới. |
| Đăng nhập báo "Tài khoản đã bị khóa" | Tài khoản có `TrangThai = 0`. Admin mở khóa, hoặc: `UPDATE taikhoan SET TrangThai = 1 WHERE TenTK = '...';` |
