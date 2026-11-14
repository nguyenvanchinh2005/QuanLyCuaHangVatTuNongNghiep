/*
SQLyog Community v13.3.1 (64 bit)
MySQL - 9.5.0 : Database - quanlycuahangvattunongnghiep
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`quanlycuahangvattunongnghiep` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `quanlycuahangvattunongnghiep`;

/*Table structure for table `cthoadon` */

DROP TABLE IF EXISTS `cthoadon`;

CREATE TABLE `cthoadon` (
  `MaHD` varchar(6) NOT NULL,
  `MaSP` varchar(6) NOT NULL,
  `SlBan` int NOT NULL,
  `GiaBan` decimal(18,2) NOT NULL,
  `Giamgia` decimal(5,2) NOT NULL DEFAULT '0.00',
  `ThanhTien` decimal(18,2) NOT NULL,
  PRIMARY KEY (`MaHD`,`MaSP`),
  KEY `IX_cthoadon_masp` (`MaSP`),
  CONSTRAINT `FK_cthoadon_hoadon` FOREIGN KEY (`MaHD`) REFERENCES `hoadon` (`MaHD`) ON DELETE CASCADE,
  CONSTRAINT `FK_cthoadon_sanpham` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`),
  CONSTRAINT `CK_cthoadon_giamgia` CHECK (((`Giamgia` >= 0) and (`Giamgia` <= 100))),
  CONSTRAINT `CK_cthoadon_slban` CHECK ((`SlBan` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `cthoadon` */

insert  into `cthoadon`(`MaHD`,`MaSP`,`SlBan`,`GiaBan`,`Giamgia`,`ThanhTien`) values 
('HD001','SP001',2,42000.00,0.00,84000.00),
('HD002','SP002',1,45000.00,0.00,45000.00),
('HD003','SP003',3,72000.00,0.00,216000.00);

/*Table structure for table `ctpnhap` */

DROP TABLE IF EXISTS `ctpnhap`;

CREATE TABLE `ctpnhap` (
  `MaPN` varchar(8) NOT NULL,
  `MaSP` varchar(6) NOT NULL,
  `SlNhap` int NOT NULL,
  `Gianhap` decimal(18,2) NOT NULL,
  `TongGT` decimal(18,2) NOT NULL,
  PRIMARY KEY (`MaPN`,`MaSP`),
  KEY `IX_ctpnhap_masp` (`MaSP`),
  CONSTRAINT `FK_ctpnhap_pnhap` FOREIGN KEY (`MaPN`) REFERENCES `pnhap` (`MaPN`) ON DELETE CASCADE,
  CONSTRAINT `FK_ctpnhap_sanpham` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`),
  CONSTRAINT `CK_ctpnhap_slnhap` CHECK ((`SlNhap` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `ctpnhap` */

insert  into `ctpnhap`(`MaPN`,`MaSP`,`SlNhap`,`Gianhap`,`TongGT`) values 
('PN001','SP001',100,42000.00,4200000.00),
('PN002','SP002',150,45000.00,6750000.00),
('PN003','SP003',80,72000.00,5760000.00);

/*Table structure for table `doanhthu` */

DROP TABLE IF EXISTS `doanhthu`;

CREATE TABLE `doanhthu` (
  `Thang` date NOT NULL,
  `MaSP` varchar(6) NOT NULL,
  `Doanhthu` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Loinhuan` decimal(18,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`Thang`,`MaSP`),
  KEY `IX_doanhthu_masp` (`MaSP`),
  CONSTRAINT `FK_doanhthu_sanpham` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `doanhthu` */

insert  into `doanhthu`(`Thang`,`MaSP`,`Doanhthu`,`Loinhuan`) values 
('2026-10-01','SP001',84000.00,25200.00),
('2026-10-01','SP002',45000.00,13500.00),
('2026-10-01','SP003',216000.00,64800.00);

/*Table structure for table `hinhanhsanpham` */

DROP TABLE IF EXISTS `hinhanhsanpham`;

CREATE TABLE `hinhanhsanpham` (
  `MaAnh` varchar(10) NOT NULL,
  `MaSP` varchar(6) NOT NULL,
  `DuongDan` varchar(500) NOT NULL,
  `MoTa` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MaAnh`),
  KEY `IX_hinhanh_masp` (`MaSP`),
  CONSTRAINT `FK_hinhanh_sanpham` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `hinhanhsanpham` */

insert  into `hinhanhsanpham`(`MaAnh`,`MaSP`,`DuongDan`,`MoTa`) values 
('HA001','SP001','images/products/SP001_1.jpg','Ảnh sản phẩm SP001'),
('HA002','SP002','images/products/SP002_1.jpg','Ảnh sản phẩm SP002'),
('HA003','SP003','images/products/SP003_1.jpg','Ảnh sản phẩm SP003'),
('HA004','SP004','images/products/SP004_1.jpg','Ảnh sản phẩm SP004'),
('HA005','SP005','images/products/SP005_1.jpg','Ảnh sản phẩm SP005'),
('HA006','SP006','images/products/SP006_1.jpg','Ảnh sản phẩm SP006'),
('HA007','SP007','images/products/SP007_1.jpg','Ảnh sản phẩm SP007'),
('HA008','SP008','images/products/SP008_1.jpg','Ảnh sản phẩm SP008'),
('HA009','SP009','images/products/SP009_1.jpg','Ảnh sản phẩm SP009'),
('HA010','SP010','images/products/SP010_1.jpg','Ảnh sản phẩm SP010'),
('HA011','SP011','images/products/SP011_1.jpg','Ảnh sản phẩm SP011'),
('HA012','SP012','images/products/SP012_1.jpg','Ảnh sản phẩm SP012'),
('HA013','SP013','images/products/SP013_1.jpg','Ảnh sản phẩm SP013'),
('HA014','SP014','images/products/SP014_1.jpg','Ảnh sản phẩm SP014'),
('HA015','SP015','images/products/SP015_1.jpg','Ảnh sản phẩm SP015'),
('HA016','SP016','images/products/SP016_1.jpg','Ảnh sản phẩm SP016'),
('HA017','SP017','images/products/SP017_1.jpg','Ảnh sản phẩm SP017'),
('HA018','SP018','images/products/SP018_1.jpg','Ảnh sản phẩm SP018'),
('HA019','SP019','images/products/SP019_1.jpg','Ảnh sản phẩm SP019'),
('HA020','SP020','images/products/SP020_1.jpg','Ảnh sản phẩm SP020'),
('HA021','SP021','images/products/SP021_1.jpg','Ảnh sản phẩm SP021'),
('HA022','SP022','images/products/SP022_1.jpg','Ảnh sản phẩm SP022'),
('HA023','SP023','images/products/SP023_1.jpg','Ảnh sản phẩm SP023'),
('HA024','SP024','images/products/SP024_1.jpg','Ảnh sản phẩm SP024'),
('HA025','SP025','images/products/SP025_1.jpg','Ảnh sản phẩm SP025'),
('HA026','SP026','images/products/SP026_1.jpg','Ảnh sản phẩm SP026'),
('HA027','SP027','images/products/SP027_1.jpg','Ảnh sản phẩm SP027'),
('HA028','SP028','images/products/SP028_1.jpg','Ảnh sản phẩm SP028'),
('HA029','SP029','images/products/SP029_1.jpg','Ảnh sản phẩm SP029');

/*Table structure for table `hoadon` */

DROP TABLE IF EXISTS `hoadon`;

CREATE TABLE `hoadon` (
  `MaHD` varchar(6) NOT NULL,
  `Ngaylap` date NOT NULL,
  `MaKH` varchar(6) DEFAULT NULL,
  `MaNv` varchar(6) DEFAULT NULL,
  PRIMARY KEY (`MaHD`),
  KEY `IX_hoadon_makh` (`MaKH`),
  KEY `IX_hoadon_manv` (`MaNv`),
  CONSTRAINT `FK_hoadon_khachhang` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`MaKH`),
  CONSTRAINT `FK_hoadon_nhanvien` FOREIGN KEY (`MaNv`) REFERENCES `nhanvien` (`MaNv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `hoadon` */

insert  into `hoadon`(`MaHD`,`Ngaylap`,`MaKH`,`MaNv`) values 
('HD001','2026-10-01','KH001','NV001'),
('HD002','2026-10-02','KH002','NV002'),
('HD003','2026-10-03','KH003','NV001');

/*Table structure for table `khachhang` */

DROP TABLE IF EXISTS `khachhang`;

CREATE TABLE `khachhang` (
  `MaKH` varchar(6) NOT NULL,
  `TenKH` varchar(100) NOT NULL,
  `DiaChi` varchar(255) DEFAULT NULL,
  `SDT` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`MaKH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `khachhang` */

insert  into `khachhang`(`MaKH`,`TenKH`,`DiaChi`,`SDT`) values 
('KH001','Nguyễn Văn An','Quận Thanh Xuân, Hà Nội','0912345678'),
('KH002','Trần Thị Mai','Quận Tân Bình, TP.HCM','0987654321'),
('KH003','Lê Hoàng Long','Quận Hải Châu, Đà Nẵng','0909112233'),
('KH004','Nguyễn Trung Hiếu','Phường Xuân Hòa, Phú Thọ','0836464855'),
('KH005','Dương Giang Huy','Đại Mỗ, Hà Đông, Hà Nội','0956486237'),
('KH006','Đào Nguyên Vũ','Tây Hồ, Hà Nội','0836512985'),
('KH007','Lê Thanh Hoàng','Lĩnh Nam, Hà Nội','0958743612'),
('KH008','Dương Quốc Ánh','Quận 1, TP.HCM','0865975823'),
('KH009','Nguyễn Đức Anh','Thanh Khê, Đà Nẵng','0812546920'),
('KH010','Đinh Văn Thành','Lâm Hà, Lâm Đồng','0936598216');

/*Table structure for table `ncc` */

DROP TABLE IF EXISTS `ncc`;

CREATE TABLE `ncc` (
  `MaNCC` varchar(6) NOT NULL,
  `TenNCC` varchar(255) NOT NULL,
  `Diachi` varchar(255) DEFAULT NULL,
  `SDT` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`MaNCC`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `ncc` */

insert  into `ncc`(`MaNCC`,`TenNCC`,`Diachi`,`SDT`) values 
('NCC01','CÔNG TY TNHH TM VÀ DV ĐỨC THUẬN','Số 33 Đường Số 1, Phường Phước Bình, Thành phố Thủ Đức, TP. Hồ Chí Minh','0837282555'),
('NCC02','Công ty TNHH SX - TM - DV Đặng Gia Trang','Tầng 1 – Phú Đông Building, Số 77 Lê Trung Nghĩa, P. Bảy Hiền, TP.HCM','0862594914'),
('NCC03','Công ty TNHH Công Nghệ Sinh Học Sài Gòn Xanh','127 Nguyễn Trọng Tuyển, Phường Cầu Kiệu, Quận Phú Nhuận, TP. Hồ Chí Minh','0839971869'),
('NCC04','SHOP CAY TRONG CO, LTD.','72 Nguyễn Ngọc Phương, Phường 19, Quận Bình Thạnh, TP. HCM','0901455789'),
('NCC05','Công ty TNHH Phước Lộc Tiền Giang','Tòa Nhà Vinafood1, 94 Lương Yên, Phường Hai Bà Trưng, TP. Hà Nội','0912005564'),
('NCC06','Công ty Nông Dược Hoàng Kim','Số 124/5M Thới Tam Thôn 5, ấp Tam Đông 2, Xã Thới Tam Thôn, Huyện Hóc Môn, TP. Hồ Chí Minh','0906718568'),
('NCC07','CÔNG TY CỔ PHẦN BÌNH ĐIỀN – MEKONG','Lô A10.1, Đường D3, KCN Thành Thành Công, Phường Trảng Bàng, Tỉnh Tây Ninh','0837564041'),
('NCC08','Hoàng Anh Agritech','Thôn Phú Ninh, xã Hội Thịnh, tỉnh Phú Thọ','0934545777'),
('NCC09','Công Ty Cổ Phần Nghiệp Nông','Số 92, Đường 19E, Phường An Lạc, Thành phố Hồ Chí Minh','0838238955'),
('NCC10','CÔNG TY TNHH TM & DV XNK ANH KIỀU','10E Đường số 8, Khu phố 4, Phường Hiệp Bình Phước, Thành phố Thủ Đức, TP. Hồ Chí Minh','0933334998'),
('NCC11','Công ty TNHH MTV hạt giống Rạng Đông','240/6/1 Đ. Phạm Văn Chiêu, Thông Tây Hội, Hồ Chí Minh','0968279339'),
('NCC12','Công ty TNHH Phú Nông','Quốc lộ 91, Khu vực Qui Thạnh 1, P. Thuận Hưng, Tp. Cần Thơ','0923610699'),
('NCC13','CÔNG TY TNHH HẠT GIỐNG HOA VIỆT NAM','31/78 Phan Huy Ích, P.15, Q. Tân Bình, TP. HCM','0854272155'),
('NCC14','CÔNG TY TNHH EAST- WEST SEED','Số 1 VSIP II-A, đường số 14, Phường Vĩnh Tân, Thành phố Hồ Chí Minh','0742220233'),
('NCC15','Công ty TNHH ADC','101 Phan Đình Phùng, Phường Ninh Kiều, TP. Cần Thơ','0923659999'),
('NCC16','Công ty TNHH MTV Sinh Hóa Nông Phú Lâm','2A/5 Đường số 10, Cư xá Đài Ra Đa Phú Lâm, Phường 13, Quận 6, TP.HCM','0838762958'),
('NCC17','Công ty TNHH UNIGREEN','Số 350 ĐT743A, KP. Đông An, P. Tân Đông Hiệp, TP. Dĩ An, Bình Dương','0838238989'),
('NCC18','Công ty Hóa Nông Lúa Vàng','Số 540, Ấp Thạnh Lợi, Xã Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang','0983970780'),
('NCC19','Công Ty Cổ Phần Nông Dược HAI','28 Mạc Đĩnh Chi, Phường Đa Kao, Quận 1, TP.HCM','1800577768'),
('NCC20','Công ty TNHH Hồng Tiến Phát','Số 46, Đường Ngô Quyền, Phường Máy Chai, Quận Ngô Quyền, Hải Phòng','0253570688'),
('NCC21','Công ty TNHH Kinh Doanh Thương Mại Minh Nam','Số N-04-02, xóm 4, thôn Quỳnh Đô, Xã Vĩnh Quỳnh, Huyện Thanh Trì, Hà Nội','0983361188'),
('NCC22','Cửa hàng vật tư Nông Nghiệp Thiện Xanh','Quốc lộ 1A, Xã Hòa Phú, Huyện Long Hồ, Tỉnh Vĩnh Long','0939123798'),
('NCC23','Công ty TNHH Nhựa Đức Đạt','Lô 40-42 Đường Số 3, KCN Tân Tạo, P. Tân Tạo, Q. Bình Tân, TP.HCM','0903874874'),
('NCC24','Công ty TNHH SX TM DV Trồng cây 24H','121 Nguyễn Thị Kiểu, Phường Tân Thới Hiệp, Quận 12, TP.HCM','0938902488'),
('NCC25','Công ty TNHH FMC Việt Nam','29A Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP.HCM','1900886647'),
('NCC26','Công ty TNHH Tô Đăng Khoa','292 Phạm Văn Đồng, Phường 1, Quận Gò Vấp, TP.HCM','0835885678'),
('NCC27','Công ty TNHH Ngân Anh','378/4 Điện Biên Phủ, Phường 11, Quận 10, TP.HCM','0838327127'),
('NCC28','Công ty TNHH Corteva Agriscience','Lầu 14, Tòa nhà MPlaza Saigon, 39 Lê Duẩn, P. Bến Nghé, Quận 1, TP.HCM','1800588808'),
('NCC29','Công ty TNHH Bayer Việt Nam','Lô 118/4, KCN Amata, Phường Long Bình, TP. Biên Hòa, Đồng Nai','0838450828');

/*Table structure for table `nhanvien` */

DROP TABLE IF EXISTS `nhanvien`;

CREATE TABLE `nhanvien` (
  `MaNv` varchar(6) NOT NULL,
  `HoTen` varchar(100) NOT NULL,
  `GioLam` int DEFAULT NULL,
  `SDT` varchar(15) DEFAULT NULL,
  `Luong` decimal(18,2) DEFAULT NULL,
  PRIMARY KEY (`MaNv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `nhanvien` */

insert  into `nhanvien`(`MaNv`,`HoTen`,`GioLam`,`SDT`,`Luong`) values 
('NV001','Nguyễn Quang Dũng',160,'0836464800',8500000.00),
('NV002','Ngô Xuân Bách',160,'0977856492',8000000.00),
('NV003','Nguyễn Văn Chính',160,'0977856492',8300000.00),
('NV004','Vũ Đình Quý',160,'0977856492',8000000.00);

/*Table structure for table `pnhap` */

DROP TABLE IF EXISTS `pnhap`;

CREATE TABLE `pnhap` (
  `MaPN` varchar(8) NOT NULL,
  `MaNCC` varchar(6) DEFAULT NULL,
  `Ngaynhap` date NOT NULL,
  PRIMARY KEY (`MaPN`),
  KEY `IX_pnhap_mancc` (`MaNCC`),
  CONSTRAINT `FK_pnhap_ncc` FOREIGN KEY (`MaNCC`) REFERENCES `ncc` (`MaNCC`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `pnhap` */

insert  into `pnhap`(`MaPN`,`MaNCC`,`Ngaynhap`) values 
('PN001','NCC01','2026-09-25'),
('PN002','NCC02','2026-09-28'),
('PN003','NCC03','2026-09-30');

/*Table structure for table `sanpham` */

DROP TABLE IF EXISTS `sanpham`;

CREATE TABLE `sanpham` (
  `MaSP` varchar(6) NOT NULL,
  `TenSP` varchar(255) NOT NULL,
  `MaNCC` varchar(6) DEFAULT NULL,
  `DviTinh` varchar(50) DEFAULT NULL,
  `Giaban` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Soluong` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`MaSP`),
  KEY `IX_sanpham_mancc` (`MaNCC`),
  CONSTRAINT `FK_sanpham_ncc` FOREIGN KEY (`MaNCC`) REFERENCES `ncc` (`MaNCC`),
  CONSTRAINT `CK_sanpham_giaban` CHECK ((`Giaban` >= 0)),
  CONSTRAINT `CK_sanpham_soluong` CHECK ((`Soluong` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `sanpham` */

insert  into `sanpham`(`MaSP`,`TenSP`,`MaNCC`,`DviTinh`,`Giaban`,`Soluong`) values 
('SP001','Đất hữu cơ đa dụng POTTING SOIL LAVAMIX','NCC01','Bao',42000.00,148),
('SP002','Đá perlite trân châu Lavamix','NCC01','Bao',45000.00,199),
('SP003','Đất trồng cây đa dụng SFARM','NCC02','Bao',72000.00,97),
('SP004','Đất trồng cây Tribat giàu dinh dưỡng','NCC03','Bao',38000.00,80),
('SP005','Soil Mix - Giá thể','NCC04','Túi',164000.00,120),
('SP006','Viên nén xơ dừa ươm hạt','NCC05','Viên',1200.00,20000),
('SP007','Nấm 3 màu BIO-HK. INS (Chai 1 Lít)','NCC06','Chai',122000.00,198),
('SP008','Phân hữu cơ Đầu Trâu MK N.3 BIO-HUMIC','NCC07','Túi',45000.00,200),
('SP009','Phân bón lá vi lượng','NCC08','Lọ',33000.00,200),
('SP010','Phân bón Hỗn Hợp KALI Hữu Cơ','NCC09','Chai',96000.00,200),
('SP011','Phân Bón Hữu Cơ ANKI BALANCED','NCC10','Chai',99000.00,200),
('SP012','Hạt giống Cải Xoăn (Cải Kale) RADO 686','NCC11','Gói',15000.00,520),
('SP013','Hạt giống mồng tơi lá to PN 591','NCC12','Gói',12000.00,780),
('SP014','Hạt giống Hoa Mai Địa Thảo Kép Rũ Nhiều Màu FVN','NCC13','Gói',25000.00,460),
('SP015','ATONIK 1.8SL tăng sinh trưởng, kích chồi và rễ','NCC15','Lọ',105000.00,180),
('SP016','N3M kích rễ','NCC16','Lọ',35000.00,160),
('SP017','Phân bón lá VITAMIN B1 GROWMORE – Kích rễ','NCC17','Chai',22000.00,280),
('SP018','Comcat Lúa Vàng 150WP','NCC18','Gói',20000.00,185),
('SP019','Chất điều hòa sinh trưởng DEKAMON 22.43SL','NCC19','Chai',79000.00,380),
('SP020','Chậu Aquaponics 70L','NCC20','Cái',209000.00,360),
('SP021','Viên đất nung sỏi nhẹ VINATAP 10-15mm','NCC21','Bao',50000.00,860),
('SP022','Chậu Aquaponics 70L','NCC22','Cái',185000.00,400),
('SP023','Bình tưới cây DUDACO chuyên dụng - 2 Lít','NCC23','Cái',72000.00,580),
('SP024','Keo liền sẹo liền da LS50','NCC24','Lọ',32000.00,1020),
('SP025','Thuốc trừ sâu FMC BENEVIA 100OD 50ml','NCC25','Lọ',145000.00,500),
('SP026','Thuốc trị thối nhũn PONER - 40TB','NCC26','Gói',11000.00,1600),
('SP027','NeemNim Ấn Độ (100ml)','NCC27','Chai',69000.00,390),
('SP028','Thuốc trừ sâu RADIANT 60SC (15ml)','NCC28','Gói',44000.00,950),
('SP029','Antracol 70WP','NCC29','Gói',43000.00,879);

/*Table structure for table `taikhoan` */

DROP TABLE IF EXISTS `taikhoan`;

CREATE TABLE `taikhoan` (
  `MaTK` varchar(10) NOT NULL,
  `TenTK` varchar(50) NOT NULL,
  `MatKhau` varchar(255) NOT NULL,
  `VaiTro` varchar(20) NOT NULL,
  `MaKH` varchar(10) DEFAULT NULL,
  `MaNv` varchar(6) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `EmailDaXacMinh` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`MaTK`),
  UNIQUE KEY `UQ_taikhoan_tentk` (`TenTK`),
  KEY `FK_taikhoan_khachhang` (`MaKH`),
  KEY `FK_taikhoan_nhanvien` (`MaNv`),
  CONSTRAINT `FK_taikhoan_khachhang` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`MaKH`),
  CONSTRAINT `FK_taikhoan_nhanvien` FOREIGN KEY (`MaNv`) REFERENCES `nhanvien` (`MaNv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `taikhoan` */

insert  into `taikhoan`(`MaTK`,`TenTK`,`MatKhau`,`VaiTro`,`MaKH`,`MaNv`,`Email`,`EmailDaXacMinh`) values 
('TK001','admin','123456','admin',NULL,NULL,NULL,0),
('TK002','nhanvien','123456','Nvien',NULL,'NV001',NULL,0),
('TK003','Khach1','123456','NguoiDung','KH001',NULL,NULL,0);

/*Table structure for table `tonkho` */

DROP TABLE IF EXISTS `tonkho`;

CREATE TABLE `tonkho` (
  `Namthang` date NOT NULL,
  `MaSP` varchar(6) NOT NULL,
  `SlBandau` int NOT NULL DEFAULT '0',
  `SlNhap` int NOT NULL DEFAULT '0',
  `SlBan` int NOT NULL DEFAULT '0',
  `SlConlai` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`Namthang`,`MaSP`),
  KEY `IX_tonkho_masp` (`MaSP`),
  CONSTRAINT `FK_tonkho_sanpham` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `tonkho` */

insert  into `tonkho`(`Namthang`,`MaSP`,`SlBandau`,`SlNhap`,`SlBan`,`SlConlai`) values 
('2026-10-01','SP001',50,100,2,148),
('2026-10-01','SP002',50,150,1,199),
('2026-10-01','SP003',20,80,3,97);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
