const KHOA_YEU_THICH = "vuon_pho_yeu_thich_v1";
const KHOA_TAI_KHOAN_GAN_NHAT = "vuon_pho_tai_khoan_gan_nhat_v1";
const TIEN_TO_KHOA_GIO_HANG = "vuon_pho_gio_hang_v1_";
let duLieuLuu = null;

// ============================================================================
// LUỒNG QUẢN LÝ LƯU TRỮ GIỎ HÀNG THEO TÀI KHOẢN (KHÔNG DÙNG SQL)
// ============================================================================

// 1. Xác định mã định danh tài khoản đang đăng nhập hoặc tài khoản gần nhất
function layDinhDanhTaiKhoanHienTai() {
  if (duLieuLuu && duLieuLuu.taiKhoan) {
    return duLieuLuu.taiKhoan.id || duLieuLuu.taiKhoan.tenTaiKhoan || "";
  }
  try {
    return localStorage.getItem(KHOA_TAI_KHOAN_GAN_NHAT) || "";
  } catch {
    return "";
  }
}

// 2. Tạo khóa định danh riêng cho từng tài khoản trong localStorage
function layKhoaGioHangHienTai() {
  const dinhDanh = layDinhDanhTaiKhoanHienTai();
  return dinhDanh ? `${TIEN_TO_KHOA_GIO_HANG}${dinhDanh}` : `${TIEN_TO_KHOA_GIO_HANG}khach`;
}

// 3. Đọc dữ liệu giỏ hàng từ localStorage theo khóa tài khoản
function docGioHangTuStorage(khoa = layKhoaGioHangHienTai()) {
  try {
    const raw = localStorage.getItem(khoa);
    if (!raw) return [];
    const duLieu = JSON.parse(raw);
    return Array.isArray(duLieu)
      ? duLieu.filter(
          (mon) =>
            mon &&
            typeof mon.MaSP === "string" &&
            Number(mon.soLuong) > 0,
        )
      : [];
  } catch {
    return [];
  }
}

// 4. Lưu dữ liệu giỏ hàng hiện tại vào localStorage theo tài khoản
function luuGioHangVaoStorage() {
  try {
    const khoa = layKhoaGioHangHienTai();
    localStorage.setItem(khoa, JSON.stringify(duLieuLuu.gioHang || []));
  } catch {
    // Bỏ qua nếu localStorage bị đầy hoặc bị trình duyệt chặn
  }
}

// 5. Đồng bộ giỏ hàng khi người dùng đăng nhập (gộp giỏ hàng khách vào tài khoản)
function dongBoGioHangKhiDangNhap(taiKhoanMoi) {
  const khoaKhach = `${TIEN_TO_KHOA_GIO_HANG}khach`;
  const gioHangKhach = docGioHangTuStorage(khoaKhach);

  const dinhDanhMoi = taiKhoanMoi?.id || taiKhoanMoi?.tenTaiKhoan || "";
  const khoaTaiKhoan = dinhDanhMoi
    ? `${TIEN_TO_KHOA_GIO_HANG}${dinhDanhMoi}`
    : khoaKhach;
  const gioHangTaiKhoan = docGioHangTuStorage(khoaTaiKhoan);

  // Nếu khách có chọn hàng trước khi đăng nhập, gộp hàng đó vào tài khoản
  if (gioHangKhach.length > 0 && khoaTaiKhoan !== khoaKhach) {
    gioHangKhach.forEach((monKhach) => {
      const monDaCo = gioHangTaiKhoan.find((m) => m.MaSP === monKhach.MaSP);
      if (monDaCo) {
        monDaCo.soLuong += monKhach.soLuong;
      } else {
        gioHangTaiKhoan.push(monKhach);
      }
    });
    // Xóa giỏ hàng khách tạm thời sau khi đã gộp
    try {
      localStorage.removeItem(khoaKhach);
    } catch {}
  }

  duLieuLuu.gioHang = gioHangTaiKhoan;
  luuGioHangVaoStorage();
  capNhatHienThiGioHang();
}

// 6. Đồng bộ giỏ hàng khi người dùng đăng xuất (chuyển về giỏ hàng khách)
function dongBoGioHangKhiDangXuat() {
  const khoaKhach = `${TIEN_TO_KHOA_GIO_HANG}khach`;
  duLieuLuu.gioHang = docGioHangTuStorage(khoaKhach);
  capNhatHienThiGioHang();
}

function docDanhSachYeuThich() {
  try {
    const duLieu = JSON.parse(localStorage.getItem(KHOA_YEU_THICH) || "[]");
    return Array.isArray(duLieu) ? duLieu : [];
  } catch {
    return [];
  }
}

const duLieuMacDinh = {
  sanPham: [],
  benhCay: [],
  nguoiDung: [],
  gioHang: docGioHangTuStorage(),
  donHang: [],
  taiKhoan: null,
  yeuThich: docDanhSachYeuThich(),
};
duLieuLuu = structuredClone(duLieuMacDinh);
const duLieuQuanTri = { donHang: [], taiKhoan: [] };
let dangTaiSanPham = true;
let loiTaiSanPham = false;
let dangTaiDuLieuQuanTri = false;
let daTaiDuLieuQuanTri = false;
let loiTaiDuLieuQuanTri = false;
let dangTaiDonHang = false;
let daTaiDonHang = false;
let loiTaiDonHang = false;
let dangTaoDonHang = false;
let cacPhuongThucThanhToan = [
  { ma: "cod", ten: "Thanh toán khi nhận hàng" },
];
const trangVao = document.body.dataset.trangVao || "cua-hang";
const vaiTroYeuCau = document.body.dataset.vaiTroYeuCau || "";
let trangHienTai = trangVao;
let tabQuanTri = "tong-quan";
let tokenCsrf = "";
let cheDoTaiKhoan = "dang-nhap";
let maSanPhamDangSua = null;
let tuKhoaKho = "";
let locDanhMucKho = "";
let locTonKho = "";
let sapXepKho = "mac-dinh";
let tuKhoaHoaDon = "";
let locTrangThaiHoaDon = "";
let tuKhoaTaiKhoan = "";
let locVaiTroTaiKhoan = "";
let boLocHienTai = {
  tuKhoa: "",
  danhMuc: "",
  nhomDanhMuc: "",
  nhaCungCap: "",
  khoangGia: "",
  giaTu: "",
  giaDen: "",
  chiConHang: false,
  chiYeuThich: false,
};
let thuTuSapXep = "mac-dinh";
const soSanPhamMoiTrang = 8;
let trangSanPham = 1;
let danhMucDangMo = "Mẫu Chậu Mới 2026";
let menuDanhMucDangMo = false;
let urlAnhCayXemTruoc = null;
let boDemGuiOtp = null;
const danhSachDanhMuc = [
  {
    ten: "Mẫu Chậu Mới 2026",
    nhom: [
      "Chậu nhựa mềm",
      "Khay & kệ trồng rau",
      "Chậu trồng",
      "Chậu trồng lan",
      "Chậu trồng hoa hồng",
      "Chậu treo & ốp tường",
      "Bầu ươm",
      "Chậu loại khác",
      "Chậu vuông",
      "Chậu tròn",
      "Chậu chữ nhật",
      "Chậu cây cảnh",
    ],
  },
  {
    ten: "Đất Sạch & Giá Thể",
    nhom: [
      "Đất sạch trồng rau",
      "Đất trồng cây",
      "Giá thể trồng cây",
      "Xơ dừa & mụn dừa",
      "Đá perlite & vermiculite",
    ],
  },
  {
    ten: "Phân Bón",
    nhom: [
      "Phân hữu cơ",
      "Phân NPK",
      "Phân bón lá",
      "Phân vi sinh",
      "Phân tan chậm",
    ],
  },
  {
    ten: "Hạt Giống",
    nhom: [
      "Hạt giống rau",
      "Hạt giống hoa",
      "Hạt giống củ quả",
      "Hạt giống gia vị",
    ],
  },
  {
    ten: "Kích Thích Sinh Trưởng",
    nhom: ["Kích rễ", "Kích chồi", "Dưỡng lá", "Dưỡng hoa & trái"],
  },
  {
    ten: "Vật Tư Aquaponics",
    nhom: [
      "Máy bơm & sục khí",
      "Ống và phụ kiện",
      "Vật liệu lọc",
      "Dung dịch thủy canh",
    ],
  },
  {
    ten: "Vật Tư Kiểng Lá",
    nhom: [
      "Đất trộn kiểng lá",
      "Chậu kiểng lá",
      "Phân bón kiểng lá",
      "Dụng cụ chăm sóc",
    ],
  },
  {
    ten: "Vật Tư Trồng Lan",
    nhom: [
      "Chậu trồng lan",
      "Giá thể trồng lan",
      "Phân bón cho lan",
      "Móc treo & phụ kiện",
    ],
  },
  {
    ten: "Vật Tư Trồng Rau",
    nhom: [
      "Khay trồng rau",
      "Đất trồng rau",
      "Phân bón rau",
      "Dụng cụ làm vườn",
    ],
  },
  {
    ten: "Vật Tư Trồng Hoa Kiểng",
    nhom: [
      "Chậu trồng hoa",
      "Đất & giá thể",
      "Phân bón hoa",
      "Dụng cụ cắt tỉa",
    ],
  },
  {
    ten: "Vật Tư Trồng Hoa Hồng",
    nhom: [
      "Đất trồng hoa hồng",
      "Phân bón hoa hồng",
      "Thuốc dưỡng hoa hồng",
      "Kéo cắt tỉa",
    ],
  },
  {
    ten: "Vật Tư Trồng Bonsai",
    nhom: [
      "Đất trồng bonsai",
      "Chậu bonsai",
      "Phân bón bonsai",
      "Dụng cụ bonsai",
    ],
  },
  {
    ten: "Vật Tư Ươm Giống",
    nhom: ["Khay ươm", "Bầu ươm", "Giá thể ươm", "Dụng cụ gieo hạt"],
  },
  {
    ten: "Vật Tư Thủy Canh",
    nhom: [
      "Dung dịch thủy canh",
      "Rọ thủy canh",
      "Máy bơm & sục khí",
      "Bút đo pH và EC",
    ],
  },
  {
    ten: "Thuốc Bảo Vệ Thực Vật",
    nhom: ["Trừ sâu", "Trừ bệnh", "Trừ nấm", "Chế phẩm sinh học"],
  },
  {
    ten: "Dụng Cụ Làm Vườn",
    nhom: ["Bình tưới", "Dụng cụ chăm sóc", "Kéo cắt tỉa"],
  },
  { ten: "Vật Tư Khác", nhom: ["Vật tư khác"] },
];
let henThongBao;
const oNoiDung = document.getElementById("noi-dung");
const oTimKiem = document.getElementById("oTimKiem");
const oHopTaiKhoan = document.getElementById("hopTaiKhoan");
const oHopBaiViet = document.getElementById("hopBaiViet");
const oHopChiTietSanPham = document.getElementById("hopChiTietSanPham");
const oHopSanPham = document.getElementById("hopSanPham");

function luuDuLieu() {
  capNhatSoGio();
  luuGioHangVaoStorage();
  try {
    localStorage.setItem(KHOA_YEU_THICH, JSON.stringify(duLieuLuu.yeuThich));
  } catch {
    // Bỏ qua nếu trình duyệt chặn localStorage
  }
}

function dongBoBoLocLenUrl() {
  if (vaiTroYeuCau) return;
  const params = new URLSearchParams();
  if (boLocHienTai.tuKhoa) params.set("tu-khoa", boLocHienTai.tuKhoa);
  if (boLocHienTai.danhMuc) params.set("danh-muc", boLocHienTai.danhMuc);
  if (boLocHienTai.nhomDanhMuc) params.set("nhom", boLocHienTai.nhomDanhMuc);
  if (boLocHienTai.nhaCungCap) params.set("ncc", boLocHienTai.nhaCungCap);
  if (boLocHienTai.khoangGia) params.set("muc-gia", boLocHienTai.khoangGia);
  if (boLocHienTai.giaTu) params.set("gia-tu", boLocHienTai.giaTu);
  if (boLocHienTai.giaDen) params.set("gia-den", boLocHienTai.giaDen);
  if (boLocHienTai.chiConHang) params.set("con-hang", "1");
  if (boLocHienTai.chiYeuThich) params.set("yeu-thich", "1");
  if (thuTuSapXep !== "mac-dinh") params.set("sap-xep", thuTuSapXep);

  const chuoiQuery = params.toString();
  const urlMoi = `${window.location.pathname}${chuoiQuery ? `?${chuoiQuery}` : ""}`;
  window.history.replaceState({}, "", urlMoi);
}

function docBoLocTuUrl() {
  if (vaiTroYeuCau) return;
  const params = new URLSearchParams(window.location.search);
  boLocHienTai.tuKhoa = params.get("tu-khoa") || "";
  boLocHienTai.danhMuc = params.get("danh-muc") || "";
  boLocHienTai.nhomDanhMuc = params.get("nhom") || "";
  boLocHienTai.nhaCungCap = params.get("ncc") || "";
  boLocHienTai.khoangGia = params.get("muc-gia") || "";
  boLocHienTai.giaTu = params.get("gia-tu") || "";
  boLocHienTai.giaDen = params.get("gia-den") || "";
  boLocHienTai.chiConHang = params.get("con-hang") === "1";
  boLocHienTai.chiYeuThich = params.get("yeu-thich") === "1";
  thuTuSapXep = params.get("sap-xep") || "mac-dinh";
  if (oTimKiem && boLocHienTai.tuKhoa) {
    oTimKiem.value = boLocHienTai.tuKhoa;
  }
  capNhatNutXoaTimKiem();
}

function khoiTaoNutXoaTimKiem() {
  document.getElementById("nutXoaNhanhTimKiem")?.remove();
  if (!oTimKiem) return;
  oTimKiem.addEventListener("search", () => {
    if (!oTimKiem.value.trim()) {
      dongGoiYTimKiem();
      if (boLocHienTai.tuKhoa) {
        boLocHienTai.tuKhoa = "";
        trangSanPham = 1;
        veCuaHang();
        veIcon();
      }
    }
  });
}

function capNhatNutXoaTimKiem() {}

async function goiApi(duongDan, tuyChon = {}) {
  const phuongThuc = (tuyChon.method || "GET").toUpperCase();
  const headers = new Headers(tuyChon.headers || {});
  headers.set("Accept", "application/json");
  if (!["GET", "HEAD"].includes(phuongThuc)) {
    if (!tokenCsrf)
      throw new Error("Phiên làm việc chưa sẵn sàng. Hãy tải lại trang.");
    headers.set("X-CSRF-Token", tokenCsrf);
  }

  const phanHoi = await fetch(duongDan, {
    ...tuyChon,
    method: phuongThuc,
    credentials: "same-origin",
    headers,
  });
  let duLieu = null;
  if (phanHoi.status !== 204) {
    try {
      duLieu = await phanHoi.json();
    } catch {
      throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
    }
  }
  if (
    phanHoi.status === 401 &&
    vaiTroYeuCau &&
    !duongDan.startsWith("/api/auth/")
  ) {
    window.location.replace("/index.html?dang-nhap=1");
  }
  if (!phanHoi.ok) {
    throw new Error(
      duLieu?.error?.message || `Yêu cầu thất bại (HTTP ${phanHoi.status}).`,
    );
  }
  return duLieu;
}

// Chỉ phục vụ giao diện (ẩn/hiện nút). Máy chủ mới là nơi chặn quyền thật sự.
function coQuyenUI(quyen) {
  const danhSach = duLieuLuu.taiKhoan?.quyen;
  return Array.isArray(danhSach) && danhSach.includes(quyen);
}

function capNhatGiaoDienTaiKhoan() {
  const taiKhoan = duLieuLuu.taiKhoan;
  const laQuanTri =
    taiKhoan?.vaiTro === "nhan_vien" || taiKhoan?.vaiTro === "admin";
  const nutTaiKhoan = document.getElementById("nutTaiKhoan");
  nutTaiKhoan.textContent = taiKhoan ? taiKhoan.ten.split(" ")[0] : "Đăng nhập";
  nutTaiKhoan.setAttribute(
    "aria-label",
    taiKhoan ? `Tài khoản ${taiKhoan.ten}` : "Đăng nhập",
  );
  document.querySelectorAll('[data-xem="quan-tri"]').forEach((nut) => {
    nut.hidden = !laQuanTri;
    nut.classList.toggle("an", !laQuanTri);
  });
  const tenAdmin = document.getElementById("adminTaiKhoanTen");
  if (tenAdmin)
    tenAdmin.textContent =
      taiKhoan?.ten || taiKhoan?.tenTaiKhoan || "Tài khoản";
  const vaiTroAdmin = document.getElementById("adminVaiTro");
  if (vaiTroAdmin)
    vaiTroAdmin.textContent =
      taiKhoan?.vaiTro === "admin" ? "Quản trị viên" : "Nhân viên";
  document
    .querySelector(".di-dong-nav")
    .classList.toggle("co-quan-tri", laQuanTri);
}

function dinhDangTien(soTien) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(soTien);
}

function taoIcon(tenIcon, lop = "") {
  return `<i data-lucide="${tenIcon}" class="${lop}" aria-hidden="true"></i>`;
}

function thoatHTML(giaTri) {
  return String(giaTri ?? "").replace(
    /[&<>"']/g,
    (kyTu) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[kyTu],
  );
}

function toSangTuKhoa(vanBan, tuKhoa) {
  const chuoiGoc = String(vanBan ?? "");
  const tuKhoaSach = chuanHoaChuoiTimKiem(tuKhoa).trim();
  if (!tuKhoaSach || !chuoiGoc) return thoatHTML(chuoiGoc);

  let chuoiChuan = "";
  const mapViTri = [];
  for (let i = 0; i < chuoiGoc.length; i++) {
    const kyTuChuan = chuanHoaChuoiTimKiem(chuoiGoc[i]);
    for (let j = 0; j < kyTuChuan.length; j++) {
      chuoiChuan += kyTuChuan[j];
      mapViTri.push(i);
    }
  }

  const viTriTimThay = chuoiChuan.indexOf(tuKhoaSach);
  if (viTriTimThay === -1) return thoatHTML(chuoiGoc);

  const batDau = mapViTri[viTriTimThay];
  const ketThuc = mapViTri[viTriTimThay + tuKhoaSach.length - 1] + 1;

  return (
    thoatHTML(chuoiGoc.slice(0, batDau)) +
    '<mark class="rounded bg-emerald-500/30 px-0.5 font-bold text-emerald-200">' +
    thoatHTML(chuoiGoc.slice(batDau, ketThuc)) +
    "</mark>" +
    thoatHTML(chuoiGoc.slice(ketThuc))
  );
}

function veIcon() {
  if (window.lucide)
    window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function iconTheoDanhMuc(sanPham) {
  const chuoi =
    `${sanPham.DanhMuc || ""} ${sanPham.TenSP || ""}`.toLocaleLowerCase("vi");
  if (/hạt giống|hạt gieo/.test(chuoi)) return "sprout";
  if (/phân bón|phân hữu cơ|phân vi sinh/.test(chuoi)) return "leaf";
  if (/thuốc|trừ sâu|trừ bệnh|nấm/.test(chuoi)) return "flask-conical";
  if (/chậu|đất|giá thể|xơ dừa|perlite/.test(chuoi)) return "flower-2";
  if (/bình tưới|bơm|thủy canh|thuỷ canh/.test(chuoi)) return "spray-can";
  return "shovel";
}

function taoAnhThayThe(sanPham, biLoi = false) {
  const tenSanPham = thoatHTML(sanPham.TenSP || "Sản phẩm");
  const moTa = biLoi ? "Ảnh không tải được" : "Chưa có ảnh sản phẩm";
  return `<div class="san-pham-anh san-pham-anh-trong" role="img" aria-label="${tenSanPham}: ${moTa}">${taoIcon(iconTheoDanhMuc(sanPham))}<small>${moTa}</small></div>`;
}

function hienThongBao(noiDung) {
  const hopDangMo = document.querySelector("dialog[open]");
  if (hopDangMo) {
    let loiTrongHop = hopDangMo.querySelector(".thong-bao-hop-thoai");
    if (!loiTrongHop) {
      loiTrongHop = document.createElement("p");
      loiTrongHop.className = "thong-bao-hop-thoai ghi-chu";
      loiTrongHop.style.margin = "12px 0 0";
      hopDangMo.querySelector(".hop-thoai")?.appendChild(loiTrongHop);
    }
    loiTrongHop.textContent = noiDung;
    return;
  }

  const oThongBao = document.getElementById("thongBao");
  oThongBao.textContent = noiDung;
  oThongBao.classList.add("dang-hien");
  clearTimeout(henThongBao);
  henThongBao = setTimeout(() => oThongBao.classList.remove("dang-hien"), 3000);
}

async function taiSanPham() {
  try {
    const duongDanApi =
      vaiTroYeuCau && coQuyenUI("quan_tri.xem")
        ? "/api/san-pham?tatca=1"
        : "/api/san-pham";
    const sanPham = await goiApi(duongDanApi);
    if (!Array.isArray(sanPham))
      throw new TypeError("API không trả về danh sách sản phẩm hợp lệ.");
    duLieuLuu.sanPham = sanPham;
    loiTaiSanPham = false;
  } catch (loi) {
    loiTaiSanPham = true;
    console.error("Không thể tải danh sách sản phẩm từ API.", loi);
    hienThongBao("Không thể kết nối dữ liệu sản phẩm.");
  } finally {
    dangTaiSanPham = false;
    if (trangHienTai === "cua-hang" || trangHienTai === "quan-tri" || trangHienTai === "gio-hang") veTrang();
    veGioHang();
  }
}

async function taiDuLieuQuanTri() {
  if (dangTaiDuLieuQuanTri || daTaiDuLieuQuanTri) return;
  dangTaiDuLieuQuanTri = true;
  loiTaiDuLieuQuanTri = false;

  try {
    const duLieu = await goiApi("/api/quan-tri");
    if (!Array.isArray(duLieu.donHang) || !Array.isArray(duLieu.taiKhoan)) {
      throw new TypeError("API quản trị không trả về dữ liệu hợp lệ.");
    }
    duLieuQuanTri.donHang = duLieu.donHang;
    duLieuQuanTri.taiKhoan = duLieu.taiKhoan;
    daTaiDuLieuQuanTri = true;
  } catch (loi) {
    loiTaiDuLieuQuanTri = true;
    console.error("Không thể tải dữ liệu quản trị từ API.", loi);
    hienThongBao("Không thể tải dữ liệu quản trị.");
  } finally {
    dangTaiDuLieuQuanTri = false;
    if (trangHienTai === "quan-tri") {
      veQuanTri();
      veIcon();
    }
  }
}

async function taiDonHang(lamMoi = false) {
  if (
    dangTaiDonHang ||
    (!lamMoi && daTaiDonHang) ||
    duLieuLuu.taiKhoan?.vaiTro !== "khach_hang"
  ) {
    return;
  }

  dangTaiDonHang = true;
  loiTaiDonHang = false;
  veDonHang();

  try {
    const phanHoi = await goiApi("/api/don-hang");
    if (!Array.isArray(phanHoi.donHang)) {
      throw new TypeError("API không trả về danh sách đơn hàng hợp lệ.");
    }
    duLieuLuu.donHang = phanHoi.donHang;
    daTaiDonHang = false;
  } catch (loi) {
    loiTaiDonHang = true;
    console.error("Không thể tải đơn hàng của tài khoản.", loi);
  } finally {
    dangTaiDonHang = false;
    if (trangHienTai === "don-hang") veTrang();
  }
}

async function taiPhuongThucThanhToan() {
  try {
    const phanHoi = await goiApi("/api/don-hang/phuong-thuc");
    if (
      !Array.isArray(phanHoi.phuongThuc) ||
      !phanHoi.phuongThuc.some((phuongThuc) => phuongThuc.ma === "cod")
    ) {
      throw new TypeError("API không trả về phương thức thanh toán hợp lệ.");
    }
    cacPhuongThucThanhToan = phanHoi.phuongThuc;
  } catch (loi) {
    console.error("Không thể tải phương thức thanh toán.", loi);
    if (trangHienTai === "gio-hang") {
      hienThongBao("Không thể tải phương thức thanh toán; hiện chỉ có thể thử COD.");
    }
  } finally {
    if (trangHienTai === "gio-hang") veTrang();
  }
}

async function capNhatDonHangQuanTri(maHD, duLieu) {
  try {
    await goiApi(`/api/don-hang/${encodeURIComponent(maHD)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duLieu),
    });
    daTaiDuLieuQuanTri = false;
    await taiDuLieuQuanTri();
    hienThongBao(`Đã cập nhật đơn hàng #${maHD}.`);
  } catch (loi) {
    console.error(`Không thể cập nhật đơn hàng ${maHD}.`, loi);
    hienThongBao(loi.message || "Không thể cập nhật đơn hàng.");
  }
}

document.addEventListener(
  "error",
  (suKien) => {
    const anh = suKien.target;
    if (!(anh instanceof HTMLImageElement)) return;

    if (anh.classList.contains("san-pham-anh")) {
      const theSanPham = anh.closest(".the-san-pham");
      const sanPham = duLieuLuu.sanPham.find(
        (mon) => String(mon.MaSP) === anh.dataset.maSanPham,
      );
      if (theSanPham && sanPham) {
        theSanPham
          .querySelector(".san-pham-anh")
          ?.replaceWith(
            document
              .createRange()
              .createContextualFragment(taoAnhThayThe(sanPham, true)),
          );
        veIcon();
        return;
      }
      const oTrong = document.createElement("div");
      oTrong.className = "san-pham-anh san-pham-anh-trong";
      oTrong.setAttribute("role", "img");
      oTrong.setAttribute(
        "aria-label",
        anh.alt || "Ảnh sản phẩm không khả dụng",
      );
      oTrong.innerHTML = `${taoIcon("package")}<small>Ảnh không tải được</small>`;
      anh.replaceWith(oTrong);
      veIcon();
    } else if (anh.closest(".dong-gio")) {
      const oTrong = document.createElement("div");
      oTrong.className = "anh-san-pham-trong";
      oTrong.setAttribute("aria-hidden", "true");
      oTrong.innerHTML = taoIcon("package");
      anh.replaceWith(oTrong);
      veIcon();
    } else if (anh.classList.contains("anh-quan-tri")) {
      const oTrong = document.createElement("div");
      oTrong.className = "anh-quan-tri-trong";
      oTrong.setAttribute("aria-hidden", "true");
      oTrong.innerHTML = taoIcon("package");
      anh.replaceWith(oTrong);
      veIcon();
    }
  },
  true,
);

// =============================================================================
// LUỒNG HIỂN THỊ SỐ ĐẾM GIỎ HÀNG TRÊN THANH HEADER
// =============================================================================
function capNhatSoGio() {
  // Tính tổng số lượng của toàn bộ các sản phẩm hiện có trong giỏ hàng
  const soLuong = duLieuLuu.gioHang.reduce(
    (tong, mon) => tong + mon.soLuong,
    0,
  );
  // Cập nhật số đếm lên huy hiệu (badge) icon giỏ hàng trên giao diện
  document.getElementById("soLuongGio").textContent = soLuong;
  document.getElementById("nhanSoGio").textContent = `(${soLuong})`;
}

function chuyenTrang(trangMoi) {
  if (
    trangMoi === "quan-tri" &&
    !["nhan_vien", "admin"].includes(duLieuLuu.taiKhoan?.vaiTro)
  ) {
    hienThongBao(
      "Bạn cần tài khoản nhân viên hoặc admin để mở trang quản trị.",
    );
    moHopTaiKhoan("dang-nhap");
    return;
  }
  if (trangMoi === "quan-tri" && !vaiTroYeuCau) {
    window.location.assign(duongDanTrangVaiTro(duLieuLuu.taiKhoan.vaiTro));
    return;
  }
  if (trangMoi === "cua-hang" && vaiTroYeuCau) {
    window.location.assign("/index.html");
    return;
  }
  const lopPhuGio = document.getElementById("lopPhu");
  const nganGio = document.getElementById("nganGio");
  if (lopPhuGio?.classList.contains("dang-mo")) {
    lopPhuGio.classList.remove("dang-mo");
    nganGio.classList.remove("dang-mo");
    lopPhuGio.setAttribute("aria-hidden", "true");
    nganGio.setAttribute("aria-hidden", "true");
  }
  trangHienTai = trangMoi;
  document.querySelectorAll("[data-xem]").forEach((nut) => {
    const dangChon = nut.dataset.xem === trangMoi;
    nut.classList.toggle("dang-chon", dangChon);
    if (
      nut.classList.contains("nut-nav") ||
      nut.closest(".store-primary-nav, .di-dong-nav")
    ) {
      nut.setAttribute("aria-current", dangChon ? "page" : "false");
    }
  });
  veTrang();
  if (trangMoi === "quan-tri") taiDuLieuQuanTri();
  if (trangMoi === "don-hang") void taiDonHang();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function duongDanTrangVaiTro(vaiTro) {
  return vaiTro === "admin" ? "/pages/admin.html" : "/pages/nhan-vien.html";
}

function veTrang() {
  oNoiDung.dataset.trang = trangHienTai;
  oNoiDung.classList.toggle("trang-cua-hang", trangHienTai === "cua-hang");
  const hamVe = {
    "cua-hang": veCuaHang,
    "cam-nang": veCamNang,
    "gio-hang": veThanhToan,
    "don-hang": veDonHang,
    "tai-khoan": veTaiKhoan,
    "quan-tri": veQuanTri,
  };
  (hamVe[trangHienTai] || veCuaHang)();
  veIcon();
}

function veSanPham(sanPham) {
  const maSP = thoatHTML(sanPham.MaSP);
  const tenSP = thoatHTML(sanPham.TenSP);
  const tenHienThi = boLocHienTai.tuKhoa
    ? toSangTuKhoa(sanPham.TenSP, boLocHienTai.tuKhoa)
    : tenSP;
  const dangThich = duLieuLuu.yeuThich.includes(sanPham.MaSP);
  const soLuong = Number(sanPham.Soluong || 0);
  return `<article class="group flex flex-col rounded-lg border border-[#3f493f] bg-[#141d1a] p-3.5 transition-all duration-200 hover:border-emerald-400" data-chi-tiet="${maSP}">
    <div class="group relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded border border-[#3f493f]/30 bg-[#07100d] p-3">
      ${sanPham.anh ? `<img class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" data-ma-san-pham="${maSP}" alt="${tenSP}" src="${thoatHTML(sanPham.anh)}" loading="lazy" decoding="async">` : `<div class="flex flex-col items-center gap-2 text-center text-emerald-400">${taoIcon(iconTheoDanhMuc(sanPham), "text-5xl")}<span class="text-[12px] text-gray-500">Chưa có ảnh sản phẩm</span></div>`}
      <span class="absolute left-2 top-2 rounded bg-amber-600 px-2 py-1 text-[10.8px] font-bold uppercase text-white">${thoatHTML(sanPham.DviTinh)}</span>
      <button class="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-[#3f493f]/60 bg-[#07100d]/80 transition-colors hover:text-red-300 ${dangThich ? "border-red-500/60 bg-red-950/70 text-red-400" : "text-gray-300"}" data-thich="${maSP}" aria-label="${dangThich ? "Bỏ yêu thích" : "Thêm yêu thích"}">${taoIcon("heart")}</button>
    </div>
    <div class="flex flex-1 flex-col">
      <span class="mb-1 text-[10.8px] font-bold uppercase tracking-wider text-emerald-400">${thoatHTML(sanPham.TenNCC || "Vườn Phố")}</span>
      <h3 class="mb-2 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-gray-100">${tenHienThi}</h3>
      <div class="mb-3 flex items-center justify-between gap-2 text-[12px] text-gray-400"><span>${soLuong > 0 ? `Còn ${thoatHTML(sanPham.Soluong)} ${thoatHTML(sanPham.DviTinh)}` : "Tạm hết hàng"}</span><span class="flex items-center gap-1 text-amber-300"><span class="material-symbols-outlined text-sm">verified</span>Thông tin rõ ràng</span></div>
      <div class="mt-auto flex items-center justify-between gap-2 border-t border-[#26352d] pt-3"><strong class="text-base font-extrabold text-emerald-300">${dinhDangTien(sanPham.Giaban)}</strong><button class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-emerald-700 bg-emerald-700 text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40" data-them-gio="${maSP}" aria-label="Thêm ${tenSP} vào giỏ" ${soLuong <= 0 ? "disabled" : ""}>${taoIcon("plus")}</button></div>
    </div>
  </article>`;
}

function chuanHoaChuoiTimKiem(giaTri) {
  return String(giaTri ?? "")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function layKhoangGiaDangApDung() {
  if (boLocHienTai.khoangGia === "duoi-50")
    return { min: 0, max: 50000, nhan: "Dưới 50.000đ" };
  if (boLocHienTai.khoangGia === "50-100")
    return { min: 50000, max: 100000, nhan: "50.000đ – 100.000đ" };
  if (boLocHienTai.khoangGia === "100-200")
    return { min: 100000, max: 200000, nhan: "100.000đ – 200.000đ" };
  if (boLocHienTai.khoangGia === "tren-200")
    return { min: 200000, max: Infinity, nhan: "Trên 200.000đ" };

  const giaTu = boLocHienTai.giaTu !== "" ? Number(boLocHienTai.giaTu) : null;
  const giaDen =
    boLocHienTai.giaDen !== "" ? Number(boLocHienTai.giaDen) : null;
  if (giaTu !== null || giaDen !== null) {
    const min = giaTu !== null && !Number.isNaN(giaTu) ? giaTu : 0;
    const max = giaDen !== null && !Number.isNaN(giaDen) ? giaDen : Infinity;
    const nhan =
      giaTu !== null && giaDen !== null
        ? `${dinhDangTien(min)} – ${dinhDangTien(max)}`
        : giaTu !== null
          ? `Từ ${dinhDangTien(min)}`
          : `Đến ${dinhDangTien(max)}`;
    return { min, max, nhan };
  }
  return null;
}

function locSanPham() {
  const khoangGia = layKhoangGiaDangApDung();
  const ketQua = duLieuLuu.sanPham.filter((sanPham) => {
    const noiDungTimKiem = `${sanPham.MaSP} ${sanPham.TenSP} ${sanPham.TenNCC} ${sanPham.DviTinh} ${sanPham.DanhMuc} ${sanPham.NhomDanhMuc}`;
    const khopTuKhoa = chuanHoaChuoiTimKiem(noiDungTimKiem).includes(
      chuanHoaChuoiTimKiem(boLocHienTai.tuKhoa),
    );
    const danhMucSanPham = (sanPham.DanhMuc || "").toLocaleLowerCase("vi");
    const nhomSanPham = (sanPham.NhomDanhMuc || "").toLocaleLowerCase("vi");
    const khopDanhMuc =
      !boLocHienTai.danhMuc ||
      (boLocHienTai.nhomDanhMuc
        ? nhomSanPham === boLocHienTai.nhomDanhMuc.toLocaleLowerCase("vi")
        : danhMucSanPham === boLocHienTai.danhMuc.toLocaleLowerCase("vi"));
    const khopNhaCungCap =
      !boLocHienTai.nhaCungCap ||
      (sanPham.TenNCC || "") === boLocHienTai.nhaCungCap;
    const giaBan = Number(sanPham.Giaban || 0);
    const khopGia =
      !khoangGia || (giaBan >= khoangGia.min && giaBan <= khoangGia.max);
    const khopConHang =
      !boLocHienTai.chiConHang || Number(sanPham.Soluong || 0) > 0;
    const khopYeuThich =
      !boLocHienTai.chiYeuThich || duLieuLuu.yeuThich.includes(sanPham.MaSP);

    return (
      khopTuKhoa &&
      khopDanhMuc &&
      khopNhaCungCap &&
      khopGia &&
      khopConHang &&
      khopYeuThich
    );
  });

  if (thuTuSapXep === "gia-tang") {
    ketQua.sort((a, b) => Number(a.Giaban) - Number(b.Giaban));
  } else if (thuTuSapXep === "gia-giam") {
    ketQua.sort((a, b) => Number(b.Giaban) - Number(a.Giaban));
  } else if (thuTuSapXep === "ten") {
    ketQua.sort((a, b) => a.TenSP.localeCompare(b.TenSP, "vi"));
  }

  return ketQua;
}

function dongGoiYTimKiem() {
  document.getElementById("goiYTimKiem")?.remove();
}

function hienThiGoiYTimKiem(tuKhoa) {
  const formTimKiem = document.getElementById("formTimKiem");
  if (!formTimKiem) return;

  const chuoiSach = tuKhoa.trim();
  if (chuoiSach.length < 2 || !duLieuLuu.sanPham.length) {
    dongGoiYTimKiem();
    return;
  }

  const tuKhoaChuan = chuanHoaChuoiTimKiem(chuoiSach);
  const goiY = duLieuLuu.sanPham
    .filter((sp) =>
      chuanHoaChuoiTimKiem(`${sp.TenSP} ${sp.TenNCC} ${sp.DanhMuc}`).includes(
        tuKhoaChuan,
      ),
    )
    .slice(0, 5);

  formTimKiem.style.position = "relative";
  let khungGoiY = document.getElementById("goiYTimKiem");
  if (!khungGoiY) {
    khungGoiY = document.createElement("div");
    khungGoiY.id = "goiYTimKiem";
    khungGoiY.className =
      "absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[#3f493f] bg-[#141d1a] shadow-2xl";
    formTimKiem.appendChild(khungGoiY);
  }

  if (!goiY.length) {
    khungGoiY.innerHTML = `<div class="px-4 py-3 text-xs text-gray-400">Không tìm thấy sản phẩm phù hợp với “<strong class="text-gray-200">${thoatHTML(chuoiSach)}</strong>”.</div>`;
    return;
  }

  khungGoiY.innerHTML = `
    <div class="border-b border-[#26352d] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Gợi ý sản phẩm (${goiY.length})</div>
    <div class="divide-y divide-[#26352d]">
      ${goiY
        .map(
          (sp) => `
        <button type="button" data-chon-goi-y="${thoatHTML(sp.MaSP)}" class="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#1d2b24]">
          ${
            sp.anh
              ? `<img src="${thoatHTML(sp.anh)}" alt="" class="h-10 w-10 shrink-0 rounded border border-[#3f493f] bg-[#07100d] object-contain p-1">`
              : `<span class="grid h-10 w-10 shrink-0 place-items-center rounded border border-[#3f493f] bg-[#07100d] text-emerald-400">${taoIcon(iconTheoDanhMuc(sp))}</span>`
          }
          <div class="min-w-0 flex-1">
            <strong class="block truncate text-xs font-semibold text-gray-100">${toSangTuKhoa(sp.TenSP, chuoiSach)}</strong>
            <span class="block truncate text-[11.5px] text-gray-400">${toSangTuKhoa(sp.TenNCC || "Vườn Phố", chuoiSach)} · ${thoatHTML(sp.DviTinh)}</span>
          </div>
          <strong class="shrink-0 text-xs font-extrabold text-emerald-300">${dinhDangTien(sp.Giaban)}</strong>
        </button>
      `,
        )
        .join("")}
    </div>
    <button type="submit" class="block w-full border-t border-[#26352d] bg-[#101915] px-3.5 py-2 text-center text-xs font-semibold text-emerald-300 hover:bg-[#182622]">
      Xem tất cả kết quả cho “${thoatHTML(chuoiSach)}” →
    </button>
  `;
  veIcon();
}

function veCuaHang() {
  dongBoBoLocLenUrl();
  capNhatNutXoaTimKiem();
  const ketQuaSanPham = locSanPham();
  const tongSoTrang = Math.max(
    1,
    Math.ceil(ketQuaSanPham.length / soSanPhamMoiTrang),
  );
  trangSanPham = Math.min(trangSanPham, tongSoTrang);
  const viTriBatDau = (trangSanPham - 1) * soSanPhamMoiTrang;
  const sanPhamTrangHienTai = ketQuaSanPham.slice(
    viTriBatDau,
    viTriBatDau + soSanPhamMoiTrang,
  );
  const khoangGiaDangChon = layKhoangGiaDangApDung();
  const dangLoc = Boolean(
    boLocHienTai.tuKhoa ||
    boLocHienTai.danhMuc ||
    boLocHienTai.nhaCungCap ||
    khoangGiaDangChon ||
    boLocHienTai.chiConHang ||
    boLocHienTai.chiYeuThich,
  );
  const tieuDeLoc = boLocHienTai.nhomDanhMuc || boLocHienTai.danhMuc;
  const danhSachNhaCungCap = [
    ...new Set(duLieuLuu.sanPham.map((sp) => sp.TenNCC).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "vi"));
  const soLuongYeuThich = duLieuLuu.yeuThich.filter((ma) =>
    duLieuLuu.sanPham.some((sp) => sp.MaSP === ma),
  ).length;
  const danhMucPhoBien = danhSachDanhMuc.map((danhMuc) => ({
    ...danhMuc,
    soSanPham: duLieuLuu.sanPham.filter(
      (sanPham) =>
        (sanPham.DanhMuc || "").toLocaleLowerCase("vi") ===
        danhMuc.ten.toLocaleLowerCase("vi"),
    ).length,
  }));
  const tenDangLocDanhMuc = boLocHienTai.nhomDanhMuc || boLocHienTai.danhMuc;

  const cacNhanDangLoc = [];
  if (boLocHienTai.tuKhoa)
    cacNhanDangLoc.push(`Từ khóa: “${thoatHTML(boLocHienTai.tuKhoa)}”`);
  if (boLocHienTai.danhMuc)
    cacNhanDangLoc.push(`Danh mục: ${thoatHTML(tieuDeLoc)}`);
  if (boLocHienTai.nhaCungCap)
    cacNhanDangLoc.push(`NCC: ${thoatHTML(boLocHienTai.nhaCungCap)}`);
  if (khoangGiaDangChon)
    cacNhanDangLoc.push(`Giá: ${thoatHTML(khoangGiaDangChon.nhan)}`);
  if (boLocHienTai.chiConHang) cacNhanDangLoc.push("Chỉ hiện còn hàng");
  if (boLocHienTai.chiYeuThich) cacNhanDangLoc.push("Sản phẩm đã thích");

  const tieuDeKhuVucSanPham = boLocHienTai.chiYeuThich
    ? "Sản phẩm đã thích"
    : boLocHienTai.tuKhoa
      ? `Kết quả tìm kiếm: “${thoatHTML(boLocHienTai.tuKhoa)}”`
      : dangLoc
        ? `Sản phẩm: ${thoatHTML(tieuDeLoc || "phù hợp")}`
        : "Sản phẩm";

  const phanGioiThieuDauTrang = !dangLoc
    ? `
      <section class="relative flex min-h-[380px] items-center overflow-hidden rounded-lg border border-[#3f493f] bg-gradient-to-r from-[#072416] via-[#0d3420] to-[#0a2318]">
        <img class="absolute inset-0 h-full w-full object-cover object-right opacity-40 mix-blend-luminosity" alt="" aria-hidden="true" src="https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1400&q=85">
        <div class="absolute inset-0 bg-gradient-to-r from-[#07100d] via-[#07100d]/90 to-transparent"></div>
        <div class="relative z-10 flex max-w-2xl flex-col justify-between p-6 sm:p-10 lg:p-12"><div><span class="mb-4 inline-flex items-center gap-2 rounded border border-emerald-400/30 bg-emerald-800/40 px-3 py-1 text-[12px] font-bold text-emerald-300">${taoIcon("sprout", "text-amber-400")} CHĂM VƯỜN THEO MÙA</span><h1 class="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">Vườn khỏe bắt đầu từ lựa chọn đúng.</h1><p class="mb-6 max-w-xl text-sm leading-6 text-gray-300 md:text-base">Vật tư trồng trọt được chọn lọc cùng cẩm nang chăm cây dễ hiểu cho từng khu vườn ban công và sân thượng.</p></div><div class="flex flex-wrap gap-3"><button class="flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-3 text-xs font-bold text-amber-950 shadow-md transition-all hover:bg-amber-300" data-xuong="sanPhamNoiBat">Khám phá sản phẩm ${taoIcon("arrow-right")}</button><button class="flex items-center gap-2 rounded-lg border border-[#3f493f] bg-[#232c29]/80 px-5 py-3 text-xs font-semibold text-gray-100 transition-colors hover:bg-[#2d3733]" data-xem="cam-nang">${taoIcon("scan-line", "text-emerald-300")} Cẩm nang bệnh cây</button></div><div class="mt-6 flex items-center gap-2 text-[10.8px] font-bold uppercase tracking-wider text-gray-400">${taoIcon("shield-check", "text-emerald-400")} Thông tin sản phẩm được hiển thị rõ ràng</div></div>
      </section>
      <section class="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Tiện ích cửa hàng">
        <article class="flex items-center gap-3 rounded-lg border border-[#3f493f] bg-[#141d1a] p-3.5"><span class="grid h-10 w-10 shrink-0 place-items-center rounded bg-[#232c29] text-emerald-400">${taoIcon("truck", "text-xl")}</span><div><h2 class="text-xs font-bold text-gray-100">Giao hàng toàn quốc</h2><p class="text-[12px] text-gray-400">Theo dõi đơn hàng tiện lợi</p></div></article>
        <article class="flex items-center gap-3 rounded-lg border border-[#3f493f] bg-[#141d1a] p-3.5"><span class="grid h-10 w-10 shrink-0 place-items-center rounded bg-[#232c29] text-emerald-400">${taoIcon("badge-check", "text-xl")}</span><div><h2 class="text-xs font-bold text-gray-100">Vật tư rõ nguồn gốc</h2><p class="text-[12px] text-gray-400">Thông tin dễ tra cứu</p></div></article>
        <article class="flex items-center gap-3 rounded-lg border border-[#3f493f] bg-[#141d1a] p-3.5"><span class="grid h-10 w-10 shrink-0 place-items-center rounded bg-[#232c29] text-amber-300">${taoIcon("book-open-text", "text-xl")}</span><div><h2 class="text-xs font-bold text-gray-100">Cẩm nang chăm cây</h2><p class="text-[12px] text-gray-400">Thông tin tham khảo</p></div></article>
        <article class="flex items-center gap-3 rounded-lg border border-[#3f493f] bg-[#141d1a] p-3.5"><span class="grid h-10 w-10 shrink-0 place-items-center rounded bg-[#232c29] text-emerald-300">${taoIcon("camera", "text-xl")}</span><div><h2 class="text-xs font-bold text-gray-100">Hỗ trợ xem ảnh cây</h2><p class="text-[12px] text-gray-400">Xem trước ngay trên thiết bị</p></div></article>
      </section>
  `
    : "";

  oNoiDung.innerHTML = `<div class="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6 lg:px-8">
    <aside class="store-category-sticky h-fit overflow-hidden rounded-lg border border-[#3f493f] bg-[#141d1a]" data-cua-hang-danh-muc aria-label="Lọc sản phẩm theo danh mục">
      <div class="flex items-center justify-between border-b border-emerald-800 bg-emerald-700 px-3 py-3"><h2 class="flex items-center gap-2 text-xs font-extrabold tracking-tight text-white"><span class="material-symbols-outlined text-lg">menu</span>DANH MỤC SẢN PHẨM</h2><span class="rounded border border-white/20 bg-emerald-900/50 px-2 py-1 text-[10.8px] font-bold text-emerald-50">${danhMucPhoBien.length} MỤC</span></div>
      <div class="border-b border-[#3f493f]/40 bg-[#141d1a]/60 px-4 py-2 text-[12px] uppercase tracking-wider text-gray-500">Vật tư nông nghiệp đô thị</div>
      <nav class="max-h-[calc(100vh-285px)] space-y-0.5 overflow-y-auto p-2" aria-label="Danh mục sản phẩm">
        <button class="flex min-h-10 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs font-semibold transition-colors ${!boLocHienTai.danhMuc && !dangLoc ? "bg-emerald-700 text-emerald-50" : "text-gray-300 hover:bg-[#232c29]"}" data-xoa-loc-danh-muc><span class="flex items-center gap-2">${taoIcon("grid-2x2")}Tất cả sản phẩm</span>${taoIcon("chevron-right")}</button>
        ${danhMucPhoBien
          .map((danhMuc) => {
            const dangMo = menuDanhMucDangMo && danhMucDangMo === danhMuc.ten;
            return `<div class="border-b border-[#26352d]/60 last:border-0"><div class="flex items-center rounded-md transition-colors hover:bg-[#232c29]"><button class="flex min-h-9 min-w-0 flex-1 items-center gap-2 px-2.5 text-left text-[13.2px] ${danhMuc.ten === boLocHienTai.danhMuc ? "font-bold text-emerald-300" : "text-gray-300"}" data-chon-danh-muc="${thoatHTML(danhMuc.ten)}"><span class="shrink-0">${taoIcon(iconTheoDanhMuc({ DanhMuc: danhMuc.ten }))}</span><span class="truncate">${thoatHTML(danhMuc.ten)}</span></button><button class="grid h-9 w-8 shrink-0 place-items-center text-gray-500 hover:text-emerald-300" data-mo-danh-muc="${thoatHTML(danhMuc.ten)}" aria-label="${dangMo ? "Thu gọn" : "Mở"} danh mục ${thoatHTML(danhMuc.ten)}" aria-expanded="${dangMo}">${taoIcon("chevron-right", dangMo ? "rotate-90" : "")}</button></div>${dangMo ? `<div class="danh-muc-nhom ml-4 border-l border-[#30453b] pl-2"><button class="block min-h-8 w-full rounded px-2 text-left text-[12px] ${tenDangLocDanhMuc === danhMuc.ten ? "text-emerald-300" : "text-gray-400 hover:text-gray-100"}" data-chon-danh-muc="${thoatHTML(danhMuc.ten)}">Tất cả ${thoatHTML(danhMuc.ten)}</button>${danhMuc.nhom.map((nhom) => `<button class="block min-h-8 w-full rounded px-2 text-left text-[12px] ${tenDangLocDanhMuc === nhom ? "text-emerald-300" : "text-gray-400 hover:text-gray-100"}" data-danh-muc-cha="${thoatHTML(danhMuc.ten)}" data-chon-nhom-danh-muc="${thoatHTML(nhom)}">${thoatHTML(nhom)}</button>`).join("")}</div>` : ""}</div>`;
          })
          .join("")}
      </nav>
      <div class="border-t border-[#3f493f]/60 p-2.5"><button class="flex min-h-10 w-full items-center justify-between gap-2 rounded border border-[#3f493f] bg-[#18211e] px-3 text-[13.2px] font-semibold text-emerald-300 transition-colors hover:border-emerald-700 hover:bg-[#1d2b24]" data-xem="cam-nang">${taoIcon("book-open-text")} Cẩm nang chăm sóc ${taoIcon("arrow-right")}</button></div>
    </aside>
    <div class="noi-dung-cua-hang min-w-0 space-y-5">
      ${phanGioiThieuDauTrang}
      <section class="space-y-4" id="sanPhamNoiBat" aria-labelledby="tieuDeSanPham">
        <div class="flex flex-col justify-between gap-3 border-b border-[#3f493f]/60 pb-3 sm:flex-row sm:items-center">
          <div>
            <h2 id="tieuDeSanPham" class="flex flex-wrap items-center gap-2 text-lg font-bold text-white">${tieuDeKhuVucSanPham}<span class="text-[13.2px] font-normal text-gray-500">${ketQuaSanPham.length} sản phẩm phù hợp</span></h2>
            ${cacNhanDangLoc.length ? `<p class="mt-1 text-[12px] text-gray-400">${cacNhanDangLoc.join(" · ")} <button class="ml-2 font-semibold text-emerald-300 hover:underline" data-xoa-bo-loc>← Quay lại trang chủ / Xóa bộ lọc</button></p>` : ""}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" id="nutLocYeuThich" class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${boLocHienTai.chiYeuThich ? "border-red-500/60 bg-red-950/60 text-red-200" : "border-[#3f493f] bg-[#141d1a] text-gray-300 hover:border-emerald-500"}">
              ${taoIcon("heart")} Đã thích (${soLuongYeuThich})
            </button>
            <label class="flex items-center gap-2 text-[12px] text-gray-400" for="sapXepSanPham">Sắp xếp<select id="sapXepSanPham" class="rounded-lg border border-[#3f493f] bg-[#141d1a] px-3 py-2 text-xs text-gray-200 focus:border-emerald-400 focus:outline-none"><option value="mac-dinh" ${thuTuSapXep === "mac-dinh" ? "selected" : ""}>Mặc định</option><option value="ten" ${thuTuSapXep === "ten" ? "selected" : ""}>Tên A–Z</option><option value="gia-tang" ${thuTuSapXep === "gia-tang" ? "selected" : ""}>Giá thấp trước</option><option value="gia-giam" ${thuTuSapXep === "gia-giam" ? "selected" : ""}>Giá cao trước</option></select></label>
          </div>
        </div>

        <div class="rounded-xl border border-[#3f493f] bg-[#141d1a] p-3.5" aria-label="Bộ lọc sản phẩm nâng cao">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label class="text-[12px] font-semibold text-gray-400">
              Nhà cung cấp
              <select id="locNhaCungCapCuaHang" class="mt-1.5 w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 text-xs text-gray-200 focus:border-emerald-500 focus:outline-none">
                <option value="">Tất cả nhà cung cấp</option>
                ${danhSachNhaCungCap.map((ncc) => `<option value="${thoatHTML(ncc)}" ${boLocHienTai.nhaCungCap === ncc ? "selected" : ""}>${thoatHTML(ncc)}</option>`).join("")}
              </select>
            </label>

            <label class="text-[12px] font-semibold text-gray-400">
              Mức giá nhanh
              <select id="locKhoangGiaCuaHang" class="mt-1.5 w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 text-xs text-gray-200 focus:border-emerald-500 focus:outline-none">
                <option value="" ${boLocHienTai.khoangGia === "" ? "selected" : ""}>Tất cả mức giá</option>
                <option value="duoi-50" ${boLocHienTai.khoangGia === "duoi-50" ? "selected" : ""}>Dưới 50.000đ</option>
                <option value="50-100" ${boLocHienTai.khoangGia === "50-100" ? "selected" : ""}>50.000đ – 100.000đ</option>
                <option value="100-200" ${boLocHienTai.khoangGia === "100-200" ? "selected" : ""}>100.000đ – 200.000đ</option>
                <option value="tren-200" ${boLocHienTai.khoangGia === "tren-200" ? "selected" : ""}>Trên 200.000đ</option>
              </select>
            </label>

            <div class="text-[12px] font-semibold text-gray-400">
              Khoảng giá tùy chỉnh (đ)
              <div class="mt-1.5 flex items-center gap-1.5">
                <input id="locGiaTuCuaHang" type="number" min="0" step="1000" value="${thoatHTML(boLocHienTai.giaTu)}" placeholder="Từ" class="w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-2.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none">
                <span class="text-gray-500">–</span>
                <input id="locGiaDenCuaHang" type="number" min="0" step="1000" value="${thoatHTML(boLocHienTai.giaDen)}" placeholder="Đến" class="w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-2.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none">
              </div>
            </div>

            <div class="flex flex-col justify-between gap-2 pt-1">
              <label class="flex cursor-pointer items-center gap-2 text-xs text-gray-300">
                <input id="locChiConHangCuaHang" type="checkbox" class="h-4 w-4 rounded accent-emerald-500" ${boLocHienTai.chiConHang ? "checked" : ""}>
                <span>Chỉ hiện sản phẩm còn hàng</span>
              </label>
              <div class="flex items-center gap-2">
                <button type="button" id="nutApDungGiaCuaHang" class="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-600">Lọc giá</button>
                ${dangLoc ? `<button type="button" data-xoa-bo-loc class="rounded-lg border border-[#30453b] bg-[#101915] px-3 py-2 text-xs font-semibold text-gray-300 hover:border-amber-500 hover:text-amber-300">Đặt lại</button>` : ""}
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">${ketQuaSanPham.length ? sanPhamTrangHienTai.map(veSanPham).join("") : `<div class="col-span-full rounded-xl border border-dashed border-[#3f493f] bg-[#141d1a] p-10 text-center text-sm text-gray-400"><strong class="block text-white">${dangLoc ? "Không tìm thấy sản phẩm phù hợp" : dangTaiSanPham ? "Đang tải sản phẩm" : loiTaiSanPham ? "Không thể tải sản phẩm" : "Chưa có sản phẩm"}</strong><span class="mt-1 block">${dangLoc ? "Thử thay đổi khoảng giá, nhà cung cấp hoặc bấm Đặt lại bộ lọc." : dangTaiSanPham ? "Đang kết nối đến hệ thống." : loiTaiSanPham ? "Kiểm tra kết nối máy chủ rồi thử lại." : "Danh mục chưa có dữ liệu."}</span>${dangLoc ? `<button type="button" data-xoa-bo-loc class="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-600">Xóa bộ lọc</button>` : ""}</div>`}</div>
        ${vePhanTrangSanPham(ketQuaSanPham.length, tongSoTrang, viTriBatDau)}
      </section>
    </div>
  </div>`;
}

function vePhanTrangSanPham(tongSanPham, tongSoTrang, viTriBatDau) {
  if (tongSoTrang <= 1) return "";

  const trangDau = Math.max(1, Math.min(trangSanPham - 2, tongSoTrang - 4));
  const trangCuoi = Math.min(tongSoTrang, trangDau + 4);
  const trang = Array.from(
    { length: trangCuoi - trangDau + 1 },
    (_, viTri) => trangDau + viTri,
  );
  return `<nav class="flex flex-col items-center justify-between gap-3 border-t border-[#3f493f]/60 pt-4 sm:flex-row" aria-label="Phân trang sản phẩm">
    <span class="text-[13.2px] text-gray-500">Hiển thị ${viTriBatDau + 1}–${Math.min(viTriBatDau + soSanPhamMoiTrang, tongSanPham)} trong ${tongSanPham} sản phẩm</span>
    <div class="flex items-center gap-1">
      <button class="flex min-h-9 items-center gap-1 rounded-lg border border-[#3f493f] px-3 text-xs text-gray-300 hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-40" data-trang-san-pham="${trangSanPham - 1}" aria-label="Trang trước" ${trangSanPham === 1 ? "disabled" : ""}>${taoIcon("chevron-left")} Trước</button>
      ${trang.map((soTrang) => `<button class="grid h-9 min-w-9 place-items-center rounded-lg border text-xs ${soTrang === trangSanPham ? "border-emerald-600 bg-emerald-700 text-white" : "border-[#3f493f] text-gray-300 hover:border-emerald-500 hover:text-emerald-300"}" data-trang-san-pham="${soTrang}" aria-label="Trang ${soTrang}" ${soTrang === trangSanPham ? 'aria-current="page"' : ""}>${soTrang}</button>`).join("")}
      <button class="flex min-h-9 items-center gap-1 rounded-lg border border-[#3f493f] px-3 text-xs text-gray-300 hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-40" data-trang-san-pham="${trangSanPham + 1}" aria-label="Trang sau" ${trangSanPham === tongSoTrang ? "disabled" : ""}>Sau ${taoIcon("chevron-right")}</button>
    </div>
  </nav>`;
}

function duaSanPhamLenDau() {
  const mucSanPham = document.getElementById("sanPhamNoiBat");
  if (mucSanPham)
    mucSanPham.scrollIntoView({ behavior: "smooth", block: "start" });
}

function veCamNang() {
  const baiViet = duLieuLuu.benhCay;
  oNoiDung.innerHTML = `<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
    <nav class="flex flex-wrap items-center gap-2 text-xs text-gray-500" aria-label="Breadcrumb"><button class="text-gray-400 hover:text-emerald-300" data-xem="cua-hang">Cửa hàng</button><span>/</span><span>Chăm sóc cây trồng</span><span>/</span><span class="text-gray-200">Cẩm nang bệnh cây</span></nav>
    <header class="flex flex-col justify-between gap-4 border-b border-[#3f493f]/60 pb-5 md:flex-row md:items-end"><div><span class="mb-2 inline-flex items-center gap-2 rounded border border-amber-700/40 bg-[#232c29] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-amber-300"><span class="material-symbols-outlined text-lg">psychiatry</span>Thư viện chăm sóc cây</span><h1 class="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Cẩm nang bệnh cây</h1><p class="mt-2 max-w-3xl text-sm leading-6 text-gray-400">Tra cứu nội dung hiện có và tải ảnh lên để xem trước trên thiết bị. Chẩn đoán tự động chưa được kết nối.</p></div><span class="inline-flex items-center gap-2 self-start rounded-full border border-amber-700/50 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 md:self-auto"><span class="h-2 w-2 rounded-full bg-amber-400"></span>Dịch vụ AI chưa khả dụng</span></header>
    <section class="grid items-start gap-5 lg:grid-cols-12" aria-label="Tải ảnh cây và hướng dẫn">
      <div class="flex flex-col gap-4 rounded-xl border border-[#3f493f] bg-[#141d1a] p-4 sm:p-5 lg:col-span-7"><div class="flex items-start justify-between gap-3 border-b border-[#3f493f]/60 pb-3"><div><h2 class="flex items-center gap-2 text-base font-bold text-white"><span class="material-symbols-outlined text-emerald-400">photo_camera</span>Ảnh cây trồng cần quan sát</h2><p class="mt-1 text-xs text-gray-400">Chọn ảnh rõ vùng lá hoặc thân cần xem.</p></div><span class="rounded border border-amber-800/50 bg-amber-950/30 px-2 py-1 text-[12px] font-mono font-semibold text-amber-300">AI: CHƯA KẾT NỐI</span></div>
        <div class="relative grid min-h-[300px] place-items-center overflow-hidden rounded-lg border border-dashed border-[#516258] bg-[#07100d] p-5 text-center" id="vungTaiAnh"><div class="w-full" id="noiDungTaiAnh"><span class="material-symbols-outlined mb-3 text-4xl text-emerald-400">add_a_photo</span><strong class="block text-base text-white">Chụp hoặc tải ảnh cây lên</strong><p class="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-400">JPG, PNG hoặc WEBP. Ảnh chỉ được xem trước trên thiết bị này và không gửi đi phân tích.</p><label class="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-600" for="tepAnhCay"><span class="material-symbols-outlined">upload</span>Chọn ảnh</label><input id="tepAnhCay" class="sr-only" type="file" accept="image/*" capture="environment" aria-label="Chọn hoặc chụp ảnh cây"></div></div>
        <p class="flex items-start gap-2 border-t border-[#3f493f]/50 pt-3 text-[13.2px] leading-5 text-gray-400"><span class="material-symbols-outlined text-base text-amber-300">info</span>Không thể xác định bệnh qua ảnh ở trang này. Nếu cần xử lý, hãy tham khảo chuyên gia và tuân thủ hướng dẫn trên nhãn sản phẩm.</p>
      </div>
      <aside class="flex flex-col gap-4 rounded-xl border border-[#3f493f] bg-[#141d1a] p-5 lg:col-span-5"><div><span class="text-[12px] font-bold uppercase tracking-wider text-emerald-400">HƯỚNG DẪN THAM KHẢO</span><h2 class="mt-2 text-xl font-bold text-white">Quan sát trước, chọn giải pháp sau.</h2><p class="mt-2 text-sm leading-6 text-gray-400">Ghi lại biểu hiện, môi trường và thời điểm xuất hiện để trao đổi với người có chuyên môn tại địa phương.</p></div><ol class="space-y-3">${[
        [
          "01",
          "Quan sát hai mặt lá",
          "Ghi nhận màu sắc, hình dạng và vị trí biểu hiện.",
        ],
        [
          "02",
          "Kiểm tra điều kiện chăm sóc",
          "Lưu ý cách tưới, ánh sáng, độ ẩm và thay đổi gần đây.",
        ],
        [
          "03",
          "Đối chiếu nguồn chuyên môn",
          "Không dùng ảnh xem trước này làm căn cứ chẩn đoán hoặc phun thuốc.",
        ],
      ]
        .map(
          ([so, ten, moTa]) =>
            `<li class="flex gap-3 rounded-lg border border-[#30453b] bg-[#101915] p-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-800/70 text-[12px] font-bold text-emerald-200">${so}</span><div><h3 class="text-xs font-bold text-gray-100">${ten}</h3><p class="mt-1 text-[13.2px] leading-5 text-gray-400">${moTa}</p></div></li>`,
        )
        .join("")}</ol></aside>
    </section>
    <section class="space-y-4"><div class="border-b border-[#3f493f]/60 pb-3"><h2 class="text-lg font-bold text-white">Thư viện cẩm nang tra cứu bệnh cây</h2><p class="mt-1 text-xs text-gray-400">Nội dung có trong hệ thống; không hiển thị kết quả chẩn đoán minh họa.</p></div>
      ${baiViet.length ? `<div class="grid gap-4 sm:grid-cols-2">${baiViet.map((bai) => `<article class="group grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-xl border border-[#3f493f] bg-[#141d1a] p-4 transition-colors hover:border-emerald-700">${bai.anh ? `<img class="h-[88px] w-[88px] rounded-lg border border-[#3f493f] object-cover" src="${thoatHTML(bai.anh)}" alt="" loading="lazy">` : `<span class="grid h-[88px] w-[88px] place-items-center rounded-lg border border-[#3f493f] bg-[#101915] text-emerald-400"><span class="material-symbols-outlined text-3xl">eco</span></span>`}<div><span class="text-[10.8px] font-bold uppercase tracking-wider text-emerald-400">${thoatHTML(bai.loai)}</span><h3 class="mt-1 text-sm font-bold text-white">${thoatHTML(bai.ten)}</h3><p class="mt-1 line-clamp-3 text-xs leading-5 text-gray-400">${thoatHTML(bai.moTa)}</p><button class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200" data-doc-bai="${thoatHTML(bai.ma)}">Xem nội dung ${taoIcon("arrow-right")}</button></div></article>`).join("")}</div>` : `<div class="rounded-xl border border-dashed border-[#3f493f] bg-[#141d1a] p-10 text-center text-sm text-gray-400"><strong class="block text-white">Chưa có bài viết</strong><span class="mt-1 block">Nội dung sẽ hiển thị tại đây khi được cung cấp.</span></div>`}
    </section>
  </div>`;
}

function nhanTrangThaiDonHang(maTrangThai) {
  const nhan = {
    cho_xac_nhan: "Chờ xác nhận",
    dang_xu_ly: "Đang xử lý",
    dang_giao: "Đang giao",
    hoan_thanh: "Hoàn thành",
    da_huy: "Đã hủy",
    da_hoan_hang: "Đã hoàn hàng",
  };
  return nhan[maTrangThai] || "Chưa cập nhật";
}

function nhanPhuongThucThanhToan(maPhuongThuc) {
  return {
    cod: "Thanh toán khi nhận hàng",
    bank_transfer: "Chuyển khoản thủ công",
  }[maPhuongThuc] || "Chưa có thông tin";
}

function nhanTrangThaiThanhToan(maTrangThai) {
  return {
    cho_thanh_toan: "Chờ thanh toán",
    da_thanh_toan: "Đã thanh toán",
    khong_can_thanh_toan: "Không cần thanh toán",
    cho_hoan_tien: "Chờ hoàn tiền",
    da_hoan_tien: "Đã hoàn tiền",
  }[maTrangThai] || "Chưa xác định";
}

// =============================================================================
// LUỒNG HIỂN THỊ DANH SÁCH ĐƠN HÀNG CỦA KHÁCH HÀNG (ORDER HISTORY VIEW)
// =============================================================================
function veDonHang() {
  // 1. Kiểm tra trạng thái phiên và phân quyền
  const laKhachHang = duLieuLuu.taiKhoan?.vaiTro === "khach_hang";
  const chuaDangNhap = duLieuLuu.taiKhoan === null;
  const danhSach = laKhachHang ? duLieuLuu.donHang : [];
  
  // 2. Tính toán các chỉ số thống kê đơn hàng của tài khoản
  const tongChiTieu = danhSach.reduce(
    (tong, don) => tong + Number(don.tong || 0),
    0,
  );
  const soHoanTat = danhSach.filter(
    (don) => don.trangThai === "hoan_thanh",
  ).length;
  const tongSanPham = danhSach.reduce(
    (tong, don) =>
      tong +
      (don.dongHang || []).reduce(
        (so, dong) => so + Number(dong.SlBan || 0),
        0,
      ),
    0,
  );
  
  // 3. Xử lý các trạng thái hiển thị: Chưa đăng nhập, Đang tải dữ liệu, Lỗi mạng hoặc Hiển thị danh sách thẻ đơn hàng
  const noiDungDonHang = !laKhachHang
    ? `<div class="flex flex-col items-center rounded-xl border border-dashed border-[#3f493f] bg-[#141d1a] px-5 py-12 text-center"><strong class="text-sm text-white">${chuaDangNhap ? "Đăng nhập bằng tài khoản khách hàng" : "Tài khoản hiện tại không có quyền xem lịch sử mua hàng khách hàng"}</strong><span class="mt-2 text-xs text-gray-400">Đơn hàng chỉ được hiển thị cho đúng tài khoản đã đặt.</span>${chuaDangNhap ? `<button class="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white" id="nutMoDangNhap">${taoIcon("log-in")} Đăng nhập</button>` : ""}</div>`
    : dangTaiDonHang
      ? `<div class="rounded-xl border border-[#3f493f] bg-[#141d1a] p-8 text-center text-sm text-gray-400">Đang tải đơn hàng từ hệ thống...</div>`
      : loiTaiDonHang
        ? `<div class="rounded-xl border border-red-900/50 bg-[#141d1a] p-8 text-center" role="alert"><p class="text-sm text-red-300">Không thể tải lịch sử đơn hàng.</p><button class="mt-3 text-xs font-semibold text-emerald-300" data-tai-don-hang>Tải lại</button></div>`
        : danhSach.length
          ? danhSach
              .map((don) => {
                const mauTrangThai = ["da_huy", "da_hoan_hang"].includes(
                  don.trangThai,
                )
                  ? "border-red-800 bg-red-950/50 text-red-300"
                  : don.trangThai === "hoan_thanh"
                    ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
                    : "border-amber-800 bg-amber-950/40 text-amber-300";
                const huongDan = don.thongTinChuyenKhoan;
                return `<article class="overflow-hidden rounded-xl border border-[#3f493f] bg-[#141d1a]"><header class="flex flex-wrap items-center justify-between gap-3 border-b border-[#3f493f]/70 bg-[#18211e] px-4 py-3"><div class="flex flex-wrap items-center gap-x-4 gap-y-1"><span class="text-xs font-bold text-white">Đơn hàng #${thoatHTML(don.MaHD)}</span><span class="text-[13.2px] text-gray-400">${thoatHTML(don.Ngaylap || "Chưa có ngày")}</span></div><span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold ${mauTrangThai}"><span class="h-1.5 w-1.5 rounded-full bg-current"></span>${nhanTrangThaiDonHang(don.trangThai)}</span></header><div class="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_220px]"><div class="divide-y divide-[#3f493f]/50">${(don.dongHang || []).map((dong) => `<div class="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"><span class="min-w-0 text-xs text-gray-200">${thoatHTML(dong.TenSP || dong.MaSP)} <small class="text-gray-500">× ${thoatHTML(dong.SlBan)}</small></span><strong class="shrink-0 text-xs text-gray-300">${dinhDangTien(dong.ThanhTien || dong.TongHD || 0)}</strong></div>`).join("")}</div><div class="flex flex-col justify-between gap-3 border-t border-[#3f493f]/60 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0"><div><span class="text-[12px] font-bold uppercase tracking-wider text-gray-500">Thanh toán</span><p class="mt-1 text-xs text-gray-300">${nhanPhuongThucThanhToan(don.phuongThuc)}</p><p class="mt-1 text-[12px] text-gray-400">${nhanTrangThaiThanhToan(don.trangThaiThanhToan)}</p>${don.diaChiGiao ? `<p class="mt-2 text-[12px] leading-4 text-gray-500">Nhận hàng: ${thoatHTML(don.diaChiGiao)}</p>` : ""}${huongDan ? `<div class="mt-3 rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-3 text-[12px] text-gray-300"><strong class="block text-emerald-300">Thông tin chuyển khoản</strong><span class="mt-1 block">${thoatHTML(huongDan.nganHang)} · ${thoatHTML(huongDan.soTaiKhoan)}</span><span class="block">${thoatHTML(huongDan.chuTaiKhoan)}</span><span class="mt-1 block">Nội dung: <strong>${thoatHTML(huongDan.noiDung)}</strong></span></div>` : ""}</div><div class="flex items-end justify-between gap-2"><span class="text-[12px] text-gray-400">Tổng tiền hàng</span><strong class="text-sm font-extrabold text-emerald-300">${dinhDangTien(don.tong)}</strong></div></div></div></article>`;
              })
              .join("")
          : `<div class="flex flex-col items-center rounded-xl border border-dashed border-[#3f493f] bg-[#141d1a] px-5 py-12 text-center"><span class="material-symbols-outlined text-4xl text-gray-500">package_2</span><strong class="mt-3 text-sm text-white">Bạn chưa có đơn hàng</strong><span class="mt-1 max-w-md text-xs leading-5 text-gray-400">Đơn hàng sẽ xuất hiện tại đây sau khi được tạo từ giỏ hàng.</span><button class="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#3f493f] px-4 text-xs font-semibold text-gray-200" data-xem="cua-hang">Tiếp tục mua sắm ${taoIcon("arrow-right")}</button></div>`;

  oNoiDung.innerHTML = `<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
    <nav class="flex items-center gap-2 text-xs text-gray-500" aria-label="Breadcrumb"><button class="text-gray-400 hover:text-emerald-300" data-xem="cua-hang">Cửa hàng</button><span>/</span><span class="text-gray-200">Đơn hàng của tôi</span></nav>
    <header class="flex flex-col justify-between gap-4 border-b border-[#3f493f]/60 pb-5 sm:flex-row sm:items-end"><div><span class="mb-2 inline-flex items-center gap-2 rounded border border-emerald-800/60 bg-[#18211e] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-emerald-300"><span class="material-symbols-outlined text-lg">receipt_long</span>Lịch sử mua sắm</span><h1 class="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Đơn hàng của tôi</h1><p class="mt-2 text-sm text-gray-400">${laKhachHang ? `Xin chào ${thoatHTML(duLieuLuu.taiKhoan.ten)} — đơn hàng được tải theo tài khoản này.` : "Đăng nhập để xem đơn hàng thuộc tài khoản của bạn."}</p></div>${laKhachHang ? `<div class="flex gap-2"><button class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#3f493f] px-3 text-xs font-semibold text-gray-300 hover:bg-[#232c29]" data-tai-don-hang>${taoIcon("refresh-cw")} Làm mới</button><button class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#3f493f] px-3 text-xs font-semibold text-gray-300 hover:bg-[#232c29]" data-xem="cua-hang">${taoIcon("arrow-left")} Tiếp tục mua sắm</button></div>` : ""}</header>
    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Tổng quan đơn hàng"><article class="flex items-center justify-between rounded-xl border border-[#3f493f] bg-[#141d1a] p-4"><div><span class="text-[12px] font-bold uppercase tracking-wider text-gray-400">Tổng đơn hàng</span><strong class="mt-1 block text-2xl font-extrabold text-white">${danhSach.length}</strong></div><span class="grid h-10 w-10 place-items-center rounded-lg bg-emerald-950 text-emerald-300"><span class="material-symbols-outlined">inventory_2</span></span></article><article class="flex items-center justify-between rounded-xl border border-[#3f493f] bg-[#141d1a] p-4"><div><span class="text-[12px] font-bold uppercase tracking-wider text-gray-400">Đã hoàn tất</span><strong class="mt-1 block text-2xl font-extrabold text-white">${soHoanTat}</strong></div><span class="grid h-10 w-10 place-items-center rounded-lg bg-emerald-950 text-emerald-300"><span class="material-symbols-outlined">task_alt</span></span></article><article class="flex items-center justify-between rounded-xl border border-[#3f493f] bg-[#141d1a] p-4"><div><span class="text-[12px] font-bold uppercase tracking-wider text-gray-400">Sản phẩm đã đặt</span><strong class="mt-1 block text-2xl font-extrabold text-white">${tongSanPham}</strong></div><span class="grid h-10 w-10 place-items-center rounded-lg bg-amber-950/60 text-amber-300"><span class="material-symbols-outlined">shopping_bag</span></span></article></section>
    <section class="space-y-4"><div class="flex flex-col justify-between gap-2 border-b border-[#3f493f]/60 pb-3 sm:flex-row sm:items-end"><div><h2 class="text-lg font-bold text-white">Lịch sử giao dịch</h2><p class="mt-1 text-xs text-gray-400">Đơn hàng và trạng thái thanh toán lấy trực tiếp từ hệ thống.</p></div><span class="text-xs text-gray-500">Tổng giá trị đơn hàng: <strong class="text-emerald-300">${dinhDangTien(tongChiTieu)}</strong></span></div>
      <div class="space-y-4">${noiDungDonHang}</div>
    </section>
  </div>`;
}

function veTaiKhoan() {
  const taiKhoan = duLieuLuu.taiKhoan;
  const vaiTro =
    taiKhoan?.vaiTro === "admin"
      ? "Quản trị viên"
      : taiKhoan?.vaiTro === "nhan_vien"
        ? "Nhân viên"
        : "Khách hàng";
  oNoiDung.innerHTML = `<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
    <nav class="flex items-center gap-2 text-xs text-gray-500" aria-label="Breadcrumb"><button class="text-gray-400 hover:text-emerald-300" data-xem="cua-hang">Cửa hàng</button><span>/</span><span class="text-gray-200">Tài khoản</span></nav>
    <header class="flex flex-col justify-between gap-4 border-b border-[#3f493f]/60 pb-5 sm:flex-row sm:items-end"><div><span class="mb-2 inline-flex items-center gap-2 rounded border border-emerald-800/60 bg-[#18211e] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-emerald-300"><span class="material-symbols-outlined text-lg">account_circle</span>Hồ sơ của bạn</span><h1 class="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Tài khoản</h1><p class="mt-2 text-sm text-gray-400">Thông tin hồ sơ và trạng thái phiên đăng nhập.</p></div>${taiKhoan ? `<button class="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-[#3f493f] px-3 text-xs font-semibold text-gray-300 hover:bg-[#232c29]" id="nutDangXuat">${taoIcon("log-out")} Đăng xuất</button>` : ""}</header>
    <section class="grid items-start gap-5 lg:grid-cols-12">
      <article class="overflow-hidden rounded-xl border border-[#3f493f] bg-[#141d1a] lg:col-span-8">
        <div class="flex flex-col gap-4 border-b border-[#3f493f]/60 bg-[#18211e] p-5 sm:flex-row sm:items-center">
          <div class="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-emerald-800/50 bg-emerald-950/60 text-emerald-300"><span class="material-symbols-outlined text-4xl">person</span></div>
          <div class="min-w-0">
            <span class="text-[12px] font-bold uppercase tracking-wider ${taiKhoan ? "text-emerald-300" : "text-amber-300"}">${taiKhoan ? "Tài khoản đang đăng nhập" : "Chưa đăng nhập"}</span>
            <h2 class="mt-1 truncate text-xl font-bold text-white">${taiKhoan ? thoatHTML(taiKhoan.ten) : "Đăng nhập để tiếp tục"}</h2>
            <p class="mt-1 text-xs text-gray-400">${taiKhoan ? `Vai trò: ${vaiTro}` : "Đăng nhập để xem đơn hàng gắn với tài khoản của bạn."}</p>
          </div>
        </div>
        <div class="divide-y divide-[#3f493f]/50 px-5">
          ${
            taiKhoan
              ? `
            <div class="flex flex-wrap items-center justify-between gap-2 py-4"><span class="text-xs text-gray-400">Tên tài khoản</span><strong class="text-xs text-gray-100">${thoatHTML(taiKhoan.tenTaiKhoan || "")}</strong></div>
            <div class="flex flex-wrap items-center justify-between gap-2 py-4"><span class="text-xs text-gray-400">Địa chỉ Gmail</span><span class="flex flex-wrap items-center gap-2"><strong class="text-xs text-gray-100">${thoatHTML(taiKhoan.email || "Chưa cập nhật")}</strong>${taiKhoan.email ? `<span class="inline-flex items-center gap-1 rounded-full border border-emerald-700/60 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">${taoIcon("badge-check")} Đã xác minh OTP</span>` : ""}</span></div>
            <div class="flex flex-wrap items-center justify-between gap-2 py-4"><span class="text-xs text-gray-400">Vai trò</span><strong class="text-xs text-gray-100">${vaiTro}</strong></div>
            <div class="flex flex-wrap items-center justify-between gap-2 py-4"><span class="text-xs text-gray-400">Mật khẩu</span><button class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#3f493f] bg-[#18211e] px-3 text-xs font-semibold text-emerald-300 hover:border-emerald-600 hover:bg-[#1d2b24]" type="button" data-mo-che-do-tai-khoan="doi-mat-khau">${taoIcon("key-round")} Đổi mật khẩu</button></div>
            <div class="flex flex-wrap items-center justify-between gap-2 py-4"><span class="text-xs text-gray-400">Phiên làm việc</span><strong class="inline-flex items-center gap-1.5 text-xs text-emerald-300"><span class="material-symbols-outlined text-base">verified_user</span>Đã xác thực</strong></div>
            <div class="flex flex-wrap gap-3 py-4">${taiKhoan.vaiTro === "khach_hang" ? `<button class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-600" data-xem="don-hang"><span class="material-symbols-outlined">receipt_long</span> Xem đơn hàng</button>` : `<button class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-600" data-xem="quan-tri"><span class="material-symbols-outlined">dashboard</span> Mở trang quản trị</button>`}</div>
          `
              : `
            <div class="flex flex-wrap gap-3 py-5">
              <button class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-600" id="nutMoDangNhap">${taoIcon("log-in")} Đăng nhập</button>
              <button class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#3f493f] px-4 text-xs font-semibold text-gray-200 hover:bg-[#232c29]" id="nutMoDangKy"><span class="material-symbols-outlined">person_add</span> Tạo tài khoản</button>
            </div>
          `
          }
        </div>
      </article>
      <aside class="flex flex-col gap-3 rounded-xl border border-[#3f493f] bg-[#141d1a] p-5 lg:col-span-4">
        <span class="grid h-10 w-10 place-items-center rounded-lg bg-emerald-950 text-emerald-300"><span class="material-symbols-outlined">shield_lock</span></span>
        <h2 class="text-base font-bold text-white">Bảo mật tài khoản</h2>
        <p class="text-xs leading-5 text-gray-400">Phiên đăng nhập được kiểm tra bởi máy chủ. Không chia sẻ mật khẩu hoặc mã xác thực với người khác.</p>
        ${taiKhoan ? `<button class="mt-1 inline-flex min-h-10 items-center justify-between gap-2 border-t border-[#3f493f]/60 pt-3 text-left text-xs font-semibold text-emerald-300 hover:text-emerald-200" type="button" data-mo-che-do-tai-khoan="doi-mat-khau">Đổi mật khẩu định kỳ ${taoIcon("arrow-right")}</button>` : ""}
      </aside>
    </section>
  </div>`;
}

function veQuanTri() {
  if (!["nhan_vien", "admin"].includes(duLieuLuu.taiKhoan?.vaiTro)) {
    return chuyenTrang("cua-hang");
  }
  const laAdmin = duLieuLuu.taiKhoan.vaiTro === "admin";
  const quyenSP = {
    coThem: coQuyenUI("san_pham.them"),
    coSua: coQuyenUI("san_pham.sua"),
    coAn: coQuyenUI("san_pham.an"),
    coXoa: coQuyenUI("san_pham.xoa"),
    coKhoiPhuc: coQuyenUI("san_pham.khoi_phuc"),
  };
  const coXemTaiKhoan = coQuyenUI("tai_khoan.xem");
  const coXemNhatKy = coQuyenUI("nhat_ky.xem");
  if (tabQuanTri === "nguoi-dung" && !coXemTaiKhoan) tabQuanTri = "tong-quan";
  if (tabQuanTri === "nhat-ky" && !coXemNhatKy) tabQuanTri = "tong-quan";
  const sapHetHang = duLieuLuu.sanPham.filter(
    (sanPham) => Number(sanPham.Soluong) <= 5,
  );
  const tongSoLuongTon = duLieuLuu.sanPham.reduce(
    (tong, sanPham) => tong + Number(sanPham.Soluong || 0),
    0,
  );
  const giaTriTonGiaBan = duLieuLuu.sanPham.reduce(
    (tong, sanPham) =>
      tong + Number(sanPham.Giaban || 0) * Number(sanPham.Soluong || 0),
    0,
  );
  const taiKhoanTheoVaiTro = (vaiTro) =>
    duLieuQuanTri.taiKhoan.filter((taiKhoan) => taiKhoan.VaiTro === vaiTro)
      .length;
  const donChoXuLy = duLieuQuanTri.donHang.filter((don) =>
    ["cho_xac_nhan", "dang_xu_ly"].includes(don.trangThai),
  ).length;
  const donDangGiao = duLieuQuanTri.donHang.filter(
    (don) => don.trangThai === "dang_giao",
  ).length;
  const donHoanTat = duLieuQuanTri.donHang.filter(
    (don) => don.trangThai === "hoan_thanh",
  ).length;
  const donDaHuy = duLieuQuanTri.donHang.filter((don) =>
    ["da_huy", "da_hoan_hang"].includes(don.trangThai),
  ).length;
  const cacTab = [
    ["tong-quan", "Tổng quan", "dashboard"],
    ["san-pham", "Sản phẩm & tồn kho", "inventory_2"],
    ["don-hang", "Đơn hàng & Hóa đơn", "receipt_long"],
    ...(coXemTaiKhoan
      ? [["nguoi-dung", "Tài khoản & Phân quyền", "manage_accounts"]]
      : []),
    ["benh-cay", "Dữ liệu bệnh cây & AI", "psychiatry"],
    ...(coXemNhatKy ? [["nhat-ky", "Nhật ký hoạt động", "history"]] : []),
  ];
  const [tieuDeTab, moTaTab] = {
    "tong-quan": [
      "Quản trị cửa hàng",
      "Hệ sinh thái đồng bộ sản phẩm, tồn kho, hóa đơn khách hàng và tài nguyên cây trồng.",
    ],
    "san-pham": [
      "Sản phẩm & tồn kho",
      "Quản lý danh mục và tồn kho từ dữ liệu sản phẩm trong hệ thống.",
    ],
    "don-hang": [
      "Đơn hàng & Hóa đơn",
      "Tra cứu hóa đơn và trạng thái đơn hàng hiện có.",
    ],
    "nguoi-dung": [
      "Tài khoản & Phân quyền",
      "Danh sách tài khoản và vai trò được lưu trong hệ thống.",
    ],
    "benh-cay": [
      "Dữ liệu bệnh cây & AI",
      "Thư viện tham khảo hiện có; dịch vụ chẩn đoán chưa được kết nối.",
    ],
    "nhat-ky": [
      "Nhật ký hoạt động",
      "Các thao tác gần đây của nhân viên và quản trị viên.",
    ],
  }[tabQuanTri] || [
    "Quản trị cửa hàng",
    "Theo dõi dữ liệu cửa hàng từ hệ thống.",
  ];
  const materialIcon = (ten, lop = "text-base") =>
    `<span class="material-symbols-outlined ${lop}" aria-hidden="true">${ten}</span>`;
  const tabButton = ([ma, ten, icon]) =>
    `<button class="st-admin-tab flex shrink-0 items-center gap-2 border-b-2 pb-3 text-xs font-semibold transition-all sm:text-sm" role="tab" aria-selected="${tabQuanTri === ma}" data-tab-quan-tri="${ma}">${materialIcon(icon, "text-base")}<span>${ten}</span>${ma === "san-pham" ? `<span class="rounded-full border border-emerald-800 bg-emerald-950 px-1.5 py-0.5 text-[12px] text-emerald-300">${dangTaiSanPham ? "—" : duLieuLuu.sanPham.length}</span>` : ma === "don-hang" ? `<span class="rounded-full border border-amber-800 bg-amber-950 px-1.5 py-0.5 text-[12px] text-amber-300">${dangTaiDuLieuQuanTri ? "—" : duLieuQuanTri.donHang.length}</span>` : ma === "nguoi-dung" ? `<span class="rounded-full border border-emerald-800 bg-emerald-950 px-1.5 py-0.5 text-[12px] text-emerald-300">${dangTaiDuLieuQuanTri ? "—" : duLieuQuanTri.taiKhoan.length}</span>` : ""}</button>`;
  let noiDungTab = "";
  if (tabQuanTri === "tong-quan")
    noiDungTab = `<section class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4" aria-label="Chỉ số cửa hàng">
    <article class="group relative overflow-hidden rounded-xl border border-[#213831] bg-[#14201c] p-5"><div class="mb-2 flex items-center justify-between text-gray-400"><span class="text-xs font-semibold uppercase tracking-wider">Sản phẩm</span><span class="grid h-8 w-8 place-items-center rounded-lg border border-emerald-800/60 bg-emerald-950/80 text-emerald-400">${materialIcon("inventory_2")}</span></div><strong class="text-3xl font-extrabold tracking-tight text-white">${dangTaiSanPham ? "—" : duLieuLuu.sanPham.length}</strong><div class="mt-3 flex justify-between border-t border-[#1b2b25] pt-3 text-xs text-gray-400"><span>${dangTaiSanPham ? "Đang tải" : "Danh mục hiện có"}</span><button class="font-semibold text-emerald-400 hover:text-emerald-300" data-tab-quan-tri="san-pham">Mở kho →</button></div></article>
    <article class="group relative overflow-hidden rounded-xl border border-[#213831] bg-[#14201c] p-5"><div class="mb-2 flex items-center justify-between text-gray-400"><span class="text-xs font-semibold uppercase tracking-wider">Tồn kho</span><span class="grid h-8 w-8 place-items-center rounded-lg border border-emerald-800/60 bg-emerald-950/80 text-emerald-400">${materialIcon("warehouse")}</span></div><strong class="text-3xl font-extrabold tracking-tight text-white">${dangTaiSanPham ? "—" : tongSoLuongTon.toLocaleString("vi-VN")}</strong><div class="mt-3 border-t border-[#1b2b25] pt-3 text-xs text-gray-400">Tổng số lượng theo đơn vị mặt hàng</div></article>
    <article class="group relative overflow-hidden rounded-xl border border-[#213831] bg-[#14201c] p-5"><div class="mb-2 flex items-center justify-between text-gray-400"><span class="text-xs font-semibold uppercase tracking-wider">Hóa đơn</span><span class="grid h-8 w-8 place-items-center rounded-lg border border-emerald-800/60 bg-emerald-950/80 text-emerald-400">${materialIcon("receipt_long")}</span></div><strong class="text-3xl font-extrabold tracking-tight text-white">${dangTaiDuLieuQuanTri ? "—" : duLieuQuanTri.donHang.length}</strong><div class="mt-3 flex justify-between border-t border-[#1b2b25] pt-3 text-xs text-gray-400"><span>${dangTaiDuLieuQuanTri ? "Đang tải" : "Đã ghi nhận"}</span><button class="font-semibold text-emerald-400 hover:text-emerald-300" data-tab-quan-tri="don-hang">Quản lý →</button></div></article>
    <article class="group relative overflow-hidden rounded-xl border border-amber-700/50 bg-[#14201c] p-5"><div class="mb-2 flex items-center justify-between text-amber-300"><span class="text-xs font-semibold uppercase tracking-wider">Cảnh báo tồn thấp</span><span class="grid h-8 w-8 place-items-center rounded-lg border border-amber-800/60 bg-amber-950/60">${materialIcon("warning")}</span></div><strong class="text-3xl font-extrabold tracking-tight text-white">${dangTaiSanPham ? "—" : sapHetHang.length}</strong><div class="mt-3 border-t border-[#342b1d] pt-3 text-xs text-gray-400">Ngưỡng theo dõi: còn tối đa 5 đơn vị</div></article>
  </section>
  <section class="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,.8fr)]">
    <div class="overflow-hidden rounded-xl border border-[#213831] bg-[#14201c]"><div class="flex flex-col justify-between gap-3 border-b border-[#1f332c] p-5 sm:flex-row sm:items-center"><div><h2 class="flex items-center gap-2 text-base font-bold text-white">${materialIcon("receipt_long", "text-emerald-400")} Hóa đơn mới nhất</h2><p class="mt-1 text-xs text-gray-400">Dữ liệu hóa đơn được tải từ hệ thống.</p></div><button class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300" data-tab-quan-tri="don-hang">Quản lý hóa đơn ${materialIcon("arrow_forward")}</button></div>${loiTaiDuLieuQuanTri ? `<p class="p-5 text-sm text-red-300" role="alert">Không thể tải hóa đơn từ hệ thống.</p>` : dangTaiDuLieuQuanTri ? `<div class="p-8 text-center text-sm text-gray-400">Đang tải hóa đơn...</div>` : veBangDonHang(duLieuQuanTri.donHang.slice(0, 5))}</div>
    <aside class="flex flex-col justify-between rounded-xl border border-[#213831] bg-[#14201c] p-5"><div><div class="mb-3 flex items-center justify-between"><h2 class="flex items-center gap-2 text-sm font-bold text-white">${materialIcon("inventory_2", "text-emerald-400")} Cảnh báo kho hàng</h2><span class="rounded border border-amber-800/40 bg-amber-950/60 px-2 py-0.5 text-[12px] font-mono uppercase text-amber-300">${sapHetHang.length ? "Cần kiểm tra" : "Ổn định"}</span></div><p class="mb-4 text-xs text-gray-400">Các mặt hàng đạt ngưỡng số lượng tồn kho thấp.</p>${
      dangTaiSanPham
        ? `<p class="text-sm text-gray-400">Đang tải dữ liệu kho...</p>`
        : sapHetHang.length
          ? `<ul class="space-y-3">${sapHetHang
              .slice(0, 5)
              .map(
                (sp) =>
                  `<li class="flex items-center justify-between gap-3 rounded-lg border border-[#253d34] bg-[#192823] p-2.5 text-xs"><span class="min-w-0 truncate text-gray-200">${thoatHTML(sp.TenSP)}</span><strong class="shrink-0 font-mono ${Number(sp.Soluong) === 0 ? "text-red-300" : "text-amber-300"}">${Number(sp.Soluong) === 0 ? "Hết hàng" : `Còn ${thoatHTML(sp.Soluong)} ${thoatHTML(sp.DviTinh)}`}</strong></li>`,
              )
              .join("")}</ul>`
          : `<div class="rounded-lg border border-[#253d34] bg-[#192823] p-4 text-center text-xs text-gray-300">Không có sản phẩm nào dưới ngưỡng tồn kho.</div>`
    }</div><button class="mt-4 block w-full rounded-lg border border-emerald-800/40 bg-[#1c2e27] py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-[#233a32]" data-tab-quan-tri="san-pham">Xem tồn kho</button></aside>
  </section>`;
  if (tabQuanTri === "san-pham")
    noiDungTab = `<section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <article class="rounded-xl border border-[#213831] bg-[#14201c] p-4">${materialIcon("inventory_2", "text-emerald-400")}<p class="mt-3 text-[13.2px] text-gray-400">Tổng mặt hàng</p><strong class="text-2xl font-extrabold text-white">${dangTaiSanPham ? "—" : duLieuLuu.sanPham.length}</strong></article>
      <article class="rounded-xl border border-amber-800/50 bg-[#14201c] p-4">${materialIcon("warning", "text-amber-300")}<p class="mt-3 text-[13.2px] text-gray-400">Tồn kho thấp</p><strong class="text-2xl font-extrabold text-white">${dangTaiSanPham ? "—" : sapHetHang.length}</strong></article>
      <article class="rounded-xl border border-[#213831] bg-[#14201c] p-4">${materialIcon("task_alt", "text-emerald-400")}<p class="mt-3 text-[13.2px] text-gray-400">Còn hàng</p><strong class="text-2xl font-extrabold text-white">${dangTaiSanPham ? "—" : duLieuLuu.sanPham.filter((sp) => Number(sp.Soluong) > 5).length}</strong></article>
      <article class="rounded-xl border border-[#213831] bg-[#14201c] p-4">${materialIcon("payments", "text-amber-300")}<p class="mt-3 text-[13.2px] text-gray-400">Giá bán ước tính tồn kho</p><strong class="text-lg font-extrabold text-white">${dangTaiSanPham ? "—" : dinhDangTien(giaTriTonGiaBan)}</strong><small class="block text-[12px] text-gray-500">Không phải giá vốn nhập kho</small></article>
    </section>
    <section class="overflow-hidden rounded-xl border border-[#213831] bg-[#14201c]"><div class="flex flex-col justify-between gap-3 border-b border-[#1f332c] p-5 sm:flex-row sm:items-center"><div><h2 class="flex items-center gap-2 text-base font-bold text-white">${materialIcon("inventory_2", "text-emerald-400")} Sản phẩm &amp; tồn kho</h2><p class="mt-1 text-xs text-gray-400">Theo dõi số lượng, giá bán và nhà cung cấp.</p></div><span class="text-xs text-gray-500">${dangTaiSanPham ? "Đang đồng bộ..." : `${duLieuLuu.sanPham.length} mặt hàng`}</span></div>
      ${veBoLocKho()}${dangTaiSanPham ? `<div class="st-empty">${taoIcon("loader-circle")}<strong>Đang tải kho hàng</strong><span>Đang đọc danh mục từ hệ thống.</span></div>` : loiTaiSanPham ? `<div class="st-empty" role="alert">${taoIcon("triangle-alert")}<strong>Không thể tải sản phẩm</strong><span>Kiểm tra kết nối và thử tải lại.</span><button class="nut-phu" data-lam-moi-san-pham>${taoIcon("refresh-cw")} Thử lại</button></div>` : veBangSanPham(quyenSP.coSua || quyenSP.coAn || quyenSP.coXoa || quyenSP.coKhoiPhuc, quyenSP)}
    </section>`;
  if (tabQuanTri === "don-hang")
    noiDungTab = `<section class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <article class="rounded-xl border border-amber-700/50 bg-[#14201c] p-4"><span class="text-[13.2px] font-bold text-amber-300">Chờ xử lý</span><strong class="mt-2 block text-3xl font-extrabold text-white">${dangTaiDuLieuQuanTri ? "—" : donChoXuLy}</strong><small class="text-[13.2px] text-gray-400">Cần kiểm tra</small></article>
      <article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Đang giao</span><strong class="mt-2 block text-3xl font-extrabold text-white">${dangTaiDuLieuQuanTri ? "—" : donDangGiao}</strong><small class="text-[13.2px] text-gray-400">Hóa đơn</small></article>
      <article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Hoàn tất</span><strong class="mt-2 block text-3xl font-extrabold text-white">${dangTaiDuLieuQuanTri ? "—" : donHoanTat}</strong><small class="text-[13.2px] text-gray-400">Hóa đơn</small></article>
      <article class="rounded-xl border border-red-900/50 bg-[#14201c] p-4"><span class="text-[13.2px] text-red-300">Hủy / hoàn trả</span><strong class="mt-2 block text-3xl font-extrabold text-white">${dangTaiDuLieuQuanTri ? "—" : donDaHuy}</strong><small class="text-[13.2px] text-gray-400">Hóa đơn</small></article>
      <article class="col-span-2 rounded-xl border border-[#213831] bg-[#14201c] p-4 sm:col-span-1"><span class="text-[13.2px] text-gray-400">Tổng hóa đơn</span><strong class="mt-2 block text-3xl font-extrabold text-white">${dangTaiDuLieuQuanTri ? "—" : duLieuQuanTri.donHang.length}</strong><small class="text-[13.2px] text-gray-400">Trong hệ thống</small></article>
    </section>
    <section class="overflow-hidden rounded-xl border border-[#213831] bg-[#14201c]"><div class="border-b border-[#1f332c] p-5"><h2 class="text-base font-bold text-white">Quản lý đơn hàng &amp; Hóa đơn</h2><p class="mt-1 text-xs text-gray-400">Tra cứu hóa đơn đã được hệ thống ghi nhận.</p></div>
      <div class="grid gap-3 border-b border-[#1f332c] bg-[#101915] p-4 sm:grid-cols-[minmax(220px,1fr)_minmax(170px,.4fr)]"><label class="relative block"><span class="sr-only">Tìm hóa đơn</span><span class="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-base text-gray-500">search</span><input id="timHoaDonQuanTri" class="w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 pl-9 text-xs text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" type="search" value="${thoatHTML(tuKhoaHoaDon)}" placeholder="Tìm mã hóa đơn, khách hàng..." aria-label="Tìm hóa đơn"></label><label class="text-[12px] font-semibold text-gray-400">Trạng thái<select class="mt-1.5 w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 text-xs text-gray-200 focus:border-emerald-500 focus:outline-none" id="locTrangThaiHoaDon"><option value="">Tất cả (${duLieuQuanTri.donHang.length})</option>${[...new Set(duLieuQuanTri.donHang.map((d) => d.trangThai).filter(Boolean))].map((trangThai) => `<option value="${thoatHTML(trangThai)}" ${locTrangThaiHoaDon === trangThai ? "selected" : ""}>${nhanTrangThaiDonHang(trangThai)} (${duLieuQuanTri.donHang.filter((d) => d.trangThai === trangThai).length})</option>`).join("")}</select></label></div>
      ${loiTaiDuLieuQuanTri ? `<p role="alert">Không thể tải hóa đơn từ MySQL. Kiểm tra API quản trị và cấu hình database.</p>` : dangTaiDuLieuQuanTri ? `<div class="st-empty">${taoIcon("loader-circle")}<strong>Đang tải hóa đơn</strong></div>` : veBangDonHang(duLieuQuanTri.donHang, duLieuLuu.taiKhoan?.vaiTro === "admin")}
    </section>`;
  if (tabQuanTri === "nguoi-dung")
    noiDungTab = `<section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Tổng tài khoản</span><strong class="mt-2 block text-3xl font-extrabold text-white">${dangTaiDuLieuQuanTri ? "—" : duLieuQuanTri.taiKhoan.length}</strong></article>
      <article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Quản trị viên</span><strong class="mt-2 block text-3xl font-extrabold text-white">${dangTaiDuLieuQuanTri ? "—" : taiKhoanTheoVaiTro("admin")}</strong></article>
      <article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Nhân viên</span><strong class="mt-2 block text-3xl font-extrabold text-white">${dangTaiDuLieuQuanTri ? "—" : taiKhoanTheoVaiTro("nhan_vien")}</strong></article>
      <article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Khách hàng</span><strong class="mt-2 block text-3xl font-extrabold text-white">${dangTaiDuLieuQuanTri ? "—" : taiKhoanTheoVaiTro("khach_hang")}</strong></article>
    </section>
    <section class="overflow-hidden rounded-xl border border-[#213831] bg-[#14201c]"><div class="border-b border-[#1f332c] p-5"><h2 class="text-base font-bold text-white">Tài khoản &amp; Phân quyền</h2><p class="mt-1 text-xs text-gray-400">Chỉ quản trị viên được tạo tài khoản, đổi vai trò và khóa/mở khóa. Không thể tự khóa hoặc tự đổi vai trò của chính mình.</p><form id="formTaoNhanVien" class="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"><input name="tenTaiKhoan" required minlength="3" maxlength="32" autocomplete="off" placeholder="Tên đăng nhập nhân viên" class="rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 text-xs text-gray-200 placeholder-gray-500"><input name="email" type="email" autocomplete="off" placeholder="Email (không bắt buộc)" class="rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 text-xs text-gray-200 placeholder-gray-500"><input name="matKhau" type="password" required minlength="12" autocomplete="new-password" placeholder="Mật khẩu (≥ 12 ký tự)" class="rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 text-xs text-gray-200 placeholder-gray-500"><button class="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600" type="submit">Tạo nhân viên</button></form></div>
      <div class="grid gap-3 border-b border-[#1f332c] bg-[#101915] p-4 sm:grid-cols-[minmax(220px,1fr)_minmax(170px,.4fr)]"><label class="relative block"><span class="sr-only">Tìm tài khoản</span><span class="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-base text-gray-500">search</span><input id="timTaiKhoanQuanTri" class="w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 pl-9 text-xs text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" type="search" value="${thoatHTML(tuKhoaTaiKhoan)}" placeholder="Tìm mã hoặc tên tài khoản..." aria-label="Tìm tài khoản"></label><label class="text-[12px] font-semibold text-gray-400">Vai trò<select class="mt-1.5 w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 text-xs text-gray-200 focus:border-emerald-500 focus:outline-none" id="locVaiTroTaiKhoan"><option value="">Tất cả vai trò</option><option value="admin" ${locVaiTroTaiKhoan === "admin" ? "selected" : ""}>Quản trị viên</option><option value="nhan_vien" ${locVaiTroTaiKhoan === "nhan_vien" ? "selected" : ""}>Nhân viên</option><option value="khach_hang" ${locVaiTroTaiKhoan === "khach_hang" ? "selected" : ""}>Khách hàng</option></select></label></div>
      ${loiTaiDuLieuQuanTri ? `<p role="alert">Không thể tải tài khoản từ MySQL. Kiểm tra API quản trị và cấu hình database.</p>` : veBangNguoiDung()}
    </section>`;
  if (tabQuanTri === "nhat-ky") noiDungTab = veNhatKy();
  if (tabQuanTri === "benh-cay")
    noiDungTab = `<section class="rounded-xl border border-amber-800/50 bg-[#14201c] p-5 sm:p-6"><div class="flex flex-col gap-4 sm:flex-row sm:items-center"><span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-amber-700/40 bg-amber-950/50 text-amber-300">${materialIcon("psychiatry", "text-2xl")}</span><div><span class="text-[12px] font-bold uppercase tracking-[.15em] text-amber-300">TRẠNG THÁI DỊCH VỤ</span><h2 class="mt-1 text-lg font-bold text-white">Chưa kết nối dịch vụ chẩn đoán AI</h2><p class="mt-1 max-w-3xl text-sm text-gray-400">Ứng dụng hiện chưa có API lưu dữ liệu bệnh cây, dataset huấn luyện hoặc chẩn đoán ảnh. Chỉ hiển thị nội dung thực có trong hệ thống.</p></div><span class="sm:ml-auto rounded-full border border-amber-700/50 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-300">Chưa khả dụng</span></div></section>
    <section class="grid grid-cols-2 gap-3 sm:grid-cols-4"><article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Bài tham khảo phiên này</span><strong class="mt-2 block text-2xl font-extrabold text-white">${duLieuLuu.benhCay.length}</strong></article><article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Dataset ảnh</span><strong class="mt-2 block text-base font-bold text-amber-300">Chưa kết nối</strong></article><article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Mô hình AI</span><strong class="mt-2 block text-base font-bold text-amber-300">Chưa kết nối</strong></article><article class="rounded-xl border border-[#213831] bg-[#14201c] p-4"><span class="text-[13.2px] text-gray-400">Sản phẩm liên kết</span><strong class="mt-2 block text-base font-bold text-gray-300">Chưa có dữ liệu</strong></article></section>
    <section class="overflow-hidden rounded-xl border border-[#213831] bg-[#14201c]"><div class="border-b border-[#1f332c] p-5"><h2 class="text-base font-bold text-white">Thư viện bệnh cây</h2><p class="mt-1 text-xs text-gray-400">Hiển thị nội dung đang có, không dùng dữ liệu minh họa.</p></div><div class="p-5">${veBangBenh()}<p class="mt-4 flex gap-2 border-t border-[#1b2b25] pt-4 text-xs leading-5 text-gray-400">${materialIcon("info", "text-amber-300")}Việc thêm hoặc chỉnh sửa dữ liệu cần API lưu trữ riêng.</p></div></section>`;
  oNoiDung.innerHTML = `<div class="st-admin-root st-admin-page mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
    <div class="flex flex-col justify-between gap-4 border-b border-[#1d2f29] pb-5 md:flex-row md:items-end"><div><nav class="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400" aria-label="Đường dẫn"><a class="text-gray-400 no-underline hover:text-emerald-400" href="../index.html">Không gian cửa hàng</a><span>/</span><span class="text-emerald-400">Quản trị</span></nav><h1 class="flex flex-wrap items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">${thoatHTML(tieuDeTab)}<span class="rounded-full border border-emerald-800/80 bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-400">${laAdmin ? "Admin Workspace" : "Staff Workspace"}</span></h1><p class="mt-1 text-xs text-gray-400 sm:text-sm">${thoatHTML(moTaTab)}</p></div><div class="flex flex-wrap gap-2">${tabQuanTri === "san-pham" && quyenSP.coThem ? `<button class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-xs font-bold text-gray-950 shadow-md shadow-amber-500/20 transition-all hover:from-amber-500 hover:to-amber-600" id="nutThemSanPham" type="button">${materialIcon("add")}Thêm sản phẩm mới</button>` : `<a href="../index.html" class="flex items-center gap-2 rounded-lg border border-[#223932] bg-[#162420] px-3.5 py-2 text-xs font-semibold text-gray-200 no-underline hover:bg-[#1e332d]">${materialIcon("storefront")} Về cửa hàng</a>`}</div></div>
    <nav class="st-admin-tabs flex min-w-0 flex-wrap justify-center gap-x-6 border-b border-[#1d2f29]" role="tablist" aria-label="Các khu vực quản trị">${cacTab.map(tabButton).join("")}</nav>
    <section class="flex flex-col gap-6">${noiDungTab}</section>
  </div>`;
  document
    .querySelectorAll("header [data-tab-quan-tri], #noi-dung .st-admin-tab")
    .forEach((nut) => {
      const dangChon = nut.dataset.tabQuanTri === tabQuanTri;
      nut.setAttribute("aria-current", dangChon ? "page" : "false");
      if (nut.classList.contains("st-admin-tab")) {
        nut.classList.toggle("dang-chon", dangChon);
        nut.setAttribute("aria-selected", dangChon ? "true" : "false");
      } else {
        nut.classList.toggle("bg-emerald-900/40", dangChon);
        nut.classList.toggle("text-emerald-300", dangChon);
        nut.classList.toggle("font-semibold", dangChon);
        nut.classList.toggle("text-gray-300", !dangChon);
      }
    });
  if (oHopSanPham && maSanPhamDangSua !== null) {
    document.getElementById("noiDungHopSanPham").innerHTML = veFormSanPham();
    oHopSanPham.showModal();
  }
  apDungBoLocQuanTri();
  veIcon();
}

function veBoLocKho() {
  const danhMuc = [
    ...new Set(
      duLieuLuu.sanPham.map((sanPham) => sanPham.DanhMuc).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "vi"));
  const nhanInput =
    "w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const nhanSelect =
    "w-full rounded-lg border border-[#30453b] bg-[#0f1915] px-3 py-2 text-xs text-gray-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  return `<div class="grid gap-3 border-b border-[#1f332c] bg-[#101915] p-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(135px,.7fr))_auto]">
    <label class="relative block"><span class="sr-only">Tìm trong kho</span><span class="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-base text-gray-500">search</span><input id="timKhoQuanTri" class="${nhanInput} pl-9" type="search" value="${thoatHTML(tuKhoaKho)}" placeholder="Lọc tên, SKU, nhà cung cấp..." aria-label="Tìm trong kho"></label>
    <label class="text-[12px] font-semibold text-gray-400">Danh mục<select class="${nhanSelect} mt-1.5" id="locDanhMucKho"><option value="">Tất cả danh mục</option>${danhMuc.map((ten) => `<option value="${thoatHTML(ten)}" ${locDanhMucKho === ten ? "selected" : ""}>${thoatHTML(ten)}</option>`).join("")}</select></label>
    <label class="text-[12px] font-semibold text-gray-400">Tồn kho<select class="${nhanSelect} mt-1.5" id="locTonKho"><option value="">Tất cả trạng thái</option><option value="het-hang" ${locTonKho === "het-hang" ? "selected" : ""}>Hết hàng</option><option value="ton-thap" ${locTonKho === "ton-thap" ? "selected" : ""}>Tồn thấp (1–5)</option><option value="con-hang" ${locTonKho === "con-hang" ? "selected" : ""}>Còn hàng (&gt; 5)</option></select></label>
    <label class="text-[12px] font-semibold text-gray-400">Sắp xếp<select class="${nhanSelect} mt-1.5" id="sapXepKho"><option value="mac-dinh" ${sapXepKho === "mac-dinh" ? "selected" : ""}>Mặc định</option><option value="ton-cao" ${sapXepKho === "ton-cao" ? "selected" : ""}>Tồn kho nhiều nhất</option><option value="ton-thap" ${sapXepKho === "ton-thap" ? "selected" : ""}>Tồn kho ít nhất</option><option value="gia-cao" ${sapXepKho === "gia-cao" ? "selected" : ""}>Giá bán cao nhất</option><option value="ten-a-z" ${sapXepKho === "ten-a-z" ? "selected" : ""}>Tên A–Z</option></select></label>
    <button class="flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#30453b] bg-[#162420] px-3 text-xs font-semibold text-gray-200 transition-colors hover:border-emerald-700 hover:text-emerald-300" type="button" data-lam-moi-san-pham aria-label="Tải lại dữ liệu sản phẩm"><span class="material-symbols-outlined text-base">refresh</span>Tải lại</button>
    <span class="text-[13.2px] text-gray-500 md:col-span-2 xl:col-span-full" id="ketQuaLocKho"></span>
  </div>`;
}

function chuanHoaTimQuanTri(giaTri) {
  return String(giaTri ?? "")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function apDungBoLocQuanTri() {
  const cacBang = [
    {
      selector: ".st-inventory-row",
      ketQua: "ketQuaLocKho",
      tuKhoa: tuKhoaKho,
      danhMuc: locDanhMucKho,
      tonKho: locTonKho,
      sapXep: sapXepKho,
    },
    {
      selector: ".st-order-row",
      ketQua: "ketQuaLocHoaDon",
      tuKhoa: tuKhoaHoaDon,
      trangThai: locTrangThaiHoaDon,
    },
    {
      selector: ".st-account-row-item",
      ketQua: "ketQuaLocTaiKhoan",
      tuKhoa: tuKhoaTaiKhoan,
      vaiTro: locVaiTroTaiKhoan,
    },
  ];
  cacBang.forEach((cauHinh) => {
    const cacHang = [...document.querySelectorAll(cauHinh.selector)];
    if (!cacHang.length) return;
    let dangHien = 0;
    cacHang.forEach((hang) => {
      const khopTuKhoa =
        !cauHinh.tuKhoa ||
        chuanHoaTimQuanTri(hang.dataset.search).includes(
          chuanHoaTimQuanTri(cauHinh.tuKhoa),
        );
      const khopDanhMuc =
        !cauHinh.danhMuc ||
        chuanHoaTimQuanTri(hang.dataset.category) ===
          chuanHoaTimQuanTri(cauHinh.danhMuc);
      const khopTonKho =
        !cauHinh.tonKho || hang.dataset.stockStatus === cauHinh.tonKho;
      const khopTrangThai =
        !cauHinh.trangThai ||
        chuanHoaTimQuanTri(hang.dataset.status) ===
          chuanHoaTimQuanTri(cauHinh.trangThai);
      const khopVaiTro =
        !cauHinh.vaiTro || hang.dataset.role === cauHinh.vaiTro;
      hang.hidden = !(
        khopTuKhoa &&
        khopDanhMuc &&
        khopTonKho &&
        khopTrangThai &&
        khopVaiTro
      );
      if (!hang.hidden) dangHien++;
    });
    if (cauHinh.sapXep) {
      const tbody = cacHang[0].parentElement;
      const heSo =
        cauHinh.sapXep === "ton-thap" || cauHinh.sapXep === "gia-cao" ? -1 : 1;
      const sapXep = [...cacHang].sort((a, b) => {
        if (cauHinh.sapXep === "ton-cao" || cauHinh.sapXep === "ton-thap")
          return (Number(a.dataset.stock) - Number(b.dataset.stock)) * heSo;
        if (cauHinh.sapXep === "gia-cao")
          return (Number(a.dataset.price) - Number(b.dataset.price)) * -1;
        if (cauHinh.sapXep === "ten-a-z")
          return a.dataset.name.localeCompare(b.dataset.name, "vi");
        return (
          Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex)
        );
      });
      sapXep.forEach((hang) => tbody.append(hang));
    }
    const nhanKetQua = document.getElementById(cauHinh.ketQua);
    if (nhanKetQua)
      nhanKetQua.textContent = `Hiển thị ${dangHien}/${cacHang.length} mục`;
  });
}

function veFormSanPham() {
  const sanPham = duLieuLuu.sanPham.find(
    (mon) => String(mon.MaSP) === maSanPhamDangSua,
  );
  const dangSua = sanPham !== undefined;
  const inputStyle =
    "mt-1 w-full rounded-lg border border-[#33483e] bg-[#101915] px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  return `<div class="border-b border-[#1f332c] px-5 py-4"><div class="flex items-start justify-between gap-4"><div><span class="text-[12px] font-bold uppercase tracking-[.15em] text-emerald-400">${dangSua ? "CHỈNH SỬA THÔNG TIN" : "KHO HÀNG · TẠO MẶT HÀNG"}</span><h2 class="mt-1 text-xl font-bold text-white">${dangSua ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h2><p class="mt-1 text-xs text-gray-400">Thông tin sẽ được lưu vào danh mục sản phẩm.</p></div><button class="grid h-9 w-9 place-items-center rounded-lg border border-[#30453b] text-gray-300 hover:bg-[#1e332d]" type="button" data-dong-san-pham aria-label="Đóng biểu mẫu"><span class="material-symbols-outlined">close</span></button></div></div><form id="formSanPham" class="grid gap-4 p-5 sm:grid-cols-2">
    <label class="text-xs font-semibold text-gray-300" for="maSanPham">Mã sản phẩm<input class="${inputStyle}" id="maSanPham" name="MaSP" required maxlength="6" value="${thoatHTML(sanPham?.MaSP || "")}" ${dangSua ? "readonly" : ""} placeholder="VD: SP001"></label>
    <label class="text-xs font-semibold text-gray-300" for="tenSanPham">Tên sản phẩm<input class="${inputStyle}" id="tenSanPham" name="TenSP" required maxlength="200" value="${thoatHTML(sanPham?.TenSP || "")}" placeholder="Tên sản phẩm"></label>
    <label class="text-xs font-semibold text-gray-300" for="nhaCungCap">Nhà cung cấp<input class="${inputStyle}" id="nhaCungCap" name="TenNCC" required maxlength="100" value="${thoatHTML(sanPham?.TenNCC || "")}" placeholder="Nhà cung cấp"></label>
    <label class="text-xs font-semibold text-gray-300" for="donViTinh">Đơn vị tính<input class="${inputStyle}" id="donViTinh" name="DviTinh" required maxlength="20" value="${thoatHTML(sanPham?.DviTinh || "")}" placeholder="Chai, kg, gói..."></label>
    <label class="text-xs font-semibold text-gray-300" for="giaSanPham">Giá bán (VND)<input class="${inputStyle}" id="giaSanPham" name="Giaban" type="number" min="0" step="1" required value="${sanPham?.Giaban ?? ""}"></label>
    <label class="text-xs font-semibold text-gray-300" for="tonKhoSanPham">Số lượng tồn<input class="${inputStyle}" id="tonKhoSanPham" name="Soluong" type="number" min="0" step="1" required value="${sanPham?.Soluong ?? ""}"></label>
    <div class="flex justify-end gap-2 border-t border-[#1f332c] pt-4 sm:col-span-2"><button class="rounded-lg border border-[#30453b] bg-[#162420] px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-[#1e332d]" type="button" id="nutHuySanPham">Hủy</button><button class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500" type="submit"><span class="material-symbols-outlined text-base">save</span>${dangSua ? "Lưu thay đổi" : "Tạo sản phẩm"}</button></div>
  </form>`;
}

function veBangSanPham(choPhepSua = false, quyen = {}) {
  if (dangTaiSanPham)
    return `<div class="p-10 text-center text-sm text-gray-400">${taoIcon("loader-circle")}<strong class="mt-2 block text-gray-200">Đang tải sản phẩm</strong>Đang đọc danh sách từ hệ thống.</div>`;
  if (loiTaiSanPham)
    return `<div class="p-10 text-center text-sm text-red-300" role="alert"><strong class="block text-white">Không thể tải sản phẩm</strong><span class="mt-1 block">Kiểm tra kết nối database rồi thử lại.</span><button class="mt-4 rounded-lg border border-[#30453b] px-3 py-2 text-xs text-gray-200 hover:text-emerald-300" data-lam-moi-san-pham type="button">Tải lại dữ liệu</button></div>`;
  if (!duLieuLuu.sanPham.length)
    return `<div class="p-10 text-center text-sm text-gray-400"><strong class="block text-white">Chưa có sản phẩm</strong><span class="mt-1 block">${choPhepSua ? "Thêm mặt hàng đầu tiên để bắt đầu quản lý kho." : "Danh mục sản phẩm chưa có dữ liệu."}</span></div>`;

  return `<div class="overflow-x-auto"><table class="w-full min-w-[860px] border-collapse text-left text-xs text-gray-300"><thead class="border-b border-[#1f332c] bg-[#0f1915] text-[12px] uppercase tracking-wider text-gray-400"><tr><th class="px-4 py-3 font-semibold">Ảnh</th><th class="px-4 py-3 font-semibold">Sản phẩm &amp; mã SKU</th><th class="px-4 py-3 font-semibold">Danh mục</th><th class="px-4 py-3 font-semibold">Nhà cung cấp</th><th class="px-4 py-3 text-right font-semibold">Tồn kho</th><th class="px-4 py-3 text-right font-semibold">Giá bán</th><th class="px-4 py-3 text-center font-semibold">Trạng thái</th>${choPhepSua ? '<th class="px-4 py-3 text-right font-semibold">Thao tác</th>' : ""}</tr></thead><tbody class="divide-y divide-[#1b2b25]">${duLieuLuu.sanPham
    .map((sanPham, viTri) => {
      const soLuong = Number(sanPham.Soluong);
      const trangThaiTon =
        soLuong <= 0 ? "het-hang" : soLuong <= 5 ? "ton-thap" : "con-hang";
      const nhanTon =
        trangThaiTon === "het-hang"
          ? "Hết hàng"
          : trangThaiTon === "ton-thap"
            ? "Tồn thấp"
            : "Còn hàng";
      const danhMuc = sanPham.DanhMuc || sanPham.NhomDanhMuc || "";
      const timKiem = `${sanPham.MaSP} ${sanPham.TenSP} ${sanPham.TenNCC} ${danhMuc} ${sanPham.DviTinh}`;
      const mauTrangThai =
        trangThaiTon === "het-hang"
          ? "border-red-800 bg-red-950/70 text-red-300"
          : trangThaiTon === "ton-thap"
            ? "border-amber-800 bg-amber-950/60 text-amber-300"
            : "border-emerald-800 bg-emerald-950/60 text-emerald-300";
      return `<tr class="st-inventory-row transition-colors hover:bg-[#182622]" data-search="${thoatHTML(timKiem)}" data-category="${thoatHTML(sanPham.DanhMuc || "")}" data-stock-status="${trangThaiTon}" data-stock="${soLuong}" data-price="${Number(sanPham.Giaban || 0)}" data-name="${thoatHTML(sanPham.TenSP)}" data-original-index="${viTri}"><td class="px-4 py-3">${sanPham.anh ? `<img class="h-10 w-10 rounded-lg object-cover" src="${thoatHTML(sanPham.anh)}" alt="" loading="lazy">` : `<span class="grid h-10 w-10 place-items-center rounded-lg border border-[#253d34] bg-[#192823] text-emerald-400">${taoIcon("package")}</span>`}</td><td class="px-4 py-3"><strong class="block font-semibold text-white">${thoatHTML(sanPham.TenSP)}</strong><small class="mt-1 block font-mono text-[12px] text-gray-500">${thoatHTML(sanPham.MaSP)} · ${thoatHTML(sanPham.DviTinh)}</small></td><td class="px-4 py-3">${thoatHTML(danhMuc || "Chưa phân loại")}</td><td class="px-4 py-3">${thoatHTML(sanPham.TenNCC)}</td><td class="px-4 py-3 text-right font-mono">${thoatHTML(sanPham.Soluong)} ${thoatHTML(sanPham.DviTinh)}</td><td class="px-4 py-3 text-right font-mono font-bold text-emerald-300">${dinhDangTien(sanPham.Giaban)}</td><td class="px-4 py-3 text-center"><span class="inline-flex rounded-full border px-2.5 py-1 text-[12px] font-semibold ${mauTrangThai}">${nhanTon}</span>${sanPham.DaAn ? '<span class="ml-1 inline-flex rounded-full border border-gray-600 bg-gray-800/60 px-2 py-1 text-[12px] font-semibold text-gray-300">Đã ẩn</span>' : ""}</td>${choPhepSua ? `<td class="px-4 py-3 text-right"><div class="inline-flex items-center gap-2">${quyen.coSua ? `<button class="rounded-md border border-[#30453b] px-2.5 py-1.5 text-[13.2px] font-semibold text-gray-200 hover:border-emerald-700 hover:text-emerald-300" data-sua-san-pham="${thoatHTML(sanPham.MaSP)}">Sửa</button>` : ""}${sanPham.DaAn ? (quyen.coKhoiPhuc ? `<button class="rounded-md border border-emerald-800 px-2.5 py-1.5 text-[13.2px] font-semibold text-emerald-300 hover:bg-emerald-950/40" data-khoi-phuc-san-pham="${thoatHTML(sanPham.MaSP)}">Khôi phục</button>` : "") : (quyen.coAn ? `<button class="rounded-md border border-amber-800 px-2.5 py-1.5 text-[13.2px] font-semibold text-amber-300 hover:bg-amber-950/40" data-an-san-pham="${thoatHTML(sanPham.MaSP)}">Ẩn</button>` : "")}${quyen.coXoa ? `<button class="rounded-md p-1.5 text-red-300 hover:bg-red-950/40" data-xoa-san-pham="${thoatHTML(sanPham.MaSP)}" aria-label="Xóa ${thoatHTML(sanPham.TenSP)}">${taoIcon("trash-2")}</button>` : ""}</div></td>` : ""}</tr>`;
    })
    .join("")}</tbody></table></div>`;
}

function veBangDonHang(danhSach, choPhepCapNhat = false) {
  if (!danhSach.length) {
    return `<div class="p-10 text-center text-sm text-gray-400"><strong class="block text-white">Chưa có hóa đơn</strong><span class="mt-1 block">Đơn hàng sẽ hiển thị khi được tạo trong hệ thống.</span></div>`;
  }

  const chuyenTrangThai = {
    cho_xac_nhan: ["dang_xu_ly", "da_huy"],
    dang_xu_ly: ["dang_giao", "da_huy"],
    dang_giao: ["hoan_thanh", "da_hoan_hang"],
    hoan_thanh: ["da_hoan_hang"],
  };
  return `<div class="overflow-x-auto"><table class="w-full min-w-[950px] border-collapse text-left text-xs text-gray-300"><thead class="border-b border-[#1f332c] bg-[#0f1915] text-[12px] uppercase tracking-wider text-gray-400"><tr><th class="px-4 py-3 font-semibold">Mã hóa đơn</th><th class="px-4 py-3 font-semibold">Khách hàng</th><th class="px-4 py-3 font-semibold">Thời gian</th><th class="px-4 py-3 font-semibold">Phương thức</th><th class="px-4 py-3 text-right font-semibold">Tổng tiền</th><th class="px-4 py-3 text-center font-semibold">Trạng thái</th>${choPhepCapNhat ? '<th class="px-4 py-3 font-semibold">Thao tác</th>' : ""}</tr></thead><tbody class="divide-y divide-[#1b2b25]">${danhSach
    .map((don) => {
      const trangThai = don.trangThai || "";
      const mauTrangThai = ["da_huy", "da_hoan_hang"].includes(trangThai)
        ? "border-red-800 bg-red-950/70 text-red-300"
        : trangThai === "hoan_thanh"
          ? "border-emerald-800 bg-emerald-950/70 text-emerald-300"
          : "border-amber-800 bg-amber-950/60 text-amber-300";
      const cacTrangThaiTiepTheo = chuyenTrangThai[trangThai] || [];
      const thaoTacTrangThai = choPhepCapNhat
        ? cacTrangThaiTiepTheo.length
          ? `<div class="flex items-center gap-2"><select class="max-w-40 rounded-md border border-[#30453b] bg-[#0f1915] px-2 py-2 text-[12px] text-gray-200" data-chon-trang-thai="${thoatHTML(don.MaHD)}" aria-label="Trạng thái mới cho đơn ${thoatHTML(don.MaHD)}">${cacTrangThaiTiepTheo.map((ma) => `<option value="${ma}">${nhanTrangThaiDonHang(ma)}</option>`).join("")}</select><button class="rounded-md bg-emerald-800 px-3 py-2 text-[12px] font-semibold text-white hover:bg-emerald-700" data-cap-nhat-trang-thai="${thoatHTML(don.MaHD)}">Lưu</button></div>`
          : `<span class="text-[12px] text-gray-500">Trạng thái cuối</span>`
        : "";
      const thaoTacThanhToan = choPhepCapNhat
        ? don.trangThaiThanhToan === "cho_hoan_tien"
          ? `<button class="mt-2 text-[12px] font-semibold text-amber-300 hover:text-amber-200" data-cap-nhat-thanh-toan="${thoatHTML(don.MaHD)}" data-trang-thai-thanh-toan="da_hoan_tien">Xác nhận đã hoàn tiền</button>`
          : don.phuongThuc === "bank_transfer" &&
              don.trangThaiThanhToan === "cho_thanh_toan"
            ? `<button class="mt-2 text-[12px] font-semibold text-emerald-300 hover:text-emerald-200" data-cap-nhat-thanh-toan="${thoatHTML(don.MaHD)}" data-trang-thai-thanh-toan="da_thanh_toan">Xác nhận đã nhận tiền</button>`
            : ""
        : "";
      return `<tr class="st-order-row transition-colors hover:bg-[#182622]" data-search="${thoatHTML(`${don.MaHD} ${don.khach} ${don.Ngaylap} ${don.phuongThuc}`)}" data-status="${thoatHTML(trangThai)}"><td class="px-4 py-3 font-mono font-bold text-emerald-400">${thoatHTML(don.MaHD)}</td><td class="px-4 py-3 font-semibold text-white">${thoatHTML(don.khach || "—")}</td><td class="whitespace-nowrap px-4 py-3 text-gray-400">${thoatHTML(don.Ngaylap || "—")}</td><td class="px-4 py-3">${nhanPhuongThucThanhToan(don.phuongThuc)}</td><td class="px-4 py-3 text-right font-mono font-bold text-emerald-300">${dinhDangTien(don.tong || 0)}</td><td class="px-4 py-3 text-center"><span class="inline-flex rounded-full border px-2.5 py-1 text-[12px] font-semibold ${mauTrangThai}">${nhanTrangThaiDonHang(trangThai)}</span><span class="mt-1 block text-[12px] text-gray-400">${nhanTrangThaiThanhToan(don.trangThaiThanhToan)}</span></td>${choPhepCapNhat ? `<td class="px-4 py-3">${thaoTacTrangThai}${thaoTacThanhToan}</td>` : ""}</tr>`;
    })
    .join("")}</tbody></table></div>`;
}

function veBangNguoiDung() {
  const tenVaiTro = {
    khach_hang: "Khách hàng",
    nhan_vien: "Nhân viên",
    admin: "Admin",
  };
  return duLieuQuanTri.taiKhoan.length
    ? `<div class="overflow-x-auto"><table class="w-full min-w-[620px] border-collapse text-left text-xs text-gray-300"><thead class="border-b border-[#1f332c] bg-[#0f1915] text-[12px] uppercase tracking-wider text-gray-400"><tr><th class="px-4 py-3 font-semibold">Mã tài khoản</th><th class="px-4 py-3 font-semibold">Tên tài khoản</th><th class="px-4 py-3 font-semibold">Vai trò</th><th class="px-4 py-3 font-semibold">Trạng thái</th><th class="px-4 py-3 text-right font-semibold">Thao tác</th></tr></thead><tbody class="divide-y divide-[#1b2b25]">${duLieuQuanTri.taiKhoan
        .map((taiKhoan) => {
          const role = taiKhoan.VaiTro || "";
          const hoatDong = taiKhoan.TrangThai !== false;
          const laToi = taiKhoan.MaTK === duLieuLuu.taiKhoan?.id;
          const roleColor =
            role === "admin"
              ? "border-emerald-800 bg-emerald-950/70 text-emerald-300"
              : role === "nhan_vien"
                ? "border-amber-800 bg-amber-950/60 text-amber-300"
                : "border-[#35443c] bg-[#1a2520] text-gray-300";
          return `<tr class="st-account-row-item transition-colors hover:bg-[#182622]" data-search="${thoatHTML(`${taiKhoan.MaTK} ${taiKhoan.TenTK} ${role}`)}" data-role="${thoatHTML(role)}"><td class="px-4 py-3 font-mono font-semibold text-white">${thoatHTML(taiKhoan.MaTK)}</td><td class="px-4 py-3"><span class="flex items-center gap-2 font-semibold text-white"><span class="grid h-8 w-8 place-items-center rounded-full bg-[#1e332d] text-emerald-300">${taoIcon("user-round")}</span>${thoatHTML(taiKhoan.TenTK)}</span></td><td class="px-4 py-3"><span class="rounded-full border px-2.5 py-1 text-[12px] font-semibold ${roleColor}">${tenVaiTro[role] || thoatHTML(role || "Chưa xác định")}</span></td><td class="px-4 py-3">${hoatDong ? '<span class="rounded-full border border-emerald-800 bg-emerald-950/60 px-2.5 py-1 text-[12px] font-semibold text-emerald-300">Hoạt động</span>' : '<span class="rounded-full border border-red-800 bg-red-950/60 px-2.5 py-1 text-[12px] font-semibold text-red-300">Đã khóa</span>'}</td><td class="px-4 py-3 text-right">${laToi ? '<span class="text-[12px] text-gray-500">Tài khoản của bạn</span>' : `<div class="inline-flex items-center gap-2"><select class="rounded-md border border-[#30453b] bg-[#0f1915] px-2 py-1.5 text-[13.2px] text-gray-200" data-doi-vai-tro="${thoatHTML(taiKhoan.MaTK)}" aria-label="Đổi vai trò"><option value="khach_hang" ${role === "khach_hang" ? "selected" : ""}>Khách hàng</option><option value="nhan_vien" ${role === "nhan_vien" ? "selected" : ""}>Nhân viên</option><option value="admin" ${role === "admin" ? "selected" : ""}>Admin</option></select><button class="rounded-md border border-[#30453b] px-2.5 py-1.5 text-[13.2px] font-semibold ${hoatDong ? "text-red-300 hover:bg-red-950/40" : "text-emerald-300 hover:bg-emerald-950/40"}" data-khoa-tai-khoan="${thoatHTML(taiKhoan.MaTK)}" data-hoat-dong="${hoatDong ? "0" : "1"}">${hoatDong ? "Khóa" : "Mở khóa"}</button></div>`}</td></tr>`;
        })
        .join("")}</tbody></table></div>`
    : `<div class="p-10 text-center text-sm text-gray-400"><strong class="block text-white">${dangTaiDuLieuQuanTri ? "Đang tải tài khoản" : "Chưa có tài khoản"}</strong><span class="mt-1 block">${dangTaiDuLieuQuanTri ? "Đang kết nối API quản trị." : "Chưa có dữ liệu tài khoản trong hệ thống."}</span></div>`;
}

function veBangBenh() {
  return duLieuLuu.benhCay.length
    ? `<div class="grid gap-3 md:grid-cols-2">${duLieuLuu.benhCay.map((bai) => `<article class="rounded-xl border border-[#253d34] bg-[#101915] p-4"><span class="text-[12px] font-bold uppercase tracking-wider text-emerald-400">${thoatHTML(bai.loai)}</span><h3 class="mt-2 text-sm font-bold text-white">${thoatHTML(bai.ten)}</h3><p class="mt-2 text-xs leading-5 text-gray-400">${thoatHTML(bai.moTa)}</p></article>`).join("")}</div>`
    : `<div class="rounded-lg border border-dashed border-[#35443c] bg-[#101915] p-10 text-center text-sm text-gray-400"><strong class="block text-white">Chưa có dữ liệu bệnh cây</strong><span class="mt-1 block">Nội dung tham khảo chưa được kết nối với API trong hệ thống.</span></div>`;
}

// =============================================================================
// LUỒNG XỬ LÝ THÊM SẢN PHẨM VÀO GIỎ HÀNG
// =============================================================================
function themVaoGio(maSanPham) {
  // 1. Kiểm tra sản phẩm có tồn tại và còn hàng trong kho hay không
  const sanPham = duLieuLuu.sanPham.find((mon) => mon.MaSP === maSanPham);
  if (!sanPham || sanPham.Soluong < 1)
    return hienThongBao("Sản phẩm hiện không đủ tồn kho.");
  
  // 2. Tìm xem sản phẩm đã có sẵn trong giỏ hàng chưa
  const monTrongGio = duLieuLuu.gioHang.find((mon) => mon.MaSP === maSanPham);
  if (monTrongGio)
    // Nếu có rồi thì tăng số lượng lên 1 (không vượt quá số lượng tồn kho)
    monTrongGio.soLuong = Math.min(monTrongGio.soLuong + 1, sanPham.Soluong);
  else 
    // Nếu chưa có thì đưa sản phẩm mới vào giỏ với số lượng là 1
    duLieuLuu.gioHang.push({ MaSP: maSanPham, soLuong: 1 });
  
  // 3. Lưu lại giỏ hàng vào bộ nhớ và thông báo cho người dùng
  luuDuLieu();
  hienThongBao("Đã thêm sản phẩm vào giỏ hàng.");
}

// =============================================================================
// LUỒNG ĐIỀU KHIỂN ĐÓNG / MỞ NĂNG TRƯỢT GIỎ HÀNG (DRAWER)
// =============================================================================
function moGioHang() {
  // Mở lớp phủ nền mờ và ngăn trượt giỏ hàng từ cạnh phải
  document.getElementById("lopPhu").classList.add("dang-mo");
  document.getElementById("nganGio").classList.add("dang-mo");
  document.getElementById("nganGio").setAttribute("aria-hidden", "false");
  document.getElementById("lopPhu").setAttribute("aria-hidden", "false");
  // Vẽ lại danh sách mặt hàng trong giỏ
  veGioHang();
  document.getElementById("nutDongGio").focus();
}

function dongGioHang() {
  // Đóng lớp phủ và ẩn ngăn giỏ hàng
  document.getElementById("lopPhu").classList.remove("dang-mo");
  document.getElementById("nganGio").classList.remove("dang-mo");
  document.getElementById("nganGio").setAttribute("aria-hidden", "true");
  document.getElementById("lopPhu").setAttribute("aria-hidden", "true");
  document.getElementById("nutMoGio").focus();
}

// =============================================================================
// LUỒNG HIỂN THỊ CHI TIẾT DANH SÁCH MẶT HÀNG TRONG NGĂN GIỎ HÀNG
// =============================================================================
function veGioHang() {
  const noiDung = document.getElementById("noiDungGio");
  // Kết nối từng món trong giỏ hàng với danh mục sản phẩm để lấy giá và hình ảnh
  const cacMon = duLieuLuu.gioHang
    .map((mon) => ({
      ...mon,
      sanPham: duLieuLuu.sanPham.find((sp) => sp.MaSP === mon.MaSP),
    }))
    .filter((mon) => mon.sanPham);
  // Tính tổng số tiền tạm tính của giỏ hàng
  const tongTien = cacMon.reduce(
    (tong, mon) => tong + mon.sanPham.Giaban * mon.soLuong,
    0,
  );
  // Nếu giỏ hàng trống thì hiển thị trạng thái trống
  if (!cacMon.length) {
    noiDung.innerHTML = `<div class="flex flex-col items-center gap-2 py-12 text-center"><span class="material-symbols-outlined text-3xl text-gray-500">shopping_bag</span><strong class="text-sm text-white">Giỏ hàng đang trống</strong><span class="text-xs text-gray-400">Thêm sản phẩm để bắt đầu đơn hàng.</span><button class="mt-2 text-xs font-semibold text-emerald-300" data-xem="cua-hang">Tiếp tục mua sắm</button></div>`;
    veIcon();
    return;
  }
  // Hiển thị danh sách từng món, số lượng, thành tiền và nút chuyển đến trang thanh toán
  noiDung.innerHTML = `<div class="space-y-4">${cacMon.map((mon) => `<article class="flex items-center gap-3 border-b border-[#3f493f]/60 pb-3 last:border-0">${mon.sanPham.anh ? `<img class="h-14 w-14 rounded-lg border border-[#3f493f] bg-[#18211e] object-contain p-1" src="${thoatHTML(mon.sanPham.anh)}" alt="" loading="lazy">` : `<span class="grid h-14 w-14 place-items-center rounded-lg border border-[#3f493f] bg-[#18211e] text-emerald-300">${taoIcon(iconTheoDanhMuc(mon.sanPham))}</span>`}<div class="min-w-0 flex-1"><strong class="block truncate text-xs text-gray-100">${thoatHTML(mon.sanPham.TenSP)}</strong><span class="mt-1 block text-[12px] text-gray-400">${mon.soLuong} × ${dinhDangTien(mon.sanPham.Giaban)}</span></div><strong class="text-xs text-emerald-300">${dinhDangTien(Number(mon.sanPham.Giaban) * mon.soLuong)}</strong></article>`).join("")}<div class="flex items-center justify-between border-t border-[#3f493f] pt-3"><span class="text-xs text-gray-400">Tạm tính</span><strong class="text-sm font-bold text-white">${dinhDangTien(tongTien)}</strong></div><button class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-600" data-xem="gio-hang">Xem giỏ hàng &amp; thanh toán ${taoIcon("arrow-right")}</button></div>`;
  veIcon();
}

function veThanhToan() {
  const noiDung = oNoiDung;
  const cacMon = duLieuLuu.gioHang
    .map((mon) => ({
      ...mon,
      sanPham: duLieuLuu.sanPham.find((sp) => sp.MaSP === mon.MaSP),
    }))
    .filter((mon) => mon.sanPham);
  const tongTien = cacMon.reduce(
    (tong, mon) => tong + mon.sanPham.Giaban * mon.soLuong,
    0,
  );
  if (!cacMon.length) {
    noiDung.innerHTML = `<div class="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center px-4 py-12 text-center"><span class="material-symbols-outlined grid h-20 w-20 place-items-center rounded-full border border-[#3f493f] bg-[#141d1a] text-4xl text-emerald-300">shopping_bag</span><h1 class="mt-5 text-2xl font-extrabold text-white">Giỏ hàng đang trống</h1><p class="mt-2 text-sm text-gray-400">Thêm sản phẩm để bắt đầu đơn hàng.</p><button class="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-xs font-bold text-white hover:bg-emerald-600" data-xem="cua-hang">Tiếp tục mua sắm ${taoIcon("arrow-right")}</button></div>`;
    veIcon();
    return;
  }
  const soSanPham = cacMon.reduce((tong, mon) => tong + mon.soLuong, 0);
  noiDung.innerHTML = `<div class="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <nav aria-label="Tiến trình thanh toán" class="rounded-xl border border-[#3f493f] bg-[#141d1a] p-4"><ol class="grid grid-cols-2 gap-3 md:grid-cols-4"><li class="flex items-center gap-3"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-600 bg-emerald-800 text-emerald-100"><span class="material-symbols-outlined text-lg">shopping_cart</span></span><div><span class="block text-[10.8px] font-bold uppercase text-emerald-300">Bước 1</span><strong class="text-[13.2px] text-white">Giỏ hàng (${cacMon.length})</strong></div></li><li class="flex items-center gap-3"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-700 text-emerald-300">2</span><div><span class="block text-[10.8px] font-bold uppercase text-emerald-300">Bước 2</span><strong class="text-[13.2px] text-white">Địa chỉ nhận hàng</strong></div></li><li class="flex items-center gap-3 opacity-60"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#3f493f] text-gray-500">3</span><div><span class="block text-[10.8px] font-bold uppercase text-gray-500">Bước 3</span><strong class="text-[13.2px] text-gray-400">Thanh toán</strong></div></li><li class="flex items-center gap-3 opacity-60"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#3f493f] text-gray-500"><span class="material-symbols-outlined text-lg">task_alt</span></span><div><span class="block text-[10.8px] font-bold uppercase text-gray-500">Bước 4</span><strong class="text-[13.2px] text-gray-400">Hoàn tất đơn</strong></div></li></ol></nav>
    <div class="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
      <section class="space-y-5 lg:col-span-8"><div class="overflow-hidden rounded-xl border border-[#3f493f] bg-[#141d1a]"><div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#3f493f] bg-[#18211e] p-4"><div><h1 class="text-base font-bold text-white">Giỏ hàng của bạn</h1><p class="mt-1 text-xs text-gray-400">${cacMon.length} mặt hàng · ${soSanPham} sản phẩm</p></div><button class="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200" data-xem="cua-hang">${taoIcon("arrow-left")} Tiếp tục mua hàng</button></div>
      ${cacMon.map((mon) => `<article class="flex flex-col items-start justify-between gap-4 border-b border-[#3f493f]/60 p-4 last:border-b-0 sm:flex-row sm:items-center"><div class="flex min-w-0 w-full items-center gap-3 sm:flex-1">${mon.sanPham.anh ? `<img class="h-16 w-16 shrink-0 rounded-lg border border-[#3f493f] bg-[#18211e] object-contain p-1 sm:h-20 sm:w-20" src="${thoatHTML(mon.sanPham.anh)}" alt="${thoatHTML(mon.sanPham.TenSP)}" loading="lazy">` : `<span class="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-[#3f493f] bg-[#18211e] text-emerald-300 sm:h-20 sm:w-20">${taoIcon(iconTheoDanhMuc(mon.sanPham))}</span>`}<div class="min-w-0"><span class="block truncate text-[10.8px] font-bold uppercase tracking-wider text-gray-500">${thoatHTML(mon.sanPham.TenNCC || "Nhà cung cấp chưa có thông tin")}</span><h2 class="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-gray-100">${thoatHTML(mon.sanPham.TenSP)}</h2><p class="mt-1 text-xs text-gray-400">${thoatHTML(mon.sanPham.DviTinh)} <span class="text-gray-600">·</span> <span class="text-emerald-300">${dinhDangTien(mon.sanPham.Giaban)}</span></p></div></div><div class="flex w-full items-center justify-between gap-3 pl-[76px] sm:w-auto sm:pl-0"><div class="inline-flex h-9 items-center rounded-lg border border-[#3f493f] bg-[#18211e]"><button class="grid h-9 w-9 place-items-center text-gray-300 hover:text-emerald-300 disabled:opacity-40" data-giam-gio="${thoatHTML(mon.MaSP)}" aria-label="Giảm số lượng ${thoatHTML(mon.sanPham.TenSP)}" ${mon.soLuong <= 1 ? "disabled" : ""}>${taoIcon("minus")}</button><span class="min-w-8 text-center text-xs font-semibold text-white">${mon.soLuong}</span><button class="grid h-9 w-9 place-items-center text-gray-300 hover:text-emerald-300 disabled:opacity-40" data-tang-gio="${thoatHTML(mon.MaSP)}" aria-label="Tăng số lượng ${thoatHTML(mon.sanPham.TenSP)}" ${mon.soLuong >= mon.sanPham.Soluong ? "disabled" : ""}>${taoIcon("plus")}</button></div><strong class="min-w-[92px] text-right text-sm font-extrabold text-emerald-300">${dinhDangTien(Number(mon.sanPham.Giaban) * mon.soLuong)}</strong><button class="grid h-9 w-9 place-items-center rounded text-gray-500 hover:bg-red-950/30 hover:text-red-300" data-bo-gio="${thoatHTML(mon.MaSP)}" aria-label="Xóa ${thoatHTML(mon.sanPham.TenSP)} khỏi giỏ">${taoIcon("trash-2")}</button></div></article>`).join("")}</div>
      <form class="space-y-5" id="formThanhToan"><section class="rounded-xl border border-[#3f493f] bg-[#141d1a] p-4 sm:p-5"><div class="mb-4 border-b border-[#3f493f]/60 pb-3"><h2 class="text-base font-bold text-white">Thông tin nhận hàng</h2><p class="mt-1 text-xs text-gray-400">Điền thông tin người nhận cho đơn hàng.</p></div><div class="grid gap-4 sm:grid-cols-2"><div class="form-nhom"><label for="tenNhanHang">Họ và tên</label><input id="tenNhanHang" autocomplete="name" required value="${thoatHTML(duLieuLuu.taiKhoan ? duLieuLuu.taiKhoan.ten : "")}" placeholder="Tên người nhận"></div><div class="form-nhom"><label for="dienThoaiNhanHang">Số điện thoại</label><input id="dienThoaiNhanHang" type="tel" autocomplete="tel" inputmode="tel" required pattern="[0-9]{8,15}" placeholder="Số điện thoại chỉ gồm chữ số"></div><div class="form-nhom sm:col-span-2"><label for="diaChiNhanHang">Địa chỉ nhận hàng</label><input id="diaChiNhanHang" autocomplete="street-address" required placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"></div></div></section>
      <section class="rounded-xl border border-[#3f493f] bg-[#141d1a] p-4 sm:p-5"><div class="mb-3 border-b border-[#3f493f]/60 pb-3"><h2 class="text-base font-bold text-white">Phương thức thanh toán</h2><p class="mt-1 text-xs text-gray-400">Chọn cách thanh toán cho đơn hàng.</p></div><fieldset class="space-y-2" data-phuong-thuc-thanh-toan><legend class="sr-only">Phương thức thanh toán</legend></fieldset></section>
      <p class="flex items-start gap-2 text-[13.2px] leading-5 text-gray-400"><span class="material-symbols-outlined text-base text-amber-300">info</span>Thông tin đơn hàng được xác nhận từ dữ liệu hệ thống.</p></form>
      </section>
      <aside class="space-y-4 rounded-xl border border-[#3f493f] bg-[#141d1a] p-4 lg:sticky lg:top-24 lg:col-span-4 lg:p-5"><span class="text-[12px] font-bold uppercase tracking-wider text-emerald-300">Tóm tắt đơn hàng</span><h2 class="text-xl font-bold text-white">Tổng tiền hàng</h2><div class="space-y-3 border-y border-[#3f493f]/60 py-4"><div class="flex justify-between gap-3 text-xs text-gray-400"><span>Tạm tính (${soSanPham} sản phẩm)</span><strong class="text-gray-200">${dinhDangTien(tongTien)}</strong></div><div class="flex justify-between gap-3 text-xs text-gray-400"><span>Phí giao hàng</span><span>Xác nhận riêng</span></div></div><div class="flex items-center justify-between gap-3"><span class="text-sm font-bold text-gray-200">Tổng tiền hàng</span><strong class="text-lg font-extrabold text-emerald-300">${dinhDangTien(tongTien)}</strong></div><button class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-600" type="submit" form="formThanhToan">${taoIcon("lock-keyhole")} Đặt hàng</button><p class="flex items-start gap-2 text-[12px] leading-5 text-gray-500">${taoIcon("shield-check")} Giá và tồn kho được kiểm tra trên máy chủ.</p></aside>
    </div>
  </div>`;
  const laKhachHang = duLieuLuu.taiKhoan?.vaiTro === "khach_hang";
  const fieldsetThanhToan = noiDung.querySelector(
    "#formThanhToan [data-phuong-thuc-thanh-toan]",
  );
  if (fieldsetThanhToan) {
    fieldsetThanhToan.innerHTML = cacPhuongThucThanhToan
      .map((phuongThuc, viTri) => {
        const laChuyenKhoan = phuongThuc.ma === "bank_transfer";
        const huongDan = laChuyenKhoan
          ? `<span class="ml-8 block pb-3 text-[12px] leading-5 text-gray-400">${thoatHTML(phuongThuc.nganHang)} · ${thoatHTML(phuongThuc.soTaiKhoan)}<br>Chủ tài khoản: ${thoatHTML(phuongThuc.chuTaiKhoan)}<br>Nội dung chuyển khoản sẽ được cấp sau khi đặt hàng.</span>`
          : "";
        return `<label class="block rounded-lg border ${viTri === 0 ? "border-emerald-800/60 bg-emerald-950/20" : "border-[#3f493f]"} px-3 text-xs text-gray-200"><span class="flex min-h-12 cursor-pointer items-center gap-3"><input class="accent-emerald-500" type="radio" name="phuongThuc" value="${thoatHTML(phuongThuc.ma)}" ${viTri === 0 ? "checked" : ""}><span class="material-symbols-outlined text-emerald-300">${laChuyenKhoan ? "account_balance" : "payments"}</span><span>${thoatHTML(phuongThuc.ten)}</span></span>${huongDan}</label>`;
      })
      .join("");
  }
  const ghiChuThanhToan = noiDung.querySelector("#formThanhToan > p");
  if (ghiChuThanhToan) {
    ghiChuThanhToan.textContent = laKhachHang
      ? "Giá và tồn kho sẽ được kiểm tra lại trên máy chủ khi đặt hàng. Phí giao hàng được xác nhận riêng."
      : "Bạn cần đăng nhập bằng tài khoản khách hàng để đặt hàng. Giỏ hàng sẽ được giữ nguyên.";
  }
  const nutDatHang = noiDung.querySelector(
    'button[form="formThanhToan"]',
  );
  if (nutDatHang) {
    if (laKhachHang) {
      nutDatHang.textContent = dangTaoDonHang ? "Đang tạo đơn hàng..." : "Đặt hàng";
      nutDatHang.disabled = dangTaoDonHang;
    } else if (duLieuLuu.taiKhoan === null) {
      nutDatHang.type = "button";
      nutDatHang.id = "nutMoDangNhap";
      nutDatHang.innerHTML = `${taoIcon("log-in")} Đăng nhập để đặt hàng`;
    } else {
      nutDatHang.type = "button";
      nutDatHang.disabled = true;
      nutDatHang.textContent = "Chỉ tài khoản khách hàng được đặt hàng";
    }
  }
  veIcon();
}

function capNhatHienThiGioHang() {
  if (trangHienTai !== "gio-hang") {
    veGioHang();
    return;
  }

  const form = document.getElementById("formThanhToan");
  const duLieu = form
    ? {
        ten: document.getElementById("tenNhanHang")?.value || "",
        soDienThoai: document.getElementById("dienThoaiNhanHang")?.value || "",
        diaChi: document.getElementById("diaChiNhanHang")?.value || "",
        phuongThuc: new FormData(form).get("phuongThuc"),
      }
    : null;
  veThanhToan();
  if (duLieu && document.getElementById("formThanhToan")) {
    document.getElementById("tenNhanHang").value = duLieu.ten;
    document.getElementById("dienThoaiNhanHang").value = duLieu.soDienThoai;
    document.getElementById("diaChiNhanHang").value = duLieu.diaChi;
    const phuongThuc = [...document.querySelectorAll(
      '#formThanhToan input[name="phuongThuc"]',
    )].find((oInput) => oInput.value === duLieu.phuongThuc);
    if (phuongThuc) phuongThuc.checked = true;
  }
}

function capNhatSoLuongGio(maSanPham, thayDoi) {
  const monTrongGio = duLieuLuu.gioHang.find((mon) => mon.MaSP === maSanPham);
  const sanPham = duLieuLuu.sanPham.find((mon) => mon.MaSP === maSanPham);
  if (!monTrongGio || !sanPham) return;
  monTrongGio.soLuong += thayDoi;
  if (monTrongGio.soLuong <= 0)
    duLieuLuu.gioHang = duLieuLuu.gioHang.filter(
      (mon) => mon.MaSP !== maSanPham,
    );
  else if (monTrongGio.soLuong > sanPham.Soluong)
    monTrongGio.soLuong = sanPham.Soluong;
  luuDuLieu();
  capNhatHienThiGioHang();
}

function taoOInputMatKhau(
  id,
  nhan,
  placeholder,
  autocomplete,
  minLength = 8,
  hienThangDo = false,
) {
  return `
    <label for="${id}">${nhan}</label>
    <div style="position:relative;display:flex;align-items:center;">
      <input
        id="${id}"
        type="password"
        required
        ${minLength ? `minlength="${minLength}"` : ""}
        ${hienThangDo ? `data-do-manh-mat-khau="thangDo_${id}"` : ""}
        autocomplete="${autocomplete}"
        placeholder="${placeholder}"
        style="padding-right:42px;width:100%;"
      >
      <button
        type="button"
        data-bat-tat-mat-khau="${id}"
        aria-label="Hiện mật khẩu"
        style="position:absolute;right:6px;width:32px;height:32px;display:grid;place-items:center;border:0;background:transparent;color:var(--phu);"
      >
        ${taoIcon("eye")}
      </button>
    </div>
    ${hienThangDo ? `<div id="thangDo_${id}" class="mt-1.5 hidden items-center justify-between gap-2 text-[11.5px]"><div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[#26352d]"><div data-thanh-mau class="h-full w-0 transition-all duration-200"></div></div><span data-nhan-do-manh class="font-semibold"></span></div>` : ""}
  `;
}

function capNhatThangDoMatKhau(oInput) {
  const idThangDo = oInput.dataset.doManhMatKhau;
  const khung = idThangDo ? document.getElementById(idThangDo) : null;
  if (!khung) return;

  const giaTri = oInput.value;
  if (!giaTri) {
    khung.classList.add("hidden");
    khung.classList.remove("flex");
    return;
  }

  khung.classList.remove("hidden");
  khung.classList.add("flex");

  let diem = 0;
  if (giaTri.length >= 8) diem += 1;
  if (giaTri.length >= 10) diem += 1;
  if (/[A-Z]/.test(giaTri) && /[a-z]/.test(giaTri)) diem += 1;
  if (/\d/.test(giaTri)) diem += 1;
  if (/[^A-Za-z0-9]/.test(giaTri)) diem += 1;

  const thanhMau = khung.querySelector("[data-thanh-mau]");
  const nhan = khung.querySelector("[data-nhan-do-manh]");

  if (giaTri.length < 8 || diem <= 1) {
    thanhMau.style.width = "33%";
    thanhMau.className = "h-full transition-all duration-200 bg-red-500";
    nhan.textContent = "Yếu";
    nhan.className = "font-semibold text-red-400";
  } else if (diem <= 3) {
    thanhMau.style.width = "66%";
    thanhMau.className = "h-full transition-all duration-200 bg-amber-400";
    nhan.textContent = "Trung bình";
    nhan.className = "font-semibold text-amber-300";
  } else {
    thanhMau.style.width = "100%";
    thanhMau.className = "h-full transition-all duration-200 bg-emerald-400";
    nhan.textContent = "Mạnh";
    nhan.className = "font-semibold text-emerald-300";
  }
}

function moHopTaiKhoan(cheDo = "dang-nhap") {
  cheDoTaiKhoan = cheDo;
  clearInterval(boDemGuiOtp);
  oHopTaiKhoan.querySelector(".thong-bao-hop-thoai")?.remove();

  const tieuDe = {
    "dang-nhap": ["Đăng nhập", "Đăng nhập bằng tên tài khoản hoặc Gmail."],
    "dang-ky": [
      "Tạo tài khoản",
      "Nhập Gmail để nhận mã xác nhận và hoàn tất đăng ký.",
    ],
    "quen-mat-khau": [
      "Quên mật khẩu",
      "Nhập Gmail đã đăng ký để nhận mã khôi phục mật khẩu.",
    ],
    "doi-mat-khau": [
      "Đổi mật khẩu",
      "Nhập mật khẩu hiện tại và thiết lập mật khẩu mới (tối thiểu 8 ký tự).",
    ],
  }[cheDo] || ["Đăng nhập", ""];

  document.getElementById("tieuDeTaiKhoan").textContent = tieuDe[0];
  document.getElementById("moTaTaiKhoan").textContent = tieuDe[1];

  const oNhapGmailVaOtp = (idEmail, placeholderEmail) => `
    <div class="form-nhom">
      <label for="${idEmail}">Địa chỉ Gmail</label>
      <div style="display:flex;gap:8px;">
        <input
          id="${idEmail}"
          type="email"
          required
          maxlength="254"
          autocomplete="email"
          placeholder="${placeholderEmail}"
          style="flex:1;min-width:0;"
        >
        <button
          type="button"
          id="nutGuiMaOtp"
          class="nut-phu"
          style="white-space:nowrap;padding:0 12px;"
        >
          Gửi mã
        </button>
      </div>
    </div>
    <div class="form-nhom">
      <label for="maXacNhanEmail">Mã xác nhận Gmail (6 số)</label>
      <input
        id="maXacNhanEmail"
        type="text"
        inputmode="numeric"
        pattern="[0-9]{6}"
        maxlength="6"
        required
        placeholder="Nhập 6 chữ số gửi về Gmail"
      >
    </div>
  `;

  if (cheDo === "doi-mat-khau") {
    document.getElementById("formTaiKhoan").innerHTML = `
      <div class="form-nhom">${taoOInputMatKhau("matKhauCuHopThoai", "Mật khẩu hiện tại", "Nhập mật khẩu hiện tại", "current-password", 0)}</div>
      <div class="form-nhom">${taoOInputMatKhau("matKhauTaiKhoan", "Mật khẩu mới", "Ít nhất 8 ký tự", "new-password", 8, true)}</div>
      <div class="form-nhom">${taoOInputMatKhau("xacNhanMatKhau", "Nhập lại mật khẩu mới", "Nhập lại mật khẩu mới", "new-password")}</div>
      <button class="nut-chinh" type="submit">Lưu mật khẩu mới</button>
      <button class="nut-xem-tat-ca" type="button" data-dong-hop>Hủy bỏ</button>
    `;
  } else if (cheDo === "dang-ky") {
    document.getElementById("formTaiKhoan").innerHTML = `
      <div class="form-nhom">
        <label for="tenDangNhapMoi">Tên tài khoản</label>
        <input
          id="tenDangNhapMoi"
          required
          minlength="3"
          maxlength="32"
          pattern="[-A-Za-z0-9._]{3,32}"
          autocomplete="username"
          placeholder="Ví dụ: vuonxanh_01"
        >
        <small>3–32 ký tự: chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.</small>
      </div>
      ${oNhapGmailVaOtp("emailDangKy", "Ví dụ: ten@gmail.com")}
      <div class="form-nhom">${taoOInputMatKhau("matKhauTaiKhoan", "Mật khẩu", "Ít nhất 8 ký tự", "new-password", 8, true)}</div>
      <div class="form-nhom">${taoOInputMatKhau("xacNhanMatKhau", "Nhập lại mật khẩu", "Nhập lại mật khẩu", "new-password")}</div>
      <button class="nut-chinh" type="submit">Đăng ký tài khoản</button>
      <button class="nut-xem-tat-ca" type="button" data-mo-che-do-tai-khoan="dang-nhap">Đã có tài khoản? Đăng nhập</button>
    `;
  } else if (cheDo === "quen-mat-khau") {
    document.getElementById("formTaiKhoan").innerHTML = `
      ${oNhapGmailVaOtp("emailQuenMatKhau", "Nhập Gmail đã dùng để đăng ký")}
      <div class="form-nhom">${taoOInputMatKhau("matKhauTaiKhoan", "Mật khẩu mới", "Ít nhất 8 ký tự", "new-password", 8, true)}</div>
      <div class="form-nhom">${taoOInputMatKhau("xacNhanMatKhau", "Nhập lại mật khẩu mới", "Nhập lại mật khẩu mới", "new-password")}</div>
      <button class="nut-chinh" type="submit">Đặt lại mật khẩu</button>
      <button class="nut-xem-tat-ca" type="button" data-mo-che-do-tai-khoan="dang-nhap">Quay lại đăng nhập</button>
    `;
  } else {
    document.getElementById("formTaiKhoan").innerHTML = `
      <div class="form-nhom">
        <label for="tenDangNhap">Tên tài khoản hoặc Gmail</label>
        <input
          id="tenDangNhap"
          required
          minlength="3"
          maxlength="254"
          autocomplete="username"
          placeholder="Nhập tên tài khoản hoặc Gmail"
        >
      </div>
      <div class="form-nhom">${taoOInputMatKhau("matKhauTaiKhoan", "Mật khẩu", "Mật khẩu của bạn", "current-password", 0)}</div>
      <div style="display:flex;justify-content:flex-end;">
        <button class="nut-xem-tat-ca" type="button" data-mo-che-do-tai-khoan="quen-mat-khau" style="font-size:13.2px;">Quên mật khẩu?</button>
      </div>
      <button class="nut-chinh" type="submit">Đăng nhập</button>
      <button class="nut-xem-tat-ca" type="button" data-mo-che-do-tai-khoan="dang-ky">Chưa có tài khoản? Tạo tài khoản</button>
    `;
  }

  oHopTaiKhoan.showModal();
  veIcon();
}

async function xuLyGuiMaOtp(nutGui) {
  const laQuenMatKhau = cheDoTaiKhoan === "quen-mat-khau";
  const oEmail = document.getElementById(
    laQuenMatKhau ? "emailQuenMatKhau" : "emailDangKy",
  );
  const email = oEmail?.value.trim() || "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    hienThongBao("Vui lòng nhập địa chỉ Gmail hợp lệ trước khi gửi mã.");
    oEmail?.focus();
    return;
  }

  nutGui.disabled = true;
  const nhanGoc = nutGui.textContent;
  nutGui.textContent = "Đang gửi...";

  try {
    const phanHoi = await goiApi("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        mucDich: laQuenMatKhau ? "quen_mat_khau" : "dang_ky",
      }),
    });

    hienThongBao(phanHoi.message || "Đã gửi mã xác nhận về Gmail.");
    document.getElementById("maXacNhanEmail")?.focus();

    let giayConLai = 60;
    nutGui.textContent = `Gửi lại (${giayConLai}s)`;
    clearInterval(boDemGuiOtp);
    boDemGuiOtp = setInterval(() => {
      giayConLai -= 1;
      if (giayConLai <= 0) {
        clearInterval(boDemGuiOtp);
        nutGui.disabled = false;
        nutGui.textContent = nhanGoc;
      } else {
        nutGui.textContent = `Gửi lại (${giayConLai}s)`;
      }
    }, 1000);
  } catch (loi) {
    console.error("Không thể gửi mã OTP.", loi);
    hienThongBao(loi.message || "Không gửi được mã về Gmail.");
    nutGui.disabled = false;
    nutGui.textContent = nhanGoc;
  }
}

async function xuLyDangNhap(suKien) {
  suKien.preventDefault();

  const nutGui = suKien.submitter;
  if (nutGui) nutGui.disabled = true;

  try {
    const matKhau = document.getElementById("matKhauTaiKhoan")?.value || "";
    let endpoint = "/api/auth/login";
    let duLieuGui = {};

    if (cheDoTaiKhoan === "dang-ky") {
      endpoint = "/api/auth/register";
      const tenTaiKhoan = document
        .getElementById("tenDangNhapMoi")
        .value.trim();
      const email = document.getElementById("emailDangKy")?.value.trim() || "";
      const maXacNhan =
        document.getElementById("maXacNhanEmail")?.value.trim() || "";
      const xacNhanMatKhau =
        document.getElementById("xacNhanMatKhau")?.value || "";

      if (!/^[-a-zA-Z0-9._]{3,32}$/.test(tenTaiKhoan)) {
        hienThongBao(
          "Tên tài khoản dài 3–32 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.",
        );
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        hienThongBao("Vui lòng nhập địa chỉ Gmail hợp lệ.");
        return;
      }
      if (!/^\d{6}$/.test(maXacNhan)) {
        hienThongBao("Vui lòng nhập đúng mã xác nhận 6 số từ Gmail.");
        return;
      }
      if (matKhau.length < 8) {
        hienThongBao("Mật khẩu phải có ít nhất 8 ký tự.");
        return;
      }
      if (matKhau !== xacNhanMatKhau) {
        hienThongBao("Mật khẩu nhập lại không khớp.");
        return;
      }
      duLieuGui = { tenTaiKhoan, email, maXacNhan, matKhau, xacNhanMatKhau };
    } else if (cheDoTaiKhoan === "quen-mat-khau") {
      endpoint = "/api/auth/reset-password";
      const email =
        document.getElementById("emailQuenMatKhau")?.value.trim() || "";
      const maXacNhan =
        document.getElementById("maXacNhanEmail")?.value.trim() || "";
      const xacNhanMatKhau =
        document.getElementById("xacNhanMatKhau")?.value || "";

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        hienThongBao("Vui lòng nhập địa chỉ Gmail hợp lệ.");
        return;
      }
      if (!/^\d{6}$/.test(maXacNhan)) {
        hienThongBao("Vui lòng nhập đúng mã xác nhận 6 số từ Gmail.");
        return;
      }
      if (matKhau.length < 8) {
        hienThongBao("Mật khẩu mới phải có ít nhất 8 ký tự.");
        return;
      }
      if (matKhau !== xacNhanMatKhau) {
        hienThongBao("Mật khẩu nhập lại không khớp.");
        return;
      }
      duLieuGui = { email, maXacNhan, matKhauMoi: matKhau, xacNhanMatKhau };
    } else if (cheDoTaiKhoan === "doi-mat-khau") {
      endpoint = "/api/auth/change-password";
      const matKhauCu =
        document.getElementById("matKhauCuHopThoai")?.value || "";
      const xacNhanMatKhau =
        document.getElementById("xacNhanMatKhau")?.value || "";

      if (!matKhauCu) {
        hienThongBao("Vui lòng nhập mật khẩu hiện tại.");
        return;
      }
      if (matKhau.length < 8) {
        hienThongBao("Mật khẩu mới phải có ít nhất 8 ký tự.");
        return;
      }
      if (matKhau !== xacNhanMatKhau) {
        hienThongBao("Mật khẩu mới nhập lại không khớp.");
        return;
      }
      duLieuGui = { matKhauCu, matKhauMoi: matKhau, xacNhanMatKhau };
    } else {
      const tenTaiKhoan = document.getElementById("tenDangNhap").value.trim();
      if (!tenTaiKhoan || !matKhau) {
        hienThongBao("Vui lòng nhập tên tài khoản (hoặc Gmail) và mật khẩu.");
        return;
      }
      duLieuGui = { tenTaiKhoan, matKhau };
    }

    const phanHoi = await goiApi(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duLieuGui),
    });

    if (phanHoi.nguoiDung) {
      duLieuLuu.taiKhoan = phanHoi.nguoiDung;
      try {
        localStorage.setItem(
          KHOA_TAI_KHOAN_GAN_NHAT,
          phanHoi.nguoiDung.id || phanHoi.nguoiDung.tenTaiKhoan || "",
        );
      } catch {}
      duLieuLuu.donHang = [];
      daTaiDonHang = false;
      loiTaiDonHang = false;
      tokenCsrf = phanHoi.csrfToken;
      capNhatGiaoDienTaiKhoan();
      // Đồng bộ nạp và gộp giỏ hàng cho tài khoản vừa đăng nhập
      dongBoGioHangKhiDangNhap(phanHoi.nguoiDung);
    }

    clearInterval(boDemGuiOtp);
    oHopTaiKhoan.close();

    const laQuanTri = ["nhan_vien", "admin"].includes(
      duLieuLuu.taiKhoan?.vaiTro,
    );
    if (cheDoTaiKhoan !== "doi-mat-khau") {
      chuyenTrang(laQuanTri ? "quan-tri" : "cua-hang");
    }

    hienThongBao(
      phanHoi.message ||
        (laQuanTri
          ? "Đăng nhập thành công. Đã mở trang quản trị."
          : "Đăng nhập thành công."),
    );
  } catch (loi) {
    console.error("Không thể xác thực tài khoản.", loi);
    hienThongBao(loi.message || "Thao tác thất bại.");
  } finally {
    if (nutGui && nutGui.isConnected) {
      nutGui.disabled = false;
    }
  }
}

// =============================================================================
// LUỒNG XỬ LÝ ĐẶT HÀNG (CHECKOUT & SUBMIT ORDER TO API)
// =============================================================================
async function xuLyDatHang(suKien) {
  // 1. Ngăn chặn hành vi gửi form mặc định làm reload trang
  suKien.preventDefault();
  if (dangTaoDonHang) return;

  // 2. Kiểm tra vai trò: Bắt buộc tài khoản khách hàng mới được phép đặt hàng
  if (duLieuLuu.taiKhoan?.vaiTro !== "khach_hang") {
    hienThongBao("Đăng nhập bằng tài khoản khách hàng để đặt hàng.");
    if (duLieuLuu.taiKhoan === null) moHopTaiKhoan("dang-nhap");
    return;
  }

  // 3. Kết nối các mặt hàng trong giỏ với danh mục sản phẩm để kiểm tra số lượng và tồn kho
  const cacMon = duLieuLuu.gioHang
    .map((mon) => ({
      ...mon,
      sanPham: duLieuLuu.sanPham.find((sp) => sp.MaSP === mon.MaSP),
    }))
    .filter((mon) => mon.sanPham);
  if (!cacMon.length) return hienThongBao("Giỏ hàng đang trống.");
  if (cacMon.some((mon) => mon.soLuong > mon.sanPham.Soluong))
    return hienThongBao("Một sản phẩm không còn đủ số lượng tồn.");

  // 4. Thu thập thông tin giao hàng và danh sách dòng hàng từ form
  const form = suKien.target;
  const nutDatHang = document.querySelector(
    'button[form="formThanhToan"]',
  );
  const duLieu = new FormData(form);
  const donHang = {
    tenNguoiNhan: document.getElementById("tenNhanHang").value.trim(),
    soDienThoai: document.getElementById("dienThoaiNhanHang").value.trim(),
    diaChiGiao: document.getElementById("diaChiNhanHang").value.trim(),
    phuongThucThanhToan: String(duLieu.get("phuongThuc") || ""),
    dongHang: cacMon.map((mon) => ({
      MaSP: mon.MaSP,
      SlBan: Number(mon.soLuong),
    })),
  };

  // 5. Khóa nút bấm và đổi trạng thái giao diện tránh việc bấm đặt trùng lặp
  dangTaoDonHang = true;
  if (nutDatHang) {
    nutDatHang.disabled = true;
    nutDatHang.textContent = "Đang tạo đơn hàng...";
  }

  try {
    // 6. Gửi request POST /api/don-hang lên máy chủ để xác thực và lưu vào MySQL
    const phanHoi = await goiApi("/api/don-hang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donHang),
    });
    if (!phanHoi?.donHang?.MaHD) {
      throw new TypeError("Máy chủ không trả về mã đơn hàng hợp lệ.");
    }

    // 7. Cập nhật trạng thái sau khi đặt hàng thành công:
    // Thêm đơn hàng mới vào danh sách đơn của tôi
    duLieuLuu.donHang = [phanHoi.donHang, ...duLieuLuu.donHang];
    // Làm sạch giỏ hàng và cập nhật số hiển thị về 0
    duLieuLuu.gioHang = [];
    daTaiDonHang = true;
    capNhatSoGio();
    luuDuLieu();
    // Tải lại danh sách sản phẩm để cập nhật tồn kho mới nhất từ máy chủ
    void taiSanPham();
    // Chuyển hướng giao diện về màn hình Quản lý đơn hàng
    chuyenTrang("don-hang");
    hienThongBao(`Đã tạo đơn hàng #${phanHoi.donHang.MaHD}.`);
  } catch (loi) {
    console.error("Không thể tạo đơn hàng.", loi);
    hienThongBao(loi.message || "Không thể tạo đơn hàng. Giỏ hàng vẫn được giữ lại.");
  } finally {
    // 8. Mở khóa nút bấm hoàn tất tiến trình
    dangTaoDonHang = false;
    if (form.isConnected && nutDatHang) {
      nutDatHang.disabled = false;
      nutDatHang.textContent = "Đặt hàng";
    }
  }
}

function hienBaiViet(maBai) {
  const bai = duLieuLuu.benhCay.find((mon) => mon.ma === maBai);
  if (!bai) return;
  const sanPhamGoiY = bai.sanPham
    .map((ma) => duLieuLuu.sanPham.find((mon) => mon.MaSP === ma))
    .filter(Boolean);
  document.getElementById("noiDungBaiViet").innerHTML =
    `<div class="dau-hop"><div><span class="nhan-mua">${bai.loai}</span><h2 style="margin:9px 0 0;font-size:24px">${bai.ten}</h2></div><button class="nut-dong" data-dong-hop aria-label="Đóng"><i data-lucide="x"></i></button></div><img class="anh-benh" src="${bai.anh}" alt="${bai.ten}"><p style="color:var(--phu);line-height:1.65">${bai.moTa}</p><h3 style="font-size:18px">Thông tin tham khảo</h3><p style="font-size:15.6px;line-height:1.6">Theo dõi các dấu hiệu mới trên lá và thân, ghi nhận điều kiện tưới nước, ánh sáng và độ thông thoáng. Xử lý từng bước theo hướng dẫn của chuyên gia tại địa phương và thông tin trên nhãn sản phẩm.</p><div class="ghi-chu">${taoIcon("triangle-alert")} Nội dung này chỉ mang tính tham khảo, không xác nhận nguyên nhân hoặc khuyến nghị liều lượng sử dụng.</div><h3 style="font-size:18px;margin:17px 0 8px">Vật tư có thể tham khảo</h3>${sanPhamGoiY.length ? sanPhamGoiY.map((mon) => `<div class="dong-gio">${mon.anh ? `<img src="${mon.anh}" alt="">` : `<div class="anh-san-pham-trong" aria-hidden="true">${taoIcon("package")}</div>`}<div><h3>${mon.TenSP}</h3><small>${dinhDangTien(mon.Giaban)}</small></div><button class="them-gio" data-them-gio="${mon.MaSP}" aria-label="Thêm vào giỏ">${taoIcon("plus")}</button></div>`).join("") : `<div class="o-rong">${taoIcon("package-open")}<strong>Chưa có sản phẩm liên quan</strong></div>`}`;
  oHopBaiViet.showModal();
  veIcon();
}

async function hienChiTietSanPham(maSanPham) {
  try {
    const sanPham = await goiApi(
      `/api/san-pham/${encodeURIComponent(maSanPham)}`,
    );
    if (!sanPham || !sanPham.MaSP)
      throw new TypeError("API không trả về thông tin sản phẩm hợp lệ.");
    const anhSanPham = sanPham.anh
      ? `<img class="max-h-[380px] w-full object-contain" src="${thoatHTML(sanPham.anh)}" alt="${thoatHTML(sanPham.TenSP)}">`
      : `<div class="grid min-h-[300px] w-full place-items-center text-center text-emerald-300" role="img" aria-label="Chưa có ảnh sản phẩm"><div>${taoIcon(iconTheoDanhMuc(sanPham), "mx-auto h-12 w-12")}<small class="mt-3 block text-xs text-gray-400">Chưa có ảnh sản phẩm</small></div></div>`;
    const soLuongTon = Number(sanPham.Soluong || 0);
    const sanPhamCungDanhMuc = duLieuLuu.sanPham
      .filter(
        (sp) =>
          sp.MaSP !== sanPham.MaSP &&
          (sp.DanhMuc || "") === (sanPham.DanhMuc || ""),
      )
      .slice(0, 4);

    document.getElementById("noiDungChiTietSanPham").innerHTML =
      `<div class="flex flex-col gap-5">
      <header class="flex items-center justify-between gap-3 border-b border-[#3f493f]/60 pb-3"><nav aria-label="Breadcrumb" class="flex min-w-0 items-center gap-2 text-[13.2px] text-gray-500"><span>Cửa hàng</span><span>/</span><span class="truncate">${thoatHTML(sanPham.DanhMuc || "Sản phẩm")}</span></nav><button class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#3f493f] text-gray-400 hover:bg-[#232c29] hover:text-white" data-dong-hop aria-label="Đóng"><span class="material-symbols-outlined">close</span></button></header>
      <div class="grid items-start gap-6 lg:grid-cols-12">
        <div class="flex flex-col gap-4 lg:col-span-6"><div class="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl border border-[#3f493f] bg-[#141d1a] p-5 sm:min-h-[380px]"><span class="absolute left-4 top-4 rounded bg-[#232c29] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-emerald-300">${thoatHTML(sanPham.DviTinh || "Sản phẩm")}</span>${anhSanPham}</div><div class="flex items-center justify-between gap-3 border-t border-[#3f493f]/60 pt-3 text-[12px] text-gray-500"><span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">image</span>Hình ảnh sản phẩm hiện có</span><span class="font-mono text-emerald-300">MÃ SP: ${thoatHTML(sanPham.MaSP)}</span></div>
          <div class="rounded-xl border border-[#3f493f] bg-[#18211e] p-4"><div class="flex items-start gap-3"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-amber-700/40 bg-amber-950/30 text-amber-300"><span class="material-symbols-outlined">info</span></span><div><strong class="text-xs text-gray-100">Thông tin chăm sóc cây</strong><p class="mt-1 text-[13.2px] leading-5 text-gray-400">Cẩm nang hiện là nội dung tham khảo; tính năng chẩn đoán tự động chưa được kết nối.</p><button class="mt-2 inline-flex items-center gap-1 text-[13.2px] font-semibold text-emerald-300 hover:text-emerald-200" data-xem="cam-nang">Mở cẩm nang ${taoIcon("arrow-right")}</button></div></div></div>
        </div>
        <section class="flex flex-col gap-4 lg:col-span-6"><div><div class="mb-2 flex flex-wrap items-center justify-between gap-2"><span class="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-emerald-300"><span class="material-symbols-outlined text-sm">inventory_2</span>${thoatHTML(sanPham.TenNCC || "Nhà cung cấp chưa có thông tin")}</span><span class="font-mono text-[12px] text-gray-500">MÃ SP: ${thoatHTML(sanPham.MaSP)}</span></div><h1 class="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">${thoatHTML(sanPham.TenSP)}</h1><p class="mt-2 text-xs text-gray-400">${thoatHTML(sanPham.DanhMuc || "Chưa phân loại")}${sanPham.NhomDanhMuc ? ` <span class="text-gray-600">/</span> ${thoatHTML(sanPham.NhomDanhMuc)}` : ""}</p></div>
          <div class="rounded-xl border border-[#3f493f] bg-[#141d1a] p-4"><span class="text-[12px] font-bold uppercase tracking-wider text-gray-500">Giá bán</span><div class="mt-1 text-2xl font-extrabold text-emerald-300">${dinhDangTien(Number(sanPham.Giaban || 0))}</div></div>
          <div class="grid grid-cols-2 gap-3"><div class="rounded-lg border border-[#3f493f] bg-[#141d1a] p-3"><span class="text-[12px] text-gray-500">Đơn vị tính</span><strong class="mt-1 block text-xs text-gray-100">${thoatHTML(sanPham.DviTinh || "Chưa có thông tin")}</strong></div><div class="rounded-lg border border-[#3f493f] bg-[#141d1a] p-3"><span class="text-[12px] text-gray-500">Tình trạng kho</span><strong class="mt-1 block text-xs ${soLuongTon > 0 ? "text-emerald-300" : "text-red-300"}">${soLuongTon > 0 ? `Còn ${thoatHTML(sanPham.Soluong)}` : "Tạm hết hàng"}</strong></div><div class="col-span-2 rounded-lg border border-[#3f493f] bg-[#141d1a] p-3"><span class="text-[12px] text-gray-500">Nhà cung cấp</span><strong class="mt-1 block text-xs text-gray-100">${thoatHTML(sanPham.TenNCC || "Chưa có thông tin")}</strong></div></div>
          <div class="flex flex-col gap-3 sm:flex-row"><button class="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50" data-them-gio="${thoatHTML(sanPham.MaSP)}" ${soLuongTon <= 0 ? "disabled" : ""}><span class="material-symbols-outlined">shopping_bag</span>Thêm vào giỏ</button><button class="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#3f493f] px-4 text-xs font-semibold text-gray-200 hover:bg-[#232c29]" data-dong-hop>Tiếp tục mua sắm</button></div>
          <p class="flex items-start gap-2 border-t border-[#3f493f]/60 pt-3 text-[12px] leading-5 text-gray-500"><span class="material-symbols-outlined text-sm">info</span>Thông tin hiển thị theo dữ liệu sản phẩm hiện có; không bao gồm đánh giá hoặc đặc tính chưa được cung cấp.</p>
        </section>
      </div>
      ${
        sanPhamCungDanhMuc.length
          ? `
        <section class="border-t border-[#3f493f]/60 pt-4">
          <h2 class="mb-3 text-sm font-bold text-white">Sản phẩm cùng danh mục (${thoatHTML(sanPham.DanhMuc)})</h2>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            ${sanPhamCungDanhMuc
              .map(
                (sp) => `
              <button type="button" data-chi-tiet="${thoatHTML(sp.MaSP)}" class="flex flex-col rounded-lg border border-[#3f493f] bg-[#141d1a] p-2.5 text-left transition-colors hover:border-emerald-500">
                <div class="mb-2 flex aspect-square w-full items-center justify-center rounded bg-[#07100d] p-2">
                  ${sp.anh ? `<img src="${thoatHTML(sp.anh)}" alt="" class="h-full w-full object-contain">` : `<span class="text-emerald-400">${taoIcon(iconTheoDanhMuc(sp))}</span>`}
                </div>
                <strong class="line-clamp-2 min-h-8 text-xs font-semibold text-gray-100">${thoatHTML(sp.TenSP)}</strong>
                <span class="mt-1 text-xs font-extrabold text-emerald-300">${dinhDangTien(sp.Giaban)}</span>
              </button>
            `,
              )
              .join("")}
          </div>
        </section>
      `
          : ""
      }
    </div>`;
    oHopChiTietSanPham.showModal();
    veIcon();
  } catch (loi) {
    console.error("Không thể tải chi tiết sản phẩm.", loi);
    hienThongBao(loi.message || "Không thể tải chi tiết sản phẩm.");
  }
}

document.addEventListener("click", async (suKien) => {
  const nutCapNhatTrangThai = suKien.target.closest(
    "[data-cap-nhat-trang-thai]",
  );
  if (nutCapNhatTrangThai) {
    const maHD = nutCapNhatTrangThai.dataset.capNhatTrangThai;
    const trangThai = nutCapNhatTrangThai
      .closest("tr")
      ?.querySelector("[data-chon-trang-thai]")?.value;
    if (!trangThai) return;
    if (
      trangThai === "da_hoan_hang" &&
      !window.confirm(
        "Chỉ xác nhận đã hoàn hàng khi cửa hàng đã nhận lại sản phẩm. Tồn kho sẽ được cộng lại.",
      )
    ) {
      return;
    }
    if (
      trangThai === "da_huy" &&
      !window.confirm("Hủy đơn hàng và hoàn lại số lượng vào tồn kho?")
    ) {
      return;
    }
    await capNhatDonHangQuanTri(maHD, { trangThai });
    return;
  }
  const nutCapNhatThanhToan = suKien.target.closest(
    "[data-cap-nhat-thanh-toan]",
  );
  if (nutCapNhatThanhToan) {
    const trangThaiThanhToan =
      nutCapNhatThanhToan.dataset.trangThaiThanhToan;
    const thongDiep =
      trangThaiThanhToan === "da_hoan_tien"
        ? "Xác nhận cửa hàng đã thực hiện hoàn tiền cho khách?"
        : "Xác nhận cửa hàng đã đối soát khoản chuyển khoản này?";
    if (!window.confirm(thongDiep)) return;
    await capNhatDonHangQuanTri(
      nutCapNhatThanhToan.dataset.capNhatThanhToan,
      { trangThaiThanhToan },
    );
    return;
  }
  if (suKien.target.closest("[data-tai-don-hang]")) {
    await taiDonHang(true);
    return;
  }
  if (suKien.target.closest("#nutXoaNhanhTimKiem")) {
    oTimKiem.value = "";
    capNhatNutXoaTimKiem();
    dongGoiYTimKiem();
    if (boLocHienTai.tuKhoa) {
      boLocHienTai.tuKhoa = "";
      trangSanPham = 1;
      veCuaHang();
      veIcon();
    }
    oTimKiem.focus();
    return;
  }
  const nutGoiY = suKien.target.closest("[data-chon-goi-y]");
  if (nutGoiY) {
    dongGoiYTimKiem();
    return void hienChiTietSanPham(nutGoiY.dataset.chonGoiY);
  }
  if (!suKien.target.closest("#formTimKiem")) {
    dongGoiYTimKiem();
  }
  if (suKien.target.closest("#nutLocYeuThich")) {
    boLocHienTai.chiYeuThich = !boLocHienTai.chiYeuThich;
    trangSanPham = 1;
    veCuaHang();
    veIcon();
    return;
  }
  if (suKien.target.closest("#nutApDungGiaCuaHang")) {
    boLocHienTai.khoangGia = "";
    boLocHienTai.giaTu =
      document.getElementById("locGiaTuCuaHang")?.value.trim() || "";
    boLocHienTai.giaDen =
      document.getElementById("locGiaDenCuaHang")?.value.trim() || "";
    trangSanPham = 1;
    veCuaHang();
    veIcon();
    return;
  }
  const nutTrangSanPham = suKien.target.closest("[data-trang-san-pham]");
  if (nutTrangSanPham && !nutTrangSanPham.disabled) {
    trangSanPham = Number(nutTrangSanPham.dataset.trangSanPham);
    veCuaHang();
    veIcon();
    duaSanPhamLenDau();
    return;
  }
  const nutMoDanhMuc = suKien.target.closest("#nutMoDanhMuc");
  if (nutMoDanhMuc) {
    menuDanhMucDangMo = !menuDanhMucDangMo;
    document
      .getElementById("menuDanhMuc")
      .classList.toggle("an", !menuDanhMucDangMo);
    nutMoDanhMuc.setAttribute("aria-expanded", String(menuDanhMucDangMo));
    return;
  }
  const nutDanhMucCha = suKien.target.closest("[data-mo-danh-muc]");
  if (nutDanhMucCha) {
    const tenDanhMuc = nutDanhMucCha.dataset.moDanhMuc;
    menuDanhMucDangMo = !(menuDanhMucDangMo && danhMucDangMo === tenDanhMuc);
    danhMucDangMo = tenDanhMuc;
    veCuaHang();
    veIcon();
    return;
  }
  const nutChonDanhMuc = suKien.target.closest("[data-chon-danh-muc]");
  if (nutChonDanhMuc) {
    boLocHienTai.danhMuc = nutChonDanhMuc.dataset.chonDanhMuc;
    boLocHienTai.nhomDanhMuc = "";
    boLocHienTai.chiYeuThich = false;
    trangSanPham = 1;
    menuDanhMucDangMo = false;
    veCuaHang();
    veIcon();
    return;
  }
  const nutChonNhomDanhMuc = suKien.target.closest("[data-chon-nhom-danh-muc]");
  if (nutChonNhomDanhMuc) {
    boLocHienTai.danhMuc = nutChonNhomDanhMuc.dataset.danhMucCha;
    boLocHienTai.nhomDanhMuc = nutChonNhomDanhMuc.dataset.chonNhomDanhMuc;
    boLocHienTai.chiYeuThich = false;
    trangSanPham = 1;
    danhMucDangMo = boLocHienTai.danhMuc;
    menuDanhMucDangMo = false;
    veCuaHang();
    veIcon();
    return;
  }
  if (suKien.target.closest("[data-xoa-loc-danh-muc], [data-xoa-bo-loc]")) {
    boLocHienTai = {
      tuKhoa: "",
      danhMuc: "",
      nhomDanhMuc: "",
      nhaCungCap: "",
      khoangGia: "",
      giaTu: "",
      giaDen: "",
      chiConHang: false,
      chiYeuThich: false,
    };
    thuTuSapXep = "mac-dinh";
    oTimKiem.value = "";
    capNhatNutXoaTimKiem();
    trangSanPham = 1;
    menuDanhMucDangMo = false;
    veCuaHang();
    veIcon();
    return;
  }
  if (!suKien.target.closest("[data-cua-hang-danh-muc]") && menuDanhMucDangMo) {
    menuDanhMucDangMo = false;
    document
      .querySelectorAll("[data-cua-hang-danh-muc] .danh-muc-nhom")
      .forEach((menu) => menu.remove());
    document
      .querySelectorAll("[data-cua-hang-danh-muc] [data-mo-danh-muc]")
      .forEach((nut) => {
        nut.setAttribute("aria-expanded", "false");
        nut.innerHTML = taoIcon("chevron-right");
      });
  }
  const nutTrang = suKien.target.closest("[data-xem]");
  if (nutTrang) {
    nutTrang.closest("dialog[open]")?.close();
    return chuyenTrang(nutTrang.dataset.xem);
  }
  const nutChiTiet = suKien.target.closest("[data-chi-tiet]");
  if (
    nutChiTiet &&
    (!nutChiTiet.matches("article") || !suKien.target.closest("button"))
  ) {
    return void hienChiTietSanPham(nutChiTiet.dataset.chiTiet);
  }
  const nutThem = suKien.target.closest("[data-them-gio]");
  if (nutThem) return themVaoGio(nutThem.dataset.themGio);
  const nutThich = suKien.target.closest("[data-thich]");
  if (nutThich) {
    const maSanPham = nutThich.dataset.thich;
    const daThich = duLieuLuu.yeuThich.includes(maSanPham);
    duLieuLuu.yeuThich = daThich
      ? duLieuLuu.yeuThich.filter((ma) => ma !== maSanPham)
      : [...duLieuLuu.yeuThich, maSanPham];
    luuDuLieu();
    veCuaHang();
    veIcon();
    hienThongBao(
      daThich
        ? "Đã bỏ khỏi danh sách yêu thích."
        : "Đã thêm vào danh sách yêu thích.",
    );
    return;
  }
  if (suKien.target.closest("#nutMoGio, #nutGioDiDong")) return moGioHang();
  if (suKien.target.closest("#nutDongGio, #lopPhu")) return dongGioHang();
  if (suKien.target.closest("[data-giam-gio]"))
    return capNhatSoLuongGio(
      suKien.target.closest("[data-giam-gio]").dataset.giamGio,
      -1,
    );
  if (suKien.target.closest("[data-tang-gio]"))
    return capNhatSoLuongGio(
      suKien.target.closest("[data-tang-gio]").dataset.tangGio,
      1,
    );
  if (suKien.target.closest("[data-bo-gio]")) {
    duLieuLuu.gioHang = duLieuLuu.gioHang.filter(
      (mon) =>
        mon.MaSP !== suKien.target.closest("[data-bo-gio]").dataset.boGio,
    );
    luuDuLieu();
    return capNhatHienThiGioHang();
  }
  const nutTab = suKien.target.closest("[data-tab-quan-tri]");
  if (nutTab) {
    tabQuanTri = nutTab.dataset.tabQuanTri;
    if (tabQuanTri === "nhat-ky") taiNhatKy();
    return veQuanTri();
  }
  if (suKien.target.closest("[data-lam-moi-san-pham]")) {
    dangTaiSanPham = true;
    loiTaiSanPham = false;
    veQuanTri();
    await taiSanPham();
    return;
  }
  if (suKien.target.closest("#nutThemSanPham")) {
    if (!coQuyenUI("san_pham.them")) return;
    maSanPhamDangSua = "";
    return veQuanTri();
  }
  if (suKien.target.closest("[data-dong-san-pham], #nutHuySanPham")) {
    maSanPhamDangSua = null;
    if (oHopSanPham?.open) oHopSanPham.close();
    return veQuanTri();
  }
  const nutSuaSanPham = suKien.target.closest("[data-sua-san-pham]");
  if (nutSuaSanPham) {
    if (!coQuyenUI("san_pham.sua")) return;
    maSanPhamDangSua = nutSuaSanPham.dataset.suaSanPham;
    return veQuanTri();
  }
  const nutXoaSanPham = suKien.target.closest("[data-xoa-san-pham]");
  if (nutXoaSanPham) {
    const maSP = nutXoaSanPham.dataset.xoaSanPham;
    if (!coQuyenUI("san_pham.xoa")) {
      hienThongBao("Chỉ quản trị viên mới được xóa vĩnh viễn sản phẩm.");
      return;
    }
    if (
      !window.confirm(`Xóa sản phẩm ${maSP}? Thao tác này không thể hoàn tác.`)
    )
      return;
    try {
      await goiApi(`/api/san-pham/${encodeURIComponent(maSP)}`, {
        method: "DELETE",
      });
      duLieuLuu.gioHang = duLieuLuu.gioHang.filter((mon) => mon.MaSP !== maSP);
      maSanPhamDangSua = null;
      dangTaiSanPham = true;
      await taiSanPham();
      hienThongBao("Đã xóa sản phẩm khỏi kho.");
    } catch (loi) {
      console.error("Không thể xóa sản phẩm.", loi);
      hienThongBao(loi.message || "Không thể xóa sản phẩm.");
    }
    return;
  }
  const nutAnSanPham = suKien.target.closest(
    "[data-an-san-pham], [data-khoi-phuc-san-pham]",
  );
  if (nutAnSanPham) {
    const khoiPhuc = nutAnSanPham.hasAttribute("data-khoi-phuc-san-pham");
    const maSP = khoiPhuc
      ? nutAnSanPham.dataset.khoiPhucSanPham
      : nutAnSanPham.dataset.anSanPham;
    try {
      await goiApi(
        `/api/san-pham/${encodeURIComponent(maSP)}/${khoiPhuc ? "khoi-phuc" : "an"}`,
        { method: "POST" },
      );
      dangTaiSanPham = true;
      await taiSanPham();
      hienThongBao(
        khoiPhuc ? "Đã khôi phục sản phẩm." : "Đã ẩn sản phẩm khỏi cửa hàng.",
      );
    } catch (loi) {
      hienThongBao(loi.message || "Không thể cập nhật sản phẩm.");
    }
    return;
  }
  const nutKhoaTaiKhoan = suKien.target.closest("[data-khoa-tai-khoan]");
  if (nutKhoaTaiKhoan) {
    const hoatDong = nutKhoaTaiKhoan.dataset.hoatDong === "1";
    const maTK = nutKhoaTaiKhoan.dataset.khoaTaiKhoan;
    if (!window.confirm(`${hoatDong ? "Mở khóa" : "Khóa"} tài khoản ${maTK}?`))
      return;
    try {
      await goiApi(`/api/tai-khoan/${encodeURIComponent(maTK)}/trang-thai`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoatDong }),
      });
      hienThongBao(hoatDong ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.");
    } catch (loi) {
      hienThongBao(loi.message || "Không thể cập nhật tài khoản.");
    }
    await lamMoiDuLieuQuanTri();
    return;
  }
  const nutDoiNguoi = suKien.target.closest("[data-doi-nguoi-dung]");
  if (nutDoiNguoi) {
    const nguoiDung = duLieuLuu.nguoiDung.find(
      (mon) => mon.ma === nutDoiNguoi.dataset.doiNguoiDung,
    );
    if (nguoiDung)
      nguoiDung.trangThai =
        nguoiDung.trangThai === "Hoạt động" ? "Tạm khóa" : "Hoạt động";
    luuDuLieu();
    return veQuanTri();
  }
  const nutDocBai = suKien.target.closest("[data-doc-bai]");
  if (nutDocBai) return hienBaiViet(nutDocBai.dataset.docBai);
  if (suKien.target.closest("[data-dong-hop]")) {
    oHopTaiKhoan.close();
    oHopBaiViet.close();
    oHopChiTietSanPham.close();
  }
  if (suKien.target.closest("#nutDangXuat, [data-admin-logout]")) {
    try {
      const phanHoi = await goiApi("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      tokenCsrf = phanHoi.csrfToken;
      duLieuLuu.taiKhoan = null;
      try {
        localStorage.removeItem(KHOA_TAI_KHOAN_GAN_NHAT);
      } catch {}
      // Chuyển sang giỏ hàng khách
      dongBoGioHangKhiDangXuat();
      duLieuLuu.donHang = [];
      daTaiDonHang = false;
      capNhatGiaoDienTaiKhoan();
      if (vaiTroYeuCau) {
        window.location.assign("/index.html");
        return;
      }
      chuyenTrang("cua-hang");
      hienThongBao("Đã đăng xuất.");
    } catch (loi) {
      console.error("Không thể đăng xuất.", loi);
      hienThongBao(loi.message || "Không thể đăng xuất.");
    }
    return;
  }
  const nutBatTatMatKhau = suKien.target.closest("[data-bat-tat-mat-khau]");
  if (nutBatTatMatKhau) {
    const oInput = document.getElementById(
      nutBatTatMatKhau.dataset.batTatMatKhau,
    );
    if (oInput) {
      const dangAn = oInput.type === "password";
      oInput.type = dangAn ? "text" : "password";
      nutBatTatMatKhau.setAttribute(
        "aria-label",
        dangAn ? "Ẩn mật khẩu" : "Hiện mật khẩu",
      );
      nutBatTatMatKhau.innerHTML = taoIcon(dangAn ? "eye-off" : "eye");
      veIcon();
    }
    return;
  }
  const nutGuiMaOtp = suKien.target.closest("#nutGuiMaOtp");
  if (nutGuiMaOtp) return void xuLyGuiMaOtp(nutGuiMaOtp);
  const nutCheDo = suKien.target.closest("[data-mo-che-do-tai-khoan]");
  if (nutCheDo) return moHopTaiKhoan(nutCheDo.dataset.moCheDoTaiKhoan);
  if (suKien.target.closest("#nutMoDangNhap"))
    return moHopTaiKhoan("dang-nhap");
  if (suKien.target.closest("#nutMoDangKy")) return moHopTaiKhoan("dang-ky");
  if (suKien.target.closest("#nutTaiKhoan"))
    return duLieuLuu.taiKhoan
      ? chuyenTrang("tai-khoan")
      : moHopTaiKhoan("dang-nhap");
  if (suKien.target.closest("[data-xuong]")) duaSanPhamLenDau();
});

document.addEventListener("change", (suKien) => {
  if (suKien.target.id === "locNhaCungCapCuaHang") {
    boLocHienTai.nhaCungCap = suKien.target.value;
    trangSanPham = 1;
    veCuaHang();
    veIcon();
    return;
  }
  if (suKien.target.id === "locKhoangGiaCuaHang") {
    boLocHienTai.khoangGia = suKien.target.value;
    boLocHienTai.giaTu = "";
    boLocHienTai.giaDen = "";
    trangSanPham = 1;
    veCuaHang();
    veIcon();
    return;
  }
  if (suKien.target.id === "locChiConHangCuaHang") {
    boLocHienTai.chiConHang = suKien.target.checked;
    trangSanPham = 1;
    veCuaHang();
    veIcon();
    return;
  }
  if (suKien.target.id === "sapXepSanPham") {
    thuTuSapXep = suKien.target.value;
    trangSanPham = 1;
    veCuaHang();
    veIcon();
    return;
  }
  if (suKien.target.id === "tepAnhCay") {
    const tep = suKien.target.files?.[0];
    if (!tep) return;
    if (!tep.type.startsWith("image/") || tep.size > 10 * 1024 * 1024) {
      suKien.target.value = "";
      hienThongBao("Chọn ảnh hợp lệ có dung lượng tối đa 10 MB.");
      return;
    }
    if (urlAnhCayXemTruoc) URL.revokeObjectURL(urlAnhCayXemTruoc);
    urlAnhCayXemTruoc = URL.createObjectURL(tep);
    document.getElementById("noiDungTaiAnh").innerHTML =
      `<img class="st-preview-image" src="${urlAnhCayXemTruoc}" alt="Ảnh cây bạn vừa chọn"><strong>${thoatHTML(tep.name)}</strong><p>Ảnh chỉ được xem trước trên thiết bị này; chưa có chức năng gửi ảnh phân tích.</p><label class="nut-phu" for="tepAnhCay">${taoIcon("image-plus")} Chọn ảnh khác</label><input id="tepAnhCay" class="sr-only" type="file" accept="image/*" capture="environment" aria-label="Chọn ảnh khác">`;
    veIcon();
    return;
  }
  if (suKien.target.id === "locDanhMucKho") locDanhMucKho = suKien.target.value;
  if (suKien.target.id === "locTonKho") locTonKho = suKien.target.value;
  if (suKien.target.id === "sapXepKho") sapXepKho = suKien.target.value;
  if (suKien.target.id === "locTrangThaiHoaDon")
    locTrangThaiHoaDon = suKien.target.value;
  if (suKien.target.id === "locVaiTroTaiKhoan")
    locVaiTroTaiKhoan = suKien.target.value;
  if (
    suKien.target.matches(
      "#locDanhMucKho, #locTonKho, #sapXepKho, #locTrangThaiHoaDon, #locVaiTroTaiKhoan",
    )
  )
    apDungBoLocQuanTri();
});

document.addEventListener("input", (suKien) => {
  if (suKien.target.dataset?.doManhMatKhau) {
    capNhatThangDoMatKhau(suKien.target);
    return;
  }
  if (suKien.target.id === "timKhoQuanTri") tuKhoaKho = suKien.target.value;
  if (suKien.target.id === "timHoaDonQuanTri")
    tuKhoaHoaDon = suKien.target.value;
  if (suKien.target.id === "timTaiKhoanQuanTri")
    tuKhoaTaiKhoan = suKien.target.value;
  if (
    suKien.target.matches(
      "#timKhoQuanTri, #timHoaDonQuanTri, #timTaiKhoanQuanTri",
    )
  )
    apDungBoLocQuanTri();
});

document.addEventListener("submit", async (suKien) => {
  if (suKien.target.id === "formTimKiem") {
    suKien.preventDefault();
    dongGoiYTimKiem();
    boLocHienTai.tuKhoa = oTimKiem.value.trim();
    trangSanPham = 1;
    chuyenTrang("cua-hang");
  }
  if (suKien.target.id === "formTaiKhoan") {
    await xuLyDangNhap(suKien);
    return;
  }
  if (suKien.target.id === "formSanPham") {
    suKien.preventDefault();
    const form = suKien.target;
    const nutLuu = form.querySelector('[type="submit"]');
    nutLuu.disabled = true;
    try {
      const duLieu = Object.fromEntries(new FormData(form).entries());
      const dangSua = maSanPhamDangSua !== "";
      const duongDan = dangSua
        ? `/api/san-pham/${encodeURIComponent(maSanPhamDangSua)}`
        : "/api/san-pham";
      await goiApi(duongDan, {
        method: dangSua ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duLieu),
      });
      maSanPhamDangSua = null;
      if (oHopSanPham?.open) oHopSanPham.close();
      dangTaiSanPham = true;
      await taiSanPham();
      hienThongBao(
        dangSua ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm vào kho.",
      );
    } catch (loi) {
      console.error("Không thể lưu sản phẩm.", loi);
      hienThongBao(loi.message || "Không thể lưu sản phẩm.");
      nutLuu.disabled = false;
    }
    return;
  }
  if (suKien.target.id === "formThanhToan") xuLyDatHang(suKien);
});

document.getElementById("formTimKiem").addEventListener("input", (suKien) => {
  const giaTri = suKien.target.value;
  capNhatNutXoaTimKiem();
  hienThiGoiYTimKiem(giaTri);
  if (!giaTri.trim() && trangHienTai === "cua-hang" && boLocHienTai.tuKhoa) {
    boLocHienTai.tuKhoa = "";
    trangSanPham = 1;
    veCuaHang();
    veIcon();
  }
});
document.getElementById("hopTaiKhoan").addEventListener("click", (suKien) => {
  if (suKien.target === oHopTaiKhoan) oHopTaiKhoan.close();
});
document.getElementById("hopBaiViet").addEventListener("click", (suKien) => {
  if (suKien.target === oHopBaiViet) oHopBaiViet.close();
});
oHopChiTietSanPham.addEventListener("click", (suKien) => {
  if (suKien.target === oHopChiTietSanPham) oHopChiTietSanPham.close();
});
document.getElementById("nutDongGio").addEventListener("click", dongGioHang);
document.getElementById("lopPhu").addEventListener("click", dongGioHang);
if (oHopSanPham) {
  oHopSanPham.addEventListener("click", (suKien) => {
    if (suKien.target === oHopSanPham) {
      maSanPhamDangSua = null;
      oHopSanPham.close();
    }
  });
  oHopSanPham.addEventListener("close", () => {
    maSanPhamDangSua = null;
  });
}

let duLieuNhatKy = [];
let dangTaiNhatKy = false;
let loiNhatKy = false;

async function lamMoiDuLieuQuanTri() {
  daTaiDuLieuQuanTri = false;
  await taiDuLieuQuanTri();
}

async function taiNhatKy() {
  if (dangTaiNhatKy) return;
  dangTaiNhatKy = true;
  loiNhatKy = false;
  try {
    const duLieu = await goiApi("/api/nhat-ky");
    duLieuNhatKy = Array.isArray(duLieu.nhatKy) ? duLieu.nhatKy : [];
  } catch (loi) {
    loiNhatKy = true;
    console.error("Không thể tải nhật ký hoạt động.", loi);
  } finally {
    dangTaiNhatKy = false;
    if (trangHienTai === "quan-tri" && tabQuanTri === "nhat-ky") {
      veQuanTri();
      veIcon();
    }
  }
}

function veNhatKy() {
  if (dangTaiNhatKy)
    return `<div class="rounded-xl border border-[#213831] bg-[#14201c] p-8 text-center text-sm text-gray-400">Đang tải nhật ký...</div>`;
  if (loiNhatKy)
    return `<div class="rounded-xl border border-[#213831] bg-[#14201c] p-8 text-center text-sm text-red-300" role="alert">Không thể tải nhật ký hoạt động.</div>`;
  const hang = duLieuNhatKy
    .map(
      (m) =>
        `<tr><td class="px-4 py-3 font-mono text-gray-400">${thoatHTML(m.ThoiGian)}</td><td class="px-4 py-3 font-semibold text-white">${thoatHTML(m.TenTK || "(đã xóa)")} <small class="text-gray-500">${thoatHTML(m.VaiTro || "")}</small></td><td class="px-4 py-3 text-emerald-300">${thoatHTML(m.HanhDong)}</td><td class="px-4 py-3">${thoatHTML(m.DoiTuong)} ${thoatHTML(m.MaDoiTuong || "")}</td><td class="px-4 py-3 text-gray-400">${thoatHTML(m.ChiTiet || "")}</td></tr>`,
    )
    .join("");
  return `<section class="overflow-hidden rounded-xl border border-[#213831] bg-[#14201c]"><div class="overflow-x-auto"><table class="w-full min-w-[720px] border-collapse text-left text-xs text-gray-300"><thead class="border-b border-[#1f332c] bg-[#0f1915] text-[12px] uppercase tracking-wider text-gray-400"><tr><th class="px-4 py-3 font-semibold">Thời gian</th><th class="px-4 py-3 font-semibold">Người thực hiện</th><th class="px-4 py-3 font-semibold">Hành động</th><th class="px-4 py-3 font-semibold">Đối tượng</th><th class="px-4 py-3 font-semibold">Chi tiết</th></tr></thead><tbody class="divide-y divide-[#1b2b25]">${hang || '<tr><td class="px-4 py-8 text-center text-gray-400" colspan="5">Chưa có hoạt động nào được ghi.</td></tr>'}</tbody></table></div></section>`;
}

document.addEventListener("change", async (suKien) => {
  const oChonVaiTro = suKien.target.closest?.("[data-doi-vai-tro]");
  if (!oChonVaiTro) return;
  const maTK = oChonVaiTro.dataset.doiVaiTro;
  if (!window.confirm(`Đổi vai trò tài khoản ${maTK} thành "${oChonVaiTro.value}"?`)) {
    veQuanTri();
    veIcon();
    return;
  }
  try {
    await goiApi(`/api/tai-khoan/${encodeURIComponent(maTK)}/vai-tro`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vaiTro: oChonVaiTro.value }),
    });
    hienThongBao("Đã cập nhật vai trò.");
  } catch (loi) {
    hienThongBao(loi.message || "Không thể đổi vai trò.");
  }
  await lamMoiDuLieuQuanTri();
});

document.addEventListener("submit", async (suKien) => {
  if (suKien.target.id !== "formTaoNhanVien") return;
  suKien.preventDefault();
  const duLieu = Object.fromEntries(new FormData(suKien.target).entries());
  try {
    await goiApi("/api/tai-khoan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duLieu),
    });
    hienThongBao("Đã tạo tài khoản nhân viên.");
    await lamMoiDuLieuQuanTri();
  } catch (loi) {
    hienThongBao(loi.message || "Không thể tạo tài khoản.");
  }
});

async function khoiDong() {
  khoiTaoNutXoaTimKiem();
  docBoLocTuUrl();
  capNhatGiaoDienTaiKhoan();
  capNhatSoGio();

  try {
    const phien = await goiApi("/api/auth/session");
    tokenCsrf = phien.csrfToken;
    duLieuLuu.taiKhoan = phien.nguoiDung;
    if (duLieuLuu.taiKhoan) {
      try {
        localStorage.setItem(
          KHOA_TAI_KHOAN_GAN_NHAT,
          duLieuLuu.taiKhoan.id || duLieuLuu.taiKhoan.tenTaiKhoan || "",
        );
      } catch {}
      duLieuLuu.gioHang = docGioHangTuStorage();
    } else {
      try {
        localStorage.removeItem(KHOA_TAI_KHOAN_GAN_NHAT);
      } catch {}
      duLieuLuu.gioHang = docGioHangTuStorage(`${TIEN_TO_KHOA_GIO_HANG}khach`);
    }
    capNhatHienThiGioHang();
  } catch (loi) {
    console.error("Không thể kiểm tra phiên đăng nhập.", loi);
    hienThongBao(
      "Không thể kiểm tra đăng nhập. Hãy tải lại trang nếu cần đăng nhập.",
    );
  }
  await taiPhuongThucThanhToan();
  capNhatGiaoDienTaiKhoan();
  const vaiTro = duLieuLuu.taiKhoan?.vaiTro;
  const laQuanTri = vaiTro === "nhan_vien" || vaiTro === "admin";

  if (vaiTroYeuCau && vaiTro !== vaiTroYeuCau) {
    if (laQuanTri) {
      window.location.replace(duongDanTrangVaiTro(vaiTro));
    } else {
      window.location.replace("/index.html?dang-nhap=1");
    }
    return;
  }
  chuyenTrang(trangVao);
  taiSanPham();

  if (new URLSearchParams(window.location.search).has("dang-nhap")) {
    window.history.replaceState({}, "", window.location.pathname);
    moHopTaiKhoan("dang-nhap");
  }
}

void khoiDong();
