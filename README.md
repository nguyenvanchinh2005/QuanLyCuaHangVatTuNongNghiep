# Vườn Phố

Cửa hàng vật tư nông nghiệp dùng giao diện khách hàng làm trang mặc định, API PHP kết nối MySQL và phân quyền theo ba vai trò. Khách hàng đăng nhập sẽ ở lại cửa hàng; nhân viên và admin được chuyển tới trang quản trị. Nhân viên chỉ xem dữ liệu; admin có thể thêm, sửa và xóa sản phẩm trong kho. Trình duyệt chỉ gọi API, không kết nối trực tiếp tới MySQL.

## Cấu trúc

```text
.
├── .env
├── .env.example
├── .gitignore
├── .impeccable/
├── README.md
├── public/
│   ├── .htaccess
│   ├── index.html
│   ├── api/index.php
│   ├── assets/
│   │   ├── css/app.css
│   │   └── js/app.js
│   └── pages/
│       ├── admin.html
│       └── nhan-vien.html
├── scripts/
│   ├── install-php.ps1
│   └── start-dev.ps1
├── docs/
│   ├── PRODUCT.md
│   ├── DESIGN.md
│   └── DANH_SACH_BIEN.md
└── server/
    ├── database/
    │   ├── migration-taikhoan.sql
    │   └── schema.sql
    ├── scripts/create-account.php
    ├── router.php
    ├── public/
    │   └── index.php
    └── src/
        ├── config/database.php
        ├── controllers/
        │   ├── AdminController.php
        │   ├── AuthController.php
        │   └── ProductController.php
        ├── http/JsonResponse.php
        ├── middlewares/
        │   ├── Auth.php
        │   └── ErrorHandler.php
        ├── models/
        │   ├── AdminData.php
        │   ├── AuthData.php
        │   └── Product.php
        └── routes/api.php
```

## Cài PHP và chạy ứng dụng trên Windows

Không cần mở XAMPP để chạy PHP. Cài PHP CLI riêng bằng winget (PHP 8.4):

```powershell
.\scripts\install-php.ps1
```

Mở PowerShell mới và kiểm tra:

```powershell
php -v
php -m
```

Đảm bảo danh sách module có `pdo_mysql`. Nếu chưa có, bật `extension=pdo_mysql` trong `php.ini` của bản PHP đang cài rồi mở terminal mới. PHP và MySQL là hai dịch vụ riêng: có thể chạy PHP độc lập, nhưng MySQL cần được cài và khởi động riêng (không nhất thiết qua XAMPP).

1. Tạo database `quanlycuahangvattunongnghiep` và cài schema sản phẩm/hóa đơn hiện có.
2. Với database mới, chạy `server/database/schema.sql`. Nếu bảng `taikhoan` chưa có, chạy `server/database/migration-taikhoan.sql` để tạo bảng tài khoản với các cột `MaTK`, `TenTK`, `MatKhau`, `VaiTro`. Tệp không xóa hoặc tự chuyển dữ liệu từ `nguoidung_web`.
3. Sao chép `.env.example` thành `.env` nếu chưa có, rồi nhập host, cổng, tên database, user và password MySQL. Không commit `.env`.
4. Từ thư mục gốc dự án, chạy:

   ```powershell
   .\scripts\start-dev.ps1
   ```

5. Mở `http://127.0.0.1:8000`. Dừng máy chủ bằng `Ctrl+C`.

Có thể chạy trực tiếp thay vì dùng script:

```powershell
php -S 127.0.0.1:8000 -t public server/router.php
```

## Tài khoản và phân quyền

- **Khách hàng:** đăng ký demo bằng tên tài khoản và mật khẩu; tài khoản lưu trong bảng `taikhoan` với vai trò `khach_hang`.
- **Nhân viên:** vào trang quản trị, xem dashboard, sản phẩm, hóa đơn và tài khoản; không được ghi/xóa sản phẩm.
- **Admin:** có toàn bộ quyền quản trị và CRUD sản phẩm/tồn kho.
- Giao diện được tách theo trang: `public/index.html` cho cửa hàng, `public/pages/nhan-vien.html` cho nhân viên và `public/pages/admin.html` cho admin. Sau đăng nhập, nhân viên/admin vào đúng trang quản trị theo vai trò; từ đó có thể chuyển sang cửa hàng và quay lại quản trị bằng điều hướng. Trang cửa hàng giữ nguyên khi tải lại, không tự chuyển nhân viên/admin về trang quản trị.
- Tên tài khoản (3–32 ký tự chữ không dấu, số, `.`, `_`, `-`) và mật khẩu dùng để đăng nhập. Không yêu cầu email hoặc số điện thoại.
- Danh sách cửa hàng hiển thị tối đa 20 sản phẩm mỗi trang; bộ lọc và tìm kiếm cũng được phân trang.
- Đăng ký công khai chỉ tạo vai trò khách hàng. Tạo tài khoản nhân viên/admin bằng CLI; mật khẩu được đọc từ stdin, không truyền trong tham số lệnh. Ví dụ PowerShell:

  ```powershell
  $secure = Read-Host "Mật khẩu (tối thiểu 12 ký tự)" -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) | php server/scripts/create-account.php quantri admin
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
  ```

  Thay tên tài khoản và vai trò (`nhan_vien` hoặc `admin`) theo nhu cầu. Mật khẩu này dùng để đăng nhập vào website.

API lưu mật khẩu tài khoản mới dưới dạng hash, dùng session cookie `HttpOnly`/`SameSite` và token CSRF cho thao tác ghi. Để hỗ trợ dữ liệu demo cũ trong `MatKhau`, đăng nhập cũng chấp nhận mật khẩu dạng chữ; hãy đổi các mật khẩu này sang hash trước khi triển khai thật. Nhân viên/admin chỉ được tạo bởi CLI; biểu mẫu đăng ký khách hàng không nhận vai trò đặc quyền.

## API

- `GET /api/san-pham`: danh sách sản phẩm.
- `GET /api/san-pham/{MaSP}`: chi tiết sản phẩm.
- `GET /api/san-pham/{MaSP}/hinh-anh`: ảnh BLOB từ `HinhAnh`.
- `GET /api/auth/session`, `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`: phiên tài khoản. Đăng nhập và đăng ký nhận `tenTaiKhoan` và `matKhau`.
- `GET /api/quan-tri`: dữ liệu quản trị, yêu cầu nhân viên hoặc admin.
- `POST /api/san-pham`, `PUT /api/san-pham/{MaSP}`, `DELETE /api/san-pham/{MaSP}`: yêu cầu admin.

Tạo sản phẩm cần nhập mã `MaSP`, tên, nhà cung cấp, đơn vị, giá và tồn kho. Danh mục vẫn được phân loại theo tên sản phẩm như trước; schema hiện chưa có cột danh mục. Checkout và hóa đơn trên giao diện vẫn là dữ liệu minh họa, chưa được lưu vào database.

`GET /api/quan-tri` đọc hóa đơn từ `hoadon`/`cthoadon`/`khachhang` và tài khoản từ `taikhoan`; mật khẩu không được gửi ra trình duyệt. Nếu API không kết nối được, kiểm tra `.env`, dịch vụ MySQL và PHP đã bật `pdo_mysql`. Chi tiết kết nối được ghi vào PHP error log; phản hồi API không tiết lộ thông tin cấu hình.

## Lưu ý

Document root là thư mục `public`; mở `http://127.0.0.1:8000` qua máy chủ PHP, không mở `public/index.html` trực tiếp bằng `file://`. Với Apache, hãy cấu hình document root về `public`; `.htaccess` chuyển tiếp `/api` qua `public/api/index.php` tới backend trong `server`.

Tạo 1 file .env nội dung file lấy ở file .env.exaple