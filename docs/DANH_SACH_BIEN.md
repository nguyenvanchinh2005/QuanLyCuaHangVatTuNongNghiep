# Danh sách biến giao diện

Tài liệu ghi lại các biến giao diện và thuộc tính dữ liệu đang dùng trong dự án. Mã JavaScript hiện nằm trong `public/assets/js/app.js`; các biến trạng thái cấp mô-đun được bổ sung bên dưới. Bảng biến JavaScript hiện có và bảng thuộc tính SQL được giữ lại để đối chiếu với phiên bản giao diện trước. Các biến CSS được khai báo trong `public/assets/css/app.css`.

## Biến trạng thái trong `public/assets/js/app.js`

| Biến | Dòng | Ý nghĩa |
|---|---:|---|
| `duLieuQuanTri` | 11 | Dữ liệu đơn hàng và tài khoản dành cho khu vực quản trị. |
| `dangTaiSanPham` | 12 | Cho biết dữ liệu sản phẩm đang được tải. |
| `loiTaiSanPham` | 13 | Cho biết lần tải sản phẩm có gặp lỗi hay không. |
| `dangTaiDuLieuQuanTri` | 14 | Cho biết dữ liệu quản trị đang được tải. |
| `daTaiDuLieuQuanTri` | 15 | Cho biết dữ liệu quản trị đã được tải thành công. |
| `loiTaiDuLieuQuanTri` | 16 | Cho biết lần tải dữ liệu quản trị có gặp lỗi hay không. |
| `trangVao` | 17 | Màn hình ban đầu, lấy từ thuộc tính `data-trang-vao` của trang. |
| `vaiTroYeuCau` | 18 | Vai trò cần có để truy cập trang, lấy từ thuộc tính `data-vai-tro-yeu-cau`. |
| `tokenCsrf` | 21 | Mã chống giả mạo yêu cầu được gửi kèm các yêu cầu API cần bảo vệ. |
| `cheDoTaiKhoan` | 22 | Chế độ hiện tại của hộp thoại tài khoản. |
| `maSanPhamDangSua` | 23 | Mã sản phẩm đang được chỉnh sửa trong khu vực quản trị. |
| `soSanPhamMoiTrang` | 25 | Số sản phẩm tối đa hiển thị trên mỗi trang. |
| `trangSanPham` | 26 | Số thứ tự trang sản phẩm đang hiển thị. |
| `oHopChiTietSanPham` | 53 | Phần tử hộp thoại hiển thị chi tiết sản phẩm. |

## Biến JavaScript

| Biến | Dòng | Ý nghĩa |
|---|---:|---|
| `duLieuMacDinh` | 384 | Trạng thái khởi tạo rỗng của cửa hàng, gồm sản phẩm, bài viết, người dùng, giỏ hàng, đơn hàng, tài khoản và yêu thích. |
| `duLieuLuu` | 393 | Trạng thái dữ liệu đang dùng trong phiên hiện tại. |
| `trangHienTai` | 395 | Mã màn hình đang được mở. |
| `tabQuanTri` | 396 | Tab đang chọn trong khu vực quản trị. |
| `boLocHienTai` | 418 | Trạng thái lọc sản phẩm hiện tại, gồm từ khóa, danh mục cha và nhóm danh mục con. |
| `danhMucDangMo` | 419 | Danh mục cha đang được mở trong menu lọc. |
| `menuDanhMucDangMo` | 420 | Trạng thái đóng/mở menu lọc danh mục. |
| `danhSachDanhMuc` | 421 | Danh sách danh mục cha và các nhóm danh mục con hiển thị trong bộ lọc. |
| `henThongBao` | 398 | Bộ hẹn giờ dùng để ẩn thông báo. |
| `oNoiDung` | 399 | Phần tử HTML chứa nội dung chính của trang. |
| `oTimKiem` | 400 | Ô tìm kiếm trên thanh đầu trang. |
| `oHopTaiKhoan` | 401 | Hộp thoại tài khoản. |
| `oHopBaiViet` | 402 | Hộp thoại chi tiết bài viết. |
| `oThongBao` | 421 | Phần tử hiển thị thông báo ngắn. |
| `soLuong` | 429 | Tổng số mặt hàng đang có trong giỏ. |
| `dangChon` | 437 | Trạng thái xác định nút điều hướng có đang được chọn không. |
| `hamVe` | 446 | Bảng ánh xạ màn hình tới hàm dựng giao diện tương ứng. |
| `danhMucCha` | 512 | Danh mục cha được tìm theo bộ lọc hiện tại để xác định các nhóm con phù hợp. |
| `noiDungTimKiem` | 514 | Chuỗi thông tin sản phẩm dùng để so khớp từ khóa. |
| `tenDanhMuc` | 515 | Tên danh mục sản phẩm chuẩn hóa để so khớp bộ lọc. |
| `khopTuKhoa` | 516 | Kết quả kiểm tra sản phẩm có khớp từ khóa tìm kiếm hay không. |
| `danhSachTenDanhMuc` | 517 | Tên danh mục cha và các nhóm con được dùng khi lọc theo danh mục cha. |
| `khopDanhMuc` | 518 | Kết quả kiểm tra sản phẩm có thuộc danh mục được chọn hay không. |
| `danhMucDangChon` | 526 | Đối tượng danh mục cha đang hiển thị các nhóm con trong menu. |
| `tenDangLoc` | 527 | Tên danh mục cha hoặc nhóm con đang được chọn để tạo trạng thái giao diện. |
| `ketQuaSanPham` | 541 | Danh sách sản phẩm sau khi lọc theo từ khóa và danh mục. |
| `dangLoc` | 542 | Cho biết người dùng đang áp dụng từ khóa hoặc danh mục lọc. |
| `tieuDeLoc` | 543 | Tên danh mục hoặc nhóm con đang được dùng làm tiêu đề kết quả. |
| `donCuaToi` | 505 | Các đơn hàng thuộc tài khoản hiện tại. |
| `danhSach` | 506 | Danh sách đơn hàng sẽ hiển thị. |
| `sanPham` | 508, 542, 584 | Sản phẩm được tìm thấy trong đơn hàng hoặc được thao tác trong giỏ. |
| `taiKhoan` | 512 | Thông tin tài khoản hiện tại. |
| `tongGiaTri` | 518 | Tổng giá trị các đơn hàng. |
| `cacTab` | 519 | Danh sách các tab quản trị. |
| `noiDungTab` | 520 | Nội dung giao diện của tab quản trị đang chọn. |
| `monTrongGio` | 544, 582 | Mặt hàng tương ứng trong giỏ. |
| `noiDung` | 569 | Phần tử chứa nội dung ngăn giỏ hàng. |
| `cacMon` | 570, 618 | Các mặt hàng hợp lệ trong giỏ, kèm thông tin sản phẩm. |
| `tongTien` | 571, 622 | Tổng tiền của giỏ hàng hoặc đơn hàng đang tạo. |
| `laDangKy` | 593 | Cho biết hộp thoại tài khoản đang ở chế độ đăng ký. |
| `matKhau` | 604 | Mật khẩu được nhập trong biểu mẫu tài khoản. |
| `ten` | 623 | Tên người nhận hàng. |
| `tenTaiKhoan` | 626 | Tên tài khoản gắn với đơn demo. |
| `phuongThuc` | 621 | Phương thức thanh toán được chọn. |
| `maHoaDon` | 625 | Mã hóa đơn gồm 6 ký tự theo `HOADON.MaHD`. |
| `donMoi` | 626 | Đối tượng hóa đơn; chi tiết bán hàng mang cùng `MaHD` theo khóa chính ghép. |
| `bai` | 637 | Bài viết được chọn để mở chi tiết. |
| `sanPhamGoiY` | 639 | Sản phẩm liên quan tới bài viết. |
| `nutTrang` | 646 | Nút điều hướng trang vừa được nhấn. |
| `nutThem` | 648 | Nút thêm sản phẩm vào giỏ vừa được nhấn. |
| `nutThich` | 650 | Nút yêu thích sản phẩm vừa được nhấn. |
| `danhMuc` | 531 | Danh mục cha trong vòng lặp dựng danh sách danh mục của menu. |
| `nhom` | 535 | Tên nhóm danh mục con trong vòng lặp dựng menu. |
| `nutMoDanhMuc` | 714 | Nút mở hoặc đóng menu lọc danh mục. |
| `nutDanhMucCha` | 720 | Nút chọn danh mục cha để tải các nhóm con trong menu. |
| `nutChonDanhMuc` | 729 | Nút chọn toàn bộ sản phẩm của một danh mục cha. |
| `nutChonNhomDanhMuc` | 738 | Nút chọn một nhóm danh mục con để lọc sản phẩm. |
| `maSanPham` | 652 | Mã sản phẩm đang được thao tác. |
| `nutTab` | 667 | Tab quản trị vừa được nhấn. |
| `nutCapNhatDon` | 669 | Nút cập nhật đơn hàng vừa được nhấn. |
| `donHang` | 671 | Đơn hàng được tìm để cập nhật trạng thái. |
| `nutDoiNguoi` | 675 | Nút đổi trạng thái người dùng vừa được nhấn. |
| `nguoiDung` | 677 | Người dùng được tìm để đổi trạng thái. |
| `nutXoaBenh` | 681 | Nút xóa bài viết vừa được nhấn. |
| `nutDocBai` | 686 | Nút mở bài viết vừa được nhấn. |

## Biến CSS

| Biến | Dòng | Ý nghĩa |
|---|---:|---|
| `--la-dam` | 16 | Màu xanh lá chính. |
| `--la-sang` | 17 | Màu nền xanh lá nhạt. |
| `--la-nhat` | 18 | Màu xanh lá rất nhạt. |
| `--cam` | 19 | Màu cam nhấn. |
| `--vang` | 20 | Màu vàng nhấn. |
| `--muc` | 21 | Màu chữ chính. |
| `--phu` | 22 | Màu chữ phụ. |
| `--vien` | 23 | Màu đường viền. |
| `--trang` | 24 | Màu trắng. |
| `--do` | 25 | Màu cảnh báo hoặc thao tác xóa. |
| `--nen` | 26 | Màu nền trang. |
| `--bong` | 27 | Kiểu đổ bóng dùng cho thành phần giao diện. |

## Thuộc tính Theo SQL

Các thuộc tính dữ liệu sản phẩm và hóa đơn trong `public/index.html` dùng tên cột từ schema đã cung cấp. Những vị trí bên dưới là nơi các thuộc tính được đọc hoặc tạo.

| Thuộc tính | Bảng/cột SQL | Dòng dùng trong HTML | Ý nghĩa |
|---|---|---:|---|
| `MaSP` | `SANPHAM.MaSP`, `CTHOADON.MaSP` | 461, 466, 542, 544, 546, 570, 577, 582, 583, 586, 618, 626, 639, 640, 663 | Mã sản phẩm, cũng là khóa ngoại trong chi tiết hóa đơn. |
| `TenSP` | `SANPHAM.TenSP`, `CTHOADON.TenSP` | 459, 464, 466, 509, 577, 626, 640 | Tên sản phẩm. |
| `Giaban` | `SANPHAM.Giaban` | 466, 571, 577, 622, 626, 640 | Giá bán hiện tại của sản phẩm. |
| `Soluong` | `SANPHAM.Soluong` | 465, 543, 545, 587, 620, 627 | Số lượng tồn kho. |
| `TenNCC` | `SANPHAM.TenNCC` | 463, 472 | Tên nhà cung cấp. |
| `DviTinh` | `SANPHAM.DviTinh`, `CTHOADON.DviTinh` | 460, 465, 472, 626 | Đơn vị tính. |
| `MaHD` | `HOADON.MaHD`, `CTHOADON.MaHD` | 508, 530, 626, 671 | Mã hóa đơn, đồng thời là một phần khóa chính ghép của chi tiết hóa đơn. |
| `Ngaylap` | `HOADON.Ngaylap` | 508, 530, 626 | Ngày lập hóa đơn. |
| `MaKH` | `HOADON.MaKH` | 626 | Mã khách hàng; hiện để `null` vì giao diện chưa có dữ liệu khách hàng từ database. |
| `MaNv` | `HOADON.MaNv` | 626 | Mã nhân viên; hiện để `null` vì giao diện chưa có dữ liệu nhân viên từ database. |
| `SlBan` | `CTHOADON.SlBan` | 508, 626 | Số lượng bán trong dòng hóa đơn. |
| `GiaBan` | `CTHOADON.GiaBan` | 626 | Giá bán tại thời điểm lập hóa đơn. |
| `Giamgia` | `CTHOADON.Giamgia` | 626 | Giá trị giảm giá; hiện mặc định bằng 0. |
| `TongHD` | `CTHOADON.TongHD` | 626 | Tổng tiền của dòng hóa đơn. |

Các thuộc tính ảnh (`anh`) và thông tin giao diện đơn hàng như trạng thái/thanh toán không có cột tương ứng trong SQL đã gửi, nên vẫn là dữ liệu hiển thị tạm thời, không phải cột database. Bộ lọc danh mục đọc `DanhMuc` hoặc `TenDanhMuc` từ dữ liệu API (có hỗ trợ bí danh `danhMuc` và `category`); các tên này chưa được xác nhận là cột trong schema SQL.