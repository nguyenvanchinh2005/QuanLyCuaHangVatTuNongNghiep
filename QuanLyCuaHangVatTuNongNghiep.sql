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
  `MaHD` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaSP` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenSP` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SlBan` int DEFAULT NULL,
  `GiaBan` decimal(18,2) DEFAULT NULL,
  `Giamgia` float DEFAULT NULL,
  `TongHD` decimal(18,2) DEFAULT NULL,
  `DviTinh` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaHD`,`MaSP`),
  KEY `FK_CTHOADON_SANPHAM` (`MaSP`),
  CONSTRAINT `FK_CTHOADON_HOADON` FOREIGN KEY (`MaHD`) REFERENCES `hoadon` (`MaHD`),
  CONSTRAINT `FK_CTHOADON_SANPHAM` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `cthoadon` */

insert  into `cthoadon`(`MaHD`,`MaSP`,`TenSP`,`SlBan`,`GiaBan`,`Giamgia`,`TongHD`,`DviTinh`) values 
('HD001','SP001','Đất hữu cơ đa dụng POTTING SOIL LAVAMIX ',2,42000.00,0,84000.00,'Bao'),
('HD002','SP002','Đá perlite trân châu Lavamix',1,45000.00,0,90000.00,'Bao'),
('HD003','SP003','Đất trồng cây đa dụng SFARM',3,72000.00,0,216000.00,'Bao');

/*Table structure for table `ctpnhap` */

DROP TABLE IF EXISTS `ctpnhap`;

CREATE TABLE `ctpnhap` (
  `MaPN` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaSP` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SlNhap` int DEFAULT NULL,
  `Gianhap` decimal(18,2) DEFAULT NULL,
  `TongGT` decimal(18,2) DEFAULT NULL,
  PRIMARY KEY (`MaPN`,`MaSP`),
  KEY `FK_CTPNHAP_SANPHAM` (`MaSP`),
  CONSTRAINT `FK_CTPNHAP_PNHAP` FOREIGN KEY (`MaPN`) REFERENCES `pnhap` (`MaPN`),
  CONSTRAINT `FK_CTPNHAP_SANPHAM` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `ctpnhap` */

insert  into `ctpnhap`(`MaPN`,`MaSP`,`SlNhap`,`Gianhap`,`TongGT`) values 
('PN001','SP001',100,42000.00,4200000.00),
('PN002','SP002',150,45000.00,6750000.00),
('PN003','SP003',80,72000.00,5760000.00);

/*Table structure for table `doanhthu` */

DROP TABLE IF EXISTS `doanhthu`;

CREATE TABLE `doanhthu` (
  `Thang` date NOT NULL,
  `MaSP` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Doanhthu` decimal(18,2) DEFAULT NULL,
  `Loinhuan` decimal(18,2) DEFAULT NULL,
  PRIMARY KEY (`Thang`,`MaSP`),
  KEY `FK_DOANHTHU_SANPHAM` (`MaSP`),
  CONSTRAINT `FK_DOANHTHU_SANPHAM` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `doanhthu` */

insert  into `doanhthu`(`Thang`,`MaSP`,`Doanhthu`,`Loinhuan`) values 
('2026-10-01','SP001',84000.00,25200.00),
('2026-10-01','SP002',45000.00,13500.00),
('2026-10-01','SP003',216000.00,64800.00);

/*Table structure for table `hoadon` */

DROP TABLE IF EXISTS `hoadon`;

CREATE TABLE `hoadon` (
  `MaHD` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Ngaylap` date DEFAULT NULL,
  `MaKH` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaNv` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaHD`),
  KEY `FK_HOADON_khachhang` (`MaKH`),
  KEY `FK_HOADON_NhanVien` (`MaNv`),
  CONSTRAINT `FK_HOADON_khachhang` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`MaKH`),
  CONSTRAINT `FK_HOADON_NhanVien` FOREIGN KEY (`MaNv`) REFERENCES `nhanvien` (`MaNv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `hoadon` */

insert  into `hoadon`(`MaHD`,`Ngaylap`,`MaKH`,`MaNv`) values 
('HD001','2026-10-01','KH001','NV001'),
('HD002','2026-10-02','KH002','NV002'),
('HD003','2026-10-03','KH003','NV001');

/*Table structure for table `khachhang` */

DROP TABLE IF EXISTS `khachhang`;

CREATE TABLE `khachhang` (
  `MaKH` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenKH` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DiaChi` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SDT` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaKH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `MaNCC` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenNCC` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Diachi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SDT` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaNCC`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `ncc` */

insert  into `ncc`(`MaNCC`,`TenNCC`,`Diachi`,`SDT`) values 
('NCC01','CÔNG TY TNHH TM VÀ DV ĐỨC THUẬN','Số 33 Đường Số 1, Phường Phước Bình, Thành phố Thủ Đức, TP. Hồ Chí Minh','0837282555'),
('NCC02','Công ty TNHH SX - TM - DV Đặng Gia Trang','Tầng 1 – Phú Đông Building, Số 77 Lê Trung Nghĩa, P. Bảy Hiền, TP.HCM','0862594914'),
('NCC03','Công ty TNHH Công Nghệ Sinh Học Sài Gòn Xanh','127 Nguyễn Trọng Tuyển, Phường Cầu Kiệu, Quận Phú Nhuận, TP. Hồ Chí Minh','0839971869'),
('NCC04','SHOP CAY TRONG CO, LTD.','72 Nguyễn Ngọc Phương, Phường 19, Quận Bình Thạnh, TP. HCM','0901455789'),
('NCC05','Công ty TNHH Phước Lộc Tiền Giang','Tòa Nhà Vinafood1, 94 Lương Yên, Phường Hai Bà Trưng, TP. Hà Nội','0912005564'),
('NCC06','Công ty Nông Dược Hoàng Kim','Số 124/5M Thới Tam Thôn 5, ấp Tam Đông 2, Xã Thới Tam Thôn, Huyện Hóc Môn, TP. Hồ Chí Minh, TP.HCM','0906718568'),
('NCC07','CÔNG TY CỔ PHẦN BÌNH ĐIỀN – MEKONG','Lô A10.1, Đường D3, KCN Thành Thành Công, Phường Trảng Bàng, Tỉnh Tây Ninh','0837564041'),
('NCC08','Hoàng Anh Agritech',' Thôn Phú Ninh, xã Hội Thịnh, tỉnh Phú Thọ','0934545777'),
('NCC09','Công Ty Cổ Phần Nghiệp Nông','Số 92, Đường 19E, Phường An Lạc, Thành phố Hồ Chí Minh','0838238955'),
('NCC10','CÔNG TY TNHH TM & DV XNK ANH KIỀU','10E Đường số 8, Khu phố 4, Phường Hiệp Bình Phước, Thành phố Thủ Đức, TP. Hồ Chí Minh','0933334998'),
('NCC11','Công ty TNHH MTV hạt giống Rạng Đông','240/6/1 Đ. Phạm Văn Chiêu, Thông Tây Hội, Hồ Chí Minh','0968279339'),
('NCC12','Công ty TNHH Phú Nông','Quốc lộ 91, Khu vực Qui Thạnh 1, P. Thuận Hưng, Tp. Cần Thơ','0923610699'),
('NCC13','CÔNG TY TNHH HẠT GIỐNG HOA VIỆT NAM',' 31/78 Phan Huy Ích, P.15, Q. Tân Bình, TP. HCM','0854272155'),
('NCC14',' CÔNG TY TNHH EAST- WEST SEED','số 1 VSIP II-A, đường số 14,Phường Vĩnh Tân, Thành phố Hồ Chí Minh, Việt Nam','0742220233'),
('NCC15','Công ty TNHH ADC','101 Phan Đình Phùng, Phường Ninh Kiều, TP. Cần Thơ','0923659999'),
('NCC16','Công ty TNHH MTV Sinh Hóa Nông Phú Lâm','2A/5 Đường số 10, Cư xá Đài Ra Đa Phú Lâm, Phường 13, Quận 6, TP.HCM','0838762958'),
('NCC17','Công ty TNHH UNIGREEN','Số 350 ĐT743A, KP. Đông An, P. Tân Đông Hiệp, TP. Dĩ An, Bình Dương','0838238989'),
('NCC18','Công ty Hóa Nông Lúa Vàng','Số 540, Ấp Thạnh Lợi, Xã Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang','0983970780'),
('NCC19','Công Ty Cổ Phần Nông Dược HAI','28 Mạc Đĩnh Chi, Phường Đa Kao, Quận 1, TP.HCM','1800577768'),
('NCC20','Công ty TNHH Hồng Tiến Phát','Số 46, Đường Ngô Quyền, Phường Máy Chai, Quận Ngô Quyền, Hải Phòng','0253570688'),
('NCC21','Công ty TNHH Kinh Doanh Thương Mại Minh Nam ','Số N-04-02, xóm 4, thôn Quỳnh Đô, Xã Vĩnh Quỳnh, Huyện Thanh Trì, Hà Nội','0983361188'),
('NCC22','Cửa hàng vật tư Nông Nghiệp Thiện Xanh ','Quốc lộ 1A, Xã Hòa Phú, Huyện Long Hồ, Tỉnh Vĩnh Long','0939123798'),
('NCC23','Công ty TNHH Nhựa Đức Đạt','Lô 40-42 Đường Số 3, KCN Tân Tạo, P. Tân Tạo, Q. Bình Tân, TP.HCM','0903874874'),
('NCC24','Công ty TNHH SX TM DV Trồng cây 24H','121 Nguyễn Thị Kiểu, Phường Tân Thới Hiệp, Quận 12, TP.HCM','0938902488'),
('NCC25','Công ty TNHH FMC Việt Nam','29A Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP.HCM','1900886647'),
('NCC26','Công ty TNHH Tô Đăng Khoa','292 Phạm Văn Đồng, Phường 1, Quận Gò Vấp, TP.HCM','0835885678'),
('NCC27','Công ty TNHH Ngân Anh ','378/4 Điện Biên Phủ, Phường 11, Quận 10, TP.HCM','0838327127'),
('NCC28','Công ty TNHH Corteva Agriscience','Lầu 14, Tòa nhà MPlaza Saigon, 39 Lê Duẩn, P. Bến Nghé, Quận 1, TP.HCM','1800588808'),
('NCC29','Công ty TNHH Bayer Việt Nam','Lô 118/4, KCN Amata, Phường Long Bình, TP. Biên Hòa, Đồng Nai','0838450828');

/*Table structure for table `nhanvien` */

DROP TABLE IF EXISTS `nhanvien`;

CREATE TABLE `nhanvien` (
  `MaNv` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `GioLam` int DEFAULT NULL,
  `SDT` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Luong` decimal(18,2) DEFAULT NULL,
  PRIMARY KEY (`MaNv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `nhanvien` */

insert  into `nhanvien`(`MaNv`,`HoTen`,`GioLam`,`SDT`,`Luong`) values 
('NV001','Nguyễn Quang Dũng',160,'0836464800',8500000.00),
('NV002','Ngô Xuân Bách',160,'0977856492',8000000.00),
('NV003','Nguyễn Văn Chính',160,'0977856492',8300000.00),
('NV004','Vũ Đình Quý',160,'0977856492',8000000.00);

/*Table structure for table `pnhap` */

DROP TABLE IF EXISTS `pnhap`;

CREATE TABLE `pnhap` (
  `MaPN` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaNCC` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Ngaynhap` date DEFAULT NULL,
  PRIMARY KEY (`MaPN`),
  KEY `FK_PNHAP_NCC` (`MaNCC`),
  CONSTRAINT `FK_PNHAP_NCC` FOREIGN KEY (`MaNCC`) REFERENCES `ncc` (`MaNCC`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `pnhap` */

insert  into `pnhap`(`MaPN`,`MaNCC`,`Ngaynhap`) values 
('PN001','NCC01','2026-09-25'),
('PN002','NCC02','2026-09-28'),
('PN003','NCC03','2026-09-30');

/*Table structure for table `sanpham` */

DROP TABLE IF EXISTS `sanpham`;

CREATE TABLE `sanpham` (
  `MaSP` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenSP` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Giaban` int DEFAULT NULL,
  `Soluong` int DEFAULT NULL,
  `TenNCC` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DviTinh` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HinhAnh` longblob,
  PRIMARY KEY (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `sanpham` */

insert  into `sanpham`(`MaSP`,`TenSP`,`Giaban`,`Soluong`,`TenNCC`,`DviTinh`,`HinhAnh`) values 
('SP001','Đất hữu cơ đa dụng POTTING SOIL LAVAMIX ',42000,148,'CÔNG TY TNHH TM VÀ DV ĐỨC THUẬN','Bao',NULL),
('SP002','Đá perlite trân châu Lavamix',45000,199,'CÔNG TY TNHH TM VÀ DV ĐỨC THUẬN','Bao',NULL),
('SP003','Đất trồng cây đa dụng SFARM',72000,97,'Công ty TNHH SX - TM - DV Đặng Gia Trang','Bao',NULL),
('SP004','Đất trồng cây Tribat giàu dinh dưỡng',38000,80,'Công ty TNHH Công Nghệ Sinh Học Sài Gòn Xanh','Bao',NULL),
('SP005','Soil Mix - Giá thể',164000,120,'SHOP CAY TRONG CO, LTD.','Túi',NULL),
('SP006','Viên nén xơ dừa ươm hạt',1200,20000,'Công ty TNHH Phước Lộc Tiền Giang','Viên',NULL),
('SP007','Nấm 3 màu BIO-HK. INS (Chai 1 Lít)',122000,198,'Công ty Nông Dược Hoàng Kim','Chai',NULL),
('SP008','Phân hữu cơ Đầu Trâu MK N.3 BIO-HUMIC',45000,200,'CÔNG TY CỔ PHẦN BÌNH ĐIỀN – MEKONG','Túi',NULL),
('SP009','Phân bón lá vi lượng',33000,200,'Hoàng Anh Agritech','Lọ',NULL),
('SP010','Phân bón Hỗn Hợp KALI Hữu Cơ',96000,200,'Công Ty Cổ Phần Nghiệp Nông','Chai',NULL),
('SP011','Phân Bón Hữu Cơ ANKI BALANCED',99000,200,'CÔNG TY TNHH TM & DV XNK ANH KIỀU','Chai',NULL),
('SP012','Hạt giống Cải Xoăn (Cải Kale) RADO 686',15000,520,'Công ty TNHH MTV hạt giống Rạng Đông','Gói',NULL),
('SP013','Hạt giống mồng tơi lá to PN 591',12000,780,'Công ty TNHH Phú Nông','Gói',NULL),
('SP014','Hạt giống Hoa Mai Địa Thảo Kép Rũ Nhiều Màu FVN',25000,460,'CÔNG TY TNHH HẠT GIỐNG HOA VIỆT NAM ','Gói',NULL),
('SP015','ATONIK 1.8SL tăng sinh trưởng, kích chồi và rễ',105000,180,'Công ty TNHH ADC','lọ',NULL),
('SP016','N3M kích rễ ',35000,160,'Công ty TNHH MTV Sinh Hóa Nông Phú Lâm','lọ',NULL),
('SP017','Phân bón lá VITAMIN B1 GROWMORE – Kích rễ',22000,280,'Công ty TNHH UNIGREEN','chai',NULL),
('SP018','Comcat Lúa Vàng 150WP',20000,185,'Công ty Hóa Nông Lúa Vàng','Gói',NULL),
('SP019','Chất điều hòa sinh trưởng DEKAMON 22.43SL',79000,380,'Công Ty Cổ Phần Nông Dược HAI','Chai',NULL),
('SP020','Chậu Aquaponics 70L',209000,360,'Công ty TNHH Hồng Tiến Phát','Cái',NULL),
('SP021','Viên đất nung sỏi nhẹ VINATAP 10-15mm',50000,860,'Công ty TNHH Kinh Doanh Thương Mại Minh Nam','Bao',NULL),
('SP022','Chậu Aquaponics 70L',185000,400,'Cửa hàng vật tư Nông Nghiệp Thiện Xanh ','Cái',NULL),
('SP023','Bình tưới cây DUDACO chuyên dụng - 2 Lít',72000,580,'Công ty TNHH Nhựa Đức Đạt','Cái',NULL),
('SP024','Keo liền sẹo liền da LS50',32000,1020,'Công ty TNHH SX TM DV Trồng cây 24H','Lọ',NULL),
('SP025','Thuốc trừ sâu FMC BENEVIA 100OD 50ml',145000,500,'Công ty TNHH FMC Việt Nam','lọ',NULL),
('SP026','Thuốc trị thối nhũn PONER - 40TB',11000,1600,'Công ty TNHH Tô Đăng Khoa','Gói',NULL),
('SP027','NeemNim Ấn Độ (100ml)',69000,390,'Công ty TNHH Ngân Anh ','Chai',NULL),
('SP028','Thuốc trừ sâu RADIANT 60SC (15ml)',44000,950,'Công ty TNHH Corteva Agriscience','Gói',NULL),
('SP029','Antracol 70WP',43000,879,'Công ty TNHH Bayer Việt Nam','Gói',NULL);

/*Table structure for table `taikhoan` */

DROP TABLE IF EXISTS `taikhoan`;

CREATE TABLE `taikhoan` (
  `MaTK` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenTK` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MatKhau` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `VaiTro` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaTK`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `taikhoan` */

insert  into `taikhoan`(`MaTK`,`TenTK`,`MatKhau`,`VaiTro`) values 
('TK001','admin','123456','admin'),
('TK002','nhanvien','123456','Nvien'),
('TK003','Khach1','123456','NguoiDung');

/*Table structure for table `tonkho` */

DROP TABLE IF EXISTS `tonkho`;

CREATE TABLE `tonkho` (
  `Namthang` date NOT NULL,
  `MaSP` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SlBandau` int DEFAULT NULL,
  `SlNhap` int DEFAULT NULL,
  `SlBan` int DEFAULT NULL,
  `SlConlai` int DEFAULT NULL,
  `DviTinh` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`Namthang`,`MaSP`),
  KEY `FK_TONKHO_SANPHAM` (`MaSP`),
  CONSTRAINT `FK_TONKHO_SANPHAM` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `tonkho` */

insert  into `tonkho`(`Namthang`,`MaSP`,`SlBandau`,`SlNhap`,`SlBan`,`SlConlai`,`DviTinh`) values 
('2026-10-01','SP001',50,100,2,148,'Bao'),
('2026-10-01','SP002',50,150,1,199,'Bao'),
('2026-10-01','SP003',20,80,3,97,'Bao');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
