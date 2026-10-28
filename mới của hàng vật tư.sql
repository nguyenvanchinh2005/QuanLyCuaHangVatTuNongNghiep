/* chạy trên SQL server*/
CREATE DATABASE quanlycuahangvattunongnghiep;
GO
USE quanlycuahangvattunongnghiep;
GO
/* chạy trên mySQL
CREATE DATABASE quanlycuahangvattunongnghiep CHARACTER SET utf8mb4;
USE quanlycuahangvattunongnghiep;
*/

/*-----TẠO BẢNG-----*/

/*-- Bảng nhà cung cấp --*/
CREATE TABLE ncc (
    MaNCC   VARCHAR(6)    NOT NULL,
    TenNCC  NVARCHAR(100) NOT NULL,
    Diachi  NVARCHAR(255) NULL,
    SDT     VARCHAR(15)   NULL,
    CONSTRAINT PK_ncc PRIMARY KEY (MaNCC)
);

/*-- Bảng sản phẩm --*/
CREATE TABLE sanpham (
    MaSP     VARCHAR(6)     NOT NULL,
    TenSP    NVARCHAR(200)  NOT NULL,
    MaNCC    VARCHAR(6)     NULL,
    DviTinh  NVARCHAR(20)   NULL,
    Giaban   DECIMAL(18,2)  NOT NULL DEFAULT 0,
    Soluong  INT            NOT NULL DEFAULT 0,
    CONSTRAINT PK_sanpham PRIMARY KEY (MaSP),
    CONSTRAINT FK_sanpham_ncc FOREIGN KEY (MaNCC) REFERENCES ncc (MaNCC),
    CONSTRAINT CK_sanpham_giaban  CHECK (Giaban  >= 0),
    CONSTRAINT CK_sanpham_soluong CHECK (Soluong >= 0)
);

/*-- Bảng hình ảnh sản phẩm --*/
CREATE TABLE hinhanhsanpham (
    MaAnh     VARCHAR(10)    NOT NULL,
    MaSP      VARCHAR(6)     NOT NULL,
    DuongDan  NVARCHAR(500)  NOT NULL,
    MoTa      NVARCHAR(200)  NULL,
    AnhChinh  TINYINT        NOT NULL DEFAULT 0,
    ThuTu     INT            NOT NULL DEFAULT 1,
    CONSTRAINT PK_hinhanhsanpham PRIMARY KEY (MaAnh),
    CONSTRAINT FK_hinhanh_sanpham FOREIGN KEY (MaSP) REFERENCES sanpham (MaSP) ON DELETE CASCADE,
    CONSTRAINT UQ_hinhanh_sp_thutu UNIQUE (MaSP, ThuTu),
    CONSTRAINT CK_hinhanh_anhchinh CHECK (AnhChinh IN (0, 1))
);

/*-- Bảng khách hàng--*/
CREATE TABLE khachhang (
    MaKH   VARCHAR(6)    NOT NULL,
    TenKH  NVARCHAR(100) NOT NULL,
    DiaChi NVARCHAR(255) NULL,
    SDT    VARCHAR(15)   NULL,
    CONSTRAINT PK_khachhang PRIMARY KEY (MaKH)
);

/*-- Bảng nhân viên --*/
CREATE TABLE nhanvien (
    MaNv    VARCHAR(6)     NOT NULL,
    HoTen   NVARCHAR(100)  NOT NULL,
    GioLam  INT            NULL,
    SDT     VARCHAR(15)    NULL,
    Luong   DECIMAL(18,2)  NULL,
    CONSTRAINT PK_nhanvien PRIMARY KEY (MaNv)
);

/*-- Bảng tài khoản--*/
CREATE TABLE taikhoan (
    MaTK     VARCHAR(10)   NOT NULL,
    TenTK    VARCHAR(50)   NOT NULL,
    MatKhau  VARCHAR(255)  NOT NULL,
    VaiTro   VARCHAR(20)   NOT NULL,
    CONSTRAINT PK_taikhoan PRIMARY KEY (MaTK),
    CONSTRAINT UQ_taikhoan_tentk UNIQUE (TenTK)
);

/*-- Bảng hóa đơn --*/
CREATE TABLE hoadon (
    MaHD     VARCHAR(6)  NOT NULL,
    Ngaylap  DATE        NOT NULL,
    MaKH     VARCHAR(6)  NULL,
    MaNv     VARCHAR(6)  NULL,
    CONSTRAINT PK_hoadon PRIMARY KEY (MaHD),
    CONSTRAINT FK_hoadon_khachhang FOREIGN KEY (MaKH) REFERENCES khachhang (MaKH),
    CONSTRAINT FK_hoadon_nhanvien  FOREIGN KEY (MaNv) REFERENCES nhanvien (MaNv)
);

/*-- Bảng chi tiết hóa đơn--*/
CREATE TABLE cthoadon (
    MaHD      VARCHAR(6)     NOT NULL,
    MaSP      VARCHAR(6)     NOT NULL,
    SlBan     INT            NOT NULL,
    GiaBan    DECIMAL(18,2)  NOT NULL,
    Giamgia   DECIMAL(5,2)   NOT NULL DEFAULT 0,
    ThanhTien DECIMAL(18,2)  NOT NULL,
    CONSTRAINT PK_cthoadon PRIMARY KEY (MaHD, MaSP),
    CONSTRAINT FK_cthoadon_hoadon  FOREIGN KEY (MaHD) REFERENCES hoadon (MaHD) ON DELETE CASCADE,
    CONSTRAINT FK_cthoadon_sanpham FOREIGN KEY (MaSP) REFERENCES sanpham (MaSP),
    CONSTRAINT CK_cthoadon_slban   CHECK (SlBan > 0),
    CONSTRAINT CK_cthoadon_giamgia CHECK (Giamgia >= 0 AND Giamgia <= 100)
);

/*-- Bảng phiếu nhập--*/
CREATE TABLE pnhap (
    MaPN      VARCHAR(8)  NOT NULL,
    MaNCC     VARCHAR(6)  NULL,
    Ngaynhap  DATE        NOT NULL,
    CONSTRAINT PK_pnhap PRIMARY KEY (MaPN),
    CONSTRAINT FK_pnhap_ncc FOREIGN KEY (MaNCC) REFERENCES ncc (MaNCC)
);

/*-- Bảng chi tiết phiếu nhập --*/
CREATE TABLE ctpnhap (
    MaPN     VARCHAR(8)     NOT NULL,
    MaSP     VARCHAR(6)     NOT NULL,
    SlNhap   INT            NOT NULL,
    Gianhap  DECIMAL(18,2)  NOT NULL,
    TongGT   DECIMAL(18,2)  NOT NULL,
    CONSTRAINT PK_ctpnhap PRIMARY KEY (MaPN, MaSP),
    CONSTRAINT FK_ctpnhap_pnhap   FOREIGN KEY (MaPN) REFERENCES pnhap (MaPN) ON DELETE CASCADE,
    CONSTRAINT FK_ctpnhap_sanpham FOREIGN KEY (MaSP) REFERENCES sanpham (MaSP),
    CONSTRAINT CK_ctpnhap_slnhap CHECK (SlNhap > 0)
);

/*-- Bảng tồn kho --*/
CREATE TABLE tonkho (
    Namthang  DATE         NOT NULL,
    MaSP      VARCHAR(6)   NOT NULL,
    SlBandau  INT          NOT NULL DEFAULT 0,
    SlNhap    INT          NOT NULL DEFAULT 0,
    SlBan     INT          NOT NULL DEFAULT 0,
    SlConlai  INT          NOT NULL DEFAULT 0,
    CONSTRAINT PK_tonkho PRIMARY KEY (Namthang, MaSP),
    CONSTRAINT FK_tonkho_sanpham FOREIGN KEY (MaSP) REFERENCES sanpham (MaSP)
);

/*-- Bảng doanh thu --*/
CREATE TABLE doanhthu (
    Thang     DATE           NOT NULL,
    MaSP      VARCHAR(6)     NOT NULL,
    Doanhthu  DECIMAL(18,2)  NOT NULL DEFAULT 0,
    Loinhuan  DECIMAL(18,2)  NOT NULL DEFAULT 0,
    CONSTRAINT PK_doanhthu PRIMARY KEY (Thang, MaSP),
    CONSTRAINT FK_doanhthu_sanpham FOREIGN KEY (MaSP) REFERENCES sanpham (MaSP)
);

/*-----INDEX CHO CÁC KHÓA NGOẠI-----*/
CREATE INDEX IX_sanpham_mancc      ON sanpham (MaNCC);
CREATE INDEX IX_hinhanh_masp       ON hinhanhsanpham (MaSP);
CREATE INDEX IX_hoadon_makh        ON hoadon (MaKH);
CREATE INDEX IX_hoadon_manv        ON hoadon (MaNv);
CREATE INDEX IX_cthoadon_masp      ON cthoadon (MaSP);
CREATE INDEX IX_pnhap_mancc        ON pnhap (MaNCC);
CREATE INDEX IX_ctpnhap_masp       ON ctpnhap (MaSP);
CREATE INDEX IX_tonkho_masp        ON tonkho (MaSP);
CREATE INDEX IX_doanhthu_masp      ON doanhthu (MaSP);

/*-----THÊM DỮ LIỆU -----*/

INSERT INTO ncc (MaNCC, TenNCC, Diachi, SDT) VALUES
(N'NCC01', N'CÔNG TY TNHH TM VÀ DV ĐỨC THUẬN', N'Số 33 Đường Số 1, Phường Phước Bình, Thành phố Thủ Đức, TP. Hồ Chí Minh', '0837282555'),
(N'NCC02', N'Công ty TNHH SX - TM - DV Đặng Gia Trang', N'Tầng 1 – Phú Đông Building, Số 77 Lê Trung Nghĩa, P. Bảy Hiền, TP.HCM', '0862594914'),
(N'NCC03', N'Công ty TNHH Công Nghệ Sinh Học Sài Gòn Xanh', N'127 Nguyễn Trọng Tuyển, Phường Cầu Kiệu, Quận Phú Nhuận, TP. Hồ Chí Minh', '0839971869'),
(N'NCC04', N'SHOP CAY TRONG CO, LTD.', N'72 Nguyễn Ngọc Phương, Phường 19, Quận Bình Thạnh, TP. HCM', '0901455789'),
(N'NCC05', N'Công ty TNHH Phước Lộc Tiền Giang', N'Tòa Nhà Vinafood1, 94 Lương Yên, Phường Hai Bà Trưng, TP. Hà Nội', '0912005564'),
(N'NCC06', N'Công ty Nông Dược Hoàng Kim', N'Số 124/5M Thới Tam Thôn 5, ấp Tam Đông 2, Xã Thới Tam Thôn, Huyện Hóc Môn, TP. Hồ Chí Minh, TP.HCM', '0906718568'),
(N'NCC07', N'CÔNG TY CỔ PHẦN BÌNH ĐIỀN – MEKONG', N'Lô A10.1, Đường D3, KCN Thành Thành Công, Phường Trảng Bàng, Tỉnh Tây Ninh', '0837564041'),
(N'NCC08', N'Hoàng Anh Agritech', N'Thôn Phú Ninh, xã Hội Thịnh, tỉnh Phú Thọ', '0934545777'),
(N'NCC09', N'Công Ty Cổ Phần Nghiệp Nông', N'Số 92, Đường 19E, Phường An Lạc, Thành phố Hồ Chí Minh', '0838238955'),
(N'NCC10', N'CÔNG TY TNHH TM & DV XNK ANH KIỀU', N'10E Đường số 8, Khu phố 4, Phường Hiệp Bình Phước, Thành phố Thủ Đức, TP. Hồ Chí Minh', '0933334998'),
(N'NCC11', N'Công ty TNHH MTV hạt giống Rạng Đông', N'240/6/1 Đ. Phạm Văn Chiêu, Thông Tây Hội, Hồ Chí Minh', '0968279339'),
(N'NCC12', N'Công ty TNHH Phú Nông', N'Quốc lộ 91, Khu vực Qui Thạnh 1, P. Thuận Hưng, Tp. Cần Thơ', '0923610699'),
(N'NCC13', N'CÔNG TY TNHH HẠT GIỐNG HOA VIỆT NAM', N'31/78 Phan Huy Ích, P.15, Q. Tân Bình, TP. HCM', '0854272155'),
(N'NCC14', N'CÔNG TY TNHH EAST- WEST SEED', N'Số 1 VSIP II-A, đường số 14, Phường Vĩnh Tân, Thành phố Hồ Chí Minh, Việt Nam', '0742220233'),
(N'NCC15', N'Công ty TNHH ADC', N'101 Phan Đình Phùng, Phường Ninh Kiều, TP. Cần Thơ', '0923659999'),
(N'NCC16', N'Công ty TNHH MTV Sinh Hóa Nông Phú Lâm', N'2A/5 Đường số 10, Cư xá Đài Ra Đa Phú Lâm, Phường 13, Quận 6, TP.HCM', '0838762958'),
(N'NCC17', N'Công ty TNHH UNIGREEN', N'Số 350 ĐT743A, KP. Đông An, P. Tân Đông Hiệp, TP. Dĩ An, Bình Dương', '0838238989'),
(N'NCC18', N'Công ty Hóa Nông Lúa Vàng', N'Số 540, Ấp Thạnh Lợi, Xã Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang', '0983970780'),
(N'NCC19', N'Công Ty Cổ Phần Nông Dược HAI', N'28 Mạc Đĩnh Chi, Phường Đa Kao, Quận 1, TP.HCM', '1800577768'),
(N'NCC20', N'Công ty TNHH Hồng Tiến Phát', N'Số 46, Đường Ngô Quyền, Phường Máy Chai, Quận Ngô Quyền, Hải Phòng', '0253570688'),
(N'NCC21', N'Công ty TNHH Kinh Doanh Thương Mại Minh Nam', N'Số N-04-02, xóm 4, thôn Quỳnh Đô, Xã Vĩnh Quỳnh, Huyện Thanh Trì, Hà Nội', '0983361188'),
(N'NCC22', N'Cửa hàng vật tư Nông Nghiệp Thiện Xanh', N'Quốc lộ 1A, Xã Hòa Phú, Huyện Long Hồ, Tỉnh Vĩnh Long', '0939123798'),
(N'NCC23', N'Công ty TNHH Nhựa Đức Đạt', N'Lô 40-42 Đường Số 3, KCN Tân Tạo, P. Tân Tạo, Q. Bình Tân, TP.HCM', '0903874874'),
(N'NCC24', N'Công ty TNHH SX TM DV Trồng cây 24H', N'121 Nguyễn Thị Kiểu, Phường Tân Thới Hiệp, Quận 12, TP.HCM', '0938902488'),
(N'NCC25', N'Công ty TNHH FMC Việt Nam', N'29A Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP.HCM', '1900886647'),
(N'NCC26', N'Công ty TNHH Tô Đăng Khoa', N'292 Phạm Văn Đồng, Phường 1, Quận Gò Vấp, TP.HCM', '0835885678'),
(N'NCC27', N'Công ty TNHH Ngân Anh', N'378/4 Điện Biên Phủ, Phường 11, Quận 10, TP.HCM', '0838327127'),
(N'NCC28', N'Công ty TNHH Corteva Agriscience', N'Lầu 14, Tòa nhà MPlaza Saigon, 39 Lê Duẩn, P. Bến Nghé, Quận 1, TP.HCM', '1800588808'),
(N'NCC29', N'Công ty TNHH Bayer Việt Nam', N'Lô 118/4, KCN Amata, Phường Long Bình, TP. Biên Hòa, Đồng Nai', '0838450828');

INSERT INTO sanpham (MaSP, TenSP, MaNCC, DviTinh, Giaban, Soluong) VALUES
(N'SP001', N'Đất hữu cơ đa dụng POTTING SOIL LAVAMIX', N'NCC01', N'Bao', 42000, 148),
(N'SP002', N'Đá perlite trân châu Lavamix', N'NCC01', N'Bao', 45000, 199),
(N'SP003', N'Đất trồng cây đa dụng SFARM', N'NCC02', N'Bao', 72000, 97),
(N'SP004', N'Đất trồng cây Tribat giàu dinh dưỡng', N'NCC03', N'Bao', 38000, 80),
(N'SP005', N'Soil Mix - Giá thể', N'NCC04', N'Túi', 164000, 120),
(N'SP006', N'Viên nén xơ dừa ươm hạt', N'NCC05', N'Viên', 1200, 20000),
(N'SP007', N'Nấm 3 màu BIO-HK. INS (Chai 1 Lít)', N'NCC06', N'Chai', 122000, 198),
(N'SP008', N'Phân hữu cơ Đầu Trâu MK N.3 BIO-HUMIC', N'NCC07', N'Túi', 45000, 200),
(N'SP009', N'Phân bón lá vi lượng', N'NCC08', N'Lọ', 33000, 200),
(N'SP010', N'Phân bón Hỗn Hợp KALI Hữu Cơ', N'NCC09', N'Chai', 96000, 200),
(N'SP011', N'Phân Bón Hữu Cơ ANKI BALANCED', N'NCC10', N'Chai', 99000, 200),
(N'SP012', N'Hạt giống Cải Xoăn (Cải Kale) RADO 686', N'NCC11', N'Gói', 15000, 520),
(N'SP013', N'Hạt giống mồng tơi lá to PN 591', N'NCC12', N'Gói', 12000, 780),
(N'SP014', N'Hạt giống Hoa Mai Địa Thảo Kép Rũ Nhiều Màu FVN', N'NCC13', N'Gói', 25000, 460),
(N'SP015', N'ATONIK 1.8SL tăng sinh trưởng, kích chồi và rễ', N'NCC15', N'Lọ', 105000, 180),
(N'SP016', N'N3M kích rễ', N'NCC16', N'Lọ', 35000, 160),
(N'SP017', N'Phân bón lá VITAMIN B1 GROWMORE – Kích rễ', N'NCC17', N'Chai', 22000, 280),
(N'SP018', N'Comcat Lúa Vàng 150WP', N'NCC18', N'Gói', 20000, 185),
(N'SP019', N'Chất điều hòa sinh trưởng DEKAMON 22.43SL', N'NCC19', N'Chai', 79000, 380),
(N'SP020', N'Chậu Aquaponics 70L', N'NCC20', N'Cái', 209000, 360),
(N'SP021', N'Viên đất nung sỏi nhẹ VINATAP 10-15mm', N'NCC21', N'Bao', 50000, 860),
(N'SP022', N'Chậu Aquaponics 70L', N'NCC22', N'Cái', 185000, 400),
(N'SP023', N'Bình tưới cây DUDACO chuyên dụng - 2 Lít', N'NCC23', N'Cái', 72000, 580),
(N'SP024', N'Keo liền sẹo liền da LS50', N'NCC24', N'Lọ', 32000, 1020),
(N'SP025', N'Thuốc trừ sâu FMC BENEVIA 100OD 50ml', N'NCC25', N'Lọ', 145000, 500),
(N'SP026', N'Thuốc trị thối nhũn PONER - 40TB', N'NCC26', N'Gói', 11000, 1600),
(N'SP027', N'NeemNim Ấn Độ (100ml)', N'NCC27', N'Chai', 69000, 390),
(N'SP028', N'Thuốc trừ sâu RADIANT 60SC (15ml)', N'NCC28', N'Gói', 44000, 950),
(N'SP029', N'Antracol 70WP', N'NCC29', N'Gói', 43000, 879);

INSERT INTO khachhang (MaKH, TenKH, DiaChi, SDT) VALUES
(N'KH001', N'Nguyễn Văn An', N'Quận Thanh Xuân, Hà Nội', '0912345678'),
(N'KH002', N'Trần Thị Mai', N'Quận Tân Bình, TP.HCM', '0987654321'),
(N'KH003', N'Lê Hoàng Long', N'Quận Hải Châu, Đà Nẵng', '0909112233'),
(N'KH004', N'Nguyễn Trung Hiếu', N'Phường Xuân Hòa, Phú Thọ', '0836464855'),
(N'KH005', N'Dương Giang Huy', N'Đại Mỗ, Hà Đông, Hà Nội', '0956486237'),
(N'KH006', N'Đào Nguyên Vũ', N'Tây Hồ, Hà Nội', '0836512985'),
(N'KH007', N'Lê Thanh Hoàng', N'Lĩnh Nam, Hà Nội', '0958743612'),
(N'KH008', N'Dương Quốc Ánh', N'Quận 1, TP.HCM', '0865975823'),
(N'KH009', N'Nguyễn Đức Anh', N'Thanh Khê, Đà Nẵng', '0812546920'),
(N'KH010', N'Đinh Văn Thành', N'Lâm Hà, Lâm Đồng', '0936598216');

INSERT INTO nhanvien (MaNv, HoTen, GioLam, SDT, Luong) VALUES
(N'NV001', N'Nguyễn Quang Dũng', 160, '0836464800', 8500000),
(N'NV002', N'Ngô Xuân Bách', 160, '0977856492', 8000000),
(N'NV003', N'Nguyễn Văn Chính', 160, '0977856492', 8300000),
(N'NV004', N'Vũ Đình Quý', 160, '0977856492', 8000000);

INSERT INTO taikhoan (MaTK, TenTK, MatKhau, VaiTro) VALUES
('TK001', 'admin', '123456', 'admin'),
('TK002', 'nhanvien', '123456', 'Nvien'),
('TK003', 'Khach1', '123456', 'NguoiDung');

INSERT INTO hoadon (MaHD, Ngaylap, MaKH, MaNv) VALUES
(N'HD001', '2026-10-01', N'KH001', N'NV001'),
(N'HD002', '2026-10-02', N'KH002', N'NV002'),
(N'HD003', '2026-10-03', N'KH003', N'NV001');

INSERT INTO cthoadon (MaHD, MaSP, SlBan, GiaBan, Giamgia, ThanhTien) VALUES
(N'HD001', N'SP001', 2, 42000, 0, 84000),
(N'HD002', N'SP002', 1, 45000, 0, 45000),
(N'HD003', N'SP003', 3, 72000, 0, 216000);

INSERT INTO pnhap (MaPN, MaNCC, Ngaynhap) VALUES
(N'PN001', N'NCC01', '2026-09-25'),
(N'PN002', N'NCC02', '2026-09-28'),
(N'PN003', N'NCC03', '2026-09-30');

INSERT INTO ctpnhap (MaPN, MaSP, SlNhap, Gianhap, TongGT) VALUES
(N'PN001', N'SP001', 100, 42000, 4200000),
(N'PN002', N'SP002', 150, 45000, 6750000),
(N'PN003', N'SP003', 80, 72000, 5760000);

INSERT INTO tonkho (Namthang, MaSP, SlBandau, SlNhap, SlBan, SlConlai) VALUES
('2026-10-01', N'SP001', 50, 100, 2, 148),
('2026-10-01', N'SP002', 50, 150, 1, 199),
('2026-10-01', N'SP003', 20, 80, 3, 97);

INSERT INTO doanhthu (Thang, MaSP, Doanhthu, Loinhuan) VALUES
('2026-10-01', N'SP001', 84000, 25200),
('2026-10-01', N'SP002', 45000, 13500),
('2026-10-01', N'SP003', 216000, 64800);

INSERT INTO hinhanhsanpham (MaAnh, MaSP, DuongDan, MoTa, AnhChinh, ThuTu) VALUES
(N'HA001', N'SP001', N'images/products/SP001_1.jpg', NULL, 1, 1),
(N'HA002', N'SP002', N'images/products/SP002_1.jpg', NULL, 1, 1),
(N'HA003', N'SP003', N'images/products/SP003_1.jpg', NULL, 1, 1),
(N'HA004', N'SP004', N'images/products/SP004_1.jpg', NULL, 1, 1),
(N'HA005', N'SP005', N'images/products/SP005_1.jpg', NULL, 1, 1),
(N'HA006', N'SP006', N'images/products/SP006_1.jpg', NULL, 1, 1),
(N'HA007', N'SP007', N'images/products/SP007_1.jpg', NULL, 1, 1),
(N'HA008', N'SP008', N'images/products/SP008_1.jpg', NULL, 1, 1),
(N'HA009', N'SP009', N'images/products/SP009_1.jpg', NULL, 1, 1),
(N'HA010', N'SP010', N'images/products/SP010_1.jpg', NULL, 1, 1),
(N'HA011', N'SP011', N'images/products/SP011_1.jpg', NULL, 1, 1),
(N'HA012', N'SP012', N'images/products/SP012_1.jpg', NULL, 1, 1),
(N'HA013', N'SP013', N'images/products/SP013_1.jpg', NULL, 1, 1),
(N'HA014', N'SP014', N'images/products/SP014_1.jpg', NULL, 1, 1),
(N'HA015', N'SP015', N'images/products/SP015_1.jpg', NULL, 1, 1),
(N'HA016', N'SP016', N'images/products/SP016_1.jpg', NULL, 1, 1),
(N'HA017', N'SP017', N'images/products/SP017_1.jpg', NULL, 1, 1),
(N'HA018', N'SP018', N'images/products/SP018_1.jpg', NULL, 1, 1),
(N'HA019', N'SP019', N'images/products/SP019_1.jpg', NULL, 1, 1),
(N'HA020', N'SP020', N'images/products/SP020_1.jpg', NULL, 1, 1),
(N'HA021', N'SP021', N'images/products/SP021_1.jpg', NULL, 1, 1),
(N'HA022', N'SP022', N'images/products/SP022_1.jpg', NULL, 1, 1),
(N'HA023', N'SP023', N'images/products/SP023_1.jpg', NULL, 1, 1),
(N'HA024', N'SP024', N'images/products/SP024_1.jpg', NULL, 1, 1),
(N'HA025', N'SP025', N'images/products/SP025_1.jpg', NULL, 1, 1),
(N'HA026', N'SP026', N'images/products/SP026_1.jpg', NULL, 1, 1),
(N'HA027', N'SP027', N'images/products/SP027_1.jpg', NULL, 1, 1),
(N'HA028', N'SP028', N'images/products/SP028_1.jpg', NULL, 1, 1),
(N'HA029', N'SP029', N'images/products/SP029_1.jpg', NULL, 1, 1);

/* ---------- Ảnh phụ ---------- */
INSERT INTO hinhanhsanpham (MaAnh, MaSP, DuongDan, MoTa, AnhChinh, ThuTu) VALUES
(N'HA030', N'SP001', N'images/products/SP001_2.jpg', NULL, 0, 2),
(N'HA031', N'SP001', N'images/products/SP001_3.jpg', NULL, 0, 3),
(N'HA032', N'SP001', N'images/products/SP001_4.jpg', NULL, 0, 4),
(N'HA033', N'SP002', N'images/products/SP002_2.jpg', NULL, 0, 2),
(N'HA034', N'SP002', N'images/products/SP002_3.jpg', NULL, 0, 3),
(N'HA035', N'SP003', N'images/products/SP003_2.jpg', NULL, 0, 2),
(N'HA036', N'SP003', N'images/products/SP003_3.jpg', NULL, 0, 3),
(N'HA037', N'SP004', N'images/products/SP004_2.jpg', NULL, 0, 2),
(N'HA038', N'SP004', N'images/products/SP004_3.jpg', NULL, 0, 3),
(N'HA039', N'SP005', N'images/products/SP005_2.jpg', NULL, 0, 2),
(N'HA040', N'SP005', N'images/products/SP005_3.jpg', NULL, 0, 3),
(N'HA041', N'SP006', N'images/products/SP006_2.jpg', NULL, 0, 2),
(N'HA042', N'SP006', N'images/products/SP006_3.jpg', NULL, 0, 3),
(N'HA043', N'SP007', N'images/products/SP007_2.jpg', NULL, 0, 2),
(N'HA044', N'SP007', N'images/products/SP007_3.jpg', NULL, 0, 3),
(N'HA045', N'SP008', N'images/products/SP008_2.jpg', NULL, 0, 2),
(N'HA046', N'SP008', N'images/products/SP008_3.jpg', NULL, 0, 3),
(N'HA047', N'SP009', N'images/products/SP009_2.jpg', NULL, 0, 2),
(N'HA048', N'SP009', N'images/products/SP009_3.jpg', NULL, 0, 3),
(N'HA049', N'SP010', N'images/products/SP010_2.jpg', NULL, 0, 2),
(N'HA050', N'SP011', N'images/products/SP011_2.jpg', NULL, 0, 2),
(N'HA051', N'SP011', N'images/products/SP011_3.jpg', NULL, 0, 3),
(N'HA052', N'SP012', N'images/products/SP012_2.jpg', NULL, 0, 2),
(N'HA053', N'SP012', N'images/products/SP012_3.jpg', NULL, 0, 3),
(N'HA054', N'SP013', N'images/products/SP013_2.jpg', NULL, 0, 2),
(N'HA055', N'SP013', N'images/products/SP013_3.jpg', NULL, 0, 3),
(N'HA056', N'SP015', N'images/products/SP015_2.jpg', NULL, 0, 2),
(N'HA057', N'SP015', N'images/products/SP015_3.jpg', NULL, 0, 3),
(N'HA058', N'SP016', N'images/products/SP016_2.jpg', NULL, 0, 2),
(N'HA059', N'SP016', N'images/products/SP016_3.jpg', NULL, 0, 3),
(N'HA060', N'SP017', N'images/products/SP017_2.jpg', NULL, 0, 2),
(N'HA061', N'SP017', N'images/products/SP017_3.jpg', NULL, 0, 3),
(N'HA062', N'SP018', N'images/products/SP018_2.jpg', NULL, 0, 2),
(N'HA063', N'SP018', N'images/products/SP018_3.jpg', NULL, 0, 3),
(N'HA064', N'SP019', N'images/products/SP019_2.jpg', NULL, 0, 2),
(N'HA065', N'SP020', N'images/products/SP020_2.jpg', NULL, 0, 2),
(N'HA066', N'SP020', N'images/products/SP020_3.jpg', NULL, 0, 3),
(N'HA067', N'SP021', N'images/products/SP021_2.jpg', NULL, 0, 2),
(N'HA068', N'SP022', N'images/products/SP022_2.jpg', NULL, 0, 2),
(N'HA069', N'SP022', N'images/products/SP022_3.jpg', NULL, 0, 3),
(N'HA070', N'SP023', N'images/products/SP023_2.jpg', NULL, 0, 2),
(N'HA071', N'SP023', N'images/products/SP023_3.jpg', NULL, 0, 3),
(N'HA072', N'SP024', N'images/products/SP024_2.jpg', NULL, 0, 2),
(N'HA073', N'SP024', N'images/products/SP024_3.jpg', NULL, 0, 3),
(N'HA074', N'SP025', N'images/products/SP025_2.jpg', NULL, 0, 2),
(N'HA075', N'SP025', N'images/products/SP025_3.jpg', NULL, 0, 3),
(N'HA076', N'SP026', N'images/products/SP026_2.jpg', NULL, 0, 2),
(N'HA077', N'SP026', N'images/products/SP026_3.jpg', NULL, 0, 3),
(N'HA078', N'SP027', N'images/products/SP027_2.jpg', NULL, 0, 2),
(N'HA079', N'SP028', N'images/products/SP028_2.jpg', NULL, 0, 2),
(N'HA080', N'SP028', N'images/products/SP028_3.jpg', NULL, 0, 3),
(N'HA081', N'SP029', N'images/products/SP029_2.jpg', NULL, 0, 2),
(N'HA082', N'SP029', N'images/products/SP029_3.jpg', NULL, 0, 3);
