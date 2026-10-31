const duLieuMacDinh = {
  sanPham: [],
  benhCay: [],
  nguoiDung: [],
  gioHang: [],
  donHang: [],
  taiKhoan: null,
  yeuThich: []
};
const duLieuLuu = structuredClone(duLieuMacDinh);
const duLieuQuanTri = { donHang: [], taiKhoan: [] };
let dangTaiSanPham = true;
let loiTaiSanPham = false;
let dangTaiDuLieuQuanTri = false;
let daTaiDuLieuQuanTri = false;
let loiTaiDuLieuQuanTri = false;
const trangVao = document.body.dataset.trangVao || "cua-hang";
const vaiTroYeuCau = document.body.dataset.vaiTroYeuCau || "";
let trangHienTai = trangVao;
let tabQuanTri = "tong-quan";
let tokenCsrf = "";
let cheDoTaiKhoan = "dang-nhap";
let maSanPhamDangSua = null;
let boLocHienTai = { tuKhoa: "", danhMuc: "", nhomDanhMuc: "" };
const soSanPhamMoiTrang = 20;
let trangSanPham = 1;
let danhMucDangMo = "Mẫu Chậu Mới 2026";
let menuDanhMucDangMo = false;
const danhSachDanhMuc = [
  { ten: "Mẫu Chậu Mới 2026", nhom: ["Chậu nhựa mềm", "Khay & kệ trồng rau", "Chậu trồng", "Chậu trồng lan", "Chậu trồng hoa hồng", "Chậu treo & ốp tường", "Bầu ươm", "Chậu loại khác", "Chậu vuông", "Chậu tròn", "Chậu chữ nhật", "Chậu cây cảnh"] },
  { ten: "Đất Sạch & Giá Thể", nhom: ["Đất sạch trồng rau", "Đất trồng cây", "Giá thể trồng cây", "Xơ dừa & mụn dừa", "Đá perlite & vermiculite"] },
  { ten: "Phân Bón", nhom: ["Phân hữu cơ", "Phân NPK", "Phân bón lá", "Phân vi sinh", "Phân tan chậm"] },
  { ten: "Hạt Giống", nhom: ["Hạt giống rau", "Hạt giống hoa", "Hạt giống củ quả", "Hạt giống gia vị"] },
  { ten: "Kích Thích Sinh Trưởng", nhom: ["Kích rễ", "Kích chồi", "Dưỡng lá", "Dưỡng hoa & trái"] },
  { ten: "Vật Tư Aquaponics", nhom: ["Máy bơm & sục khí", "Ống và phụ kiện", "Vật liệu lọc", "Dung dịch thủy canh"] },
  { ten: "Vật Tư Kiểng Lá", nhom: ["Đất trộn kiểng lá", "Chậu kiểng lá", "Phân bón kiểng lá", "Dụng cụ chăm sóc"] },
  { ten: "Vật Tư Trồng Lan", nhom: ["Chậu trồng lan", "Giá thể trồng lan", "Phân bón cho lan", "Móc treo & phụ kiện"] },
  { ten: "Vật Tư Trồng Rau", nhom: ["Khay trồng rau", "Đất trồng rau", "Phân bón rau", "Dụng cụ làm vườn"] },
  { ten: "Vật Tư Trồng Hoa Kiểng", nhom: ["Chậu trồng hoa", "Đất & giá thể", "Phân bón hoa", "Dụng cụ cắt tỉa"] },
  { ten: "Vật Tư Trồng Hoa Hồng", nhom: ["Đất trồng hoa hồng", "Phân bón hoa hồng", "Thuốc dưỡng hoa hồng", "Kéo cắt tỉa"] },
  { ten: "Vật Tư Trồng Bonsai", nhom: ["Đất trồng bonsai", "Chậu bonsai", "Phân bón bonsai", "Dụng cụ bonsai"] },
  { ten: "Vật Tư Ươm Giống", nhom: ["Khay ươm", "Bầu ươm", "Giá thể ươm", "Dụng cụ gieo hạt"] },
  { ten: "Vật Tư Thủy Canh", nhom: ["Dung dịch thủy canh", "Rọ thủy canh", "Máy bơm & sục khí", "Bút đo pH và EC"] },
  { ten: "Thuốc Bảo Vệ Thực Vật", nhom: ["Trừ sâu", "Trừ bệnh", "Trừ nấm", "Chế phẩm sinh học"] },
  { ten: "Dụng Cụ Làm Vườn", nhom: ["Bình tưới", "Dụng cụ chăm sóc", "Kéo cắt tỉa"] },
  { ten: "Vật Tư Khác", nhom: ["Vật tư khác"] }
];
let henThongBao;
const oNoiDung = document.getElementById("noi-dung");
const oTimKiem = document.getElementById("oTimKiem");
const oHopTaiKhoan = document.getElementById("hopTaiKhoan");
const oHopBaiViet = document.getElementById("hopBaiViet");
const oHopChiTietSanPham = document.getElementById("hopChiTietSanPham");

function luuDuLieu() {
  capNhatSoGio();
}

async function goiApi(duongDan, tuyChon = {}) {
  const phuongThuc = (tuyChon.method || "GET").toUpperCase();
  const headers = new Headers(tuyChon.headers || {});
  headers.set("Accept", "application/json");
  if (!["GET", "HEAD"].includes(phuongThuc)) {
    if (!tokenCsrf) throw new Error("Phiên làm việc chưa sẵn sàng. Hãy tải lại trang.");
    headers.set("X-CSRF-Token", tokenCsrf);
  }

  const phanHoi = await fetch(duongDan, {
    ...tuyChon,
    method: phuongThuc,
    credentials: "same-origin",
    headers
  });
  let duLieu = null;
  if (phanHoi.status !== 204) {
    try {
      duLieu = await phanHoi.json();
    } catch {
      throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
    }
  }
  if (!phanHoi.ok) {
    throw new Error(duLieu?.error?.message || `Yêu cầu thất bại (HTTP ${phanHoi.status}).`);
  }
  return duLieu;
}

function capNhatGiaoDienTaiKhoan() {
  const taiKhoan = duLieuLuu.taiKhoan;
  const laQuanTri = taiKhoan?.vaiTro === "nhan_vien" || taiKhoan?.vaiTro === "admin";
  const nutTaiKhoan = document.getElementById("nutTaiKhoan");
  nutTaiKhoan.textContent = taiKhoan ? taiKhoan.ten.split(" ")[0] : "Đăng nhập";
  nutTaiKhoan.setAttribute("aria-label", taiKhoan ? `Tài khoản ${taiKhoan.ten}` : "Đăng nhập");
  document.querySelectorAll('[data-xem="quan-tri"]').forEach(nut => {
    nut.hidden = !laQuanTri;
    nut.classList.toggle("an", !laQuanTri);
  });
  document.querySelector(".di-dong-nav").classList.toggle("co-quan-tri", laQuanTri);
}

function dinhDangTien(soTien) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(soTien);
}

function taoIcon(tenIcon, lop = "") {
  return `<i data-lucide="${tenIcon}" class="${lop}" aria-hidden="true"></i>`;
}

function thoatHTML(giaTri) {
  return String(giaTri ?? "").replace(/[&<>"']/g, kyTu => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[kyTu]);
}

function veIcon() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function iconTheoDanhMuc(sanPham) {
  const chuoi = `${sanPham.DanhMuc || ""} ${sanPham.TenSP || ""}`.toLocaleLowerCase("vi");
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
  const oThongBao = document.getElementById("thongBao");
  oThongBao.textContent = noiDung;
  oThongBao.classList.add("dang-hien");
  clearTimeout(henThongBao);
  henThongBao = setTimeout(() => oThongBao.classList.remove("dang-hien"), 2600);
}

async function taiSanPham() {
  try {
    const sanPham = await goiApi("/api/san-pham");
    if (!Array.isArray(sanPham)) throw new TypeError("API không trả về danh sách sản phẩm hợp lệ.");
    duLieuLuu.sanPham = sanPham;
    loiTaiSanPham = false;
  } catch (loi) {
    loiTaiSanPham = true;
    console.error("Không thể tải danh sách sản phẩm từ API.", loi);
    hienThongBao("Không thể kết nối dữ liệu sản phẩm.");
  } finally {
    dangTaiSanPham = false;
    if (trangHienTai === "cua-hang" || trangHienTai === "quan-tri") veTrang();
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

document.addEventListener("error", suKien => {
  const anh = suKien.target;
  if (!(anh instanceof HTMLImageElement)) return;

  if (anh.classList.contains("san-pham-anh")) {
    const theSanPham = anh.closest(".the-san-pham");
    const sanPham = duLieuLuu.sanPham.find(mon => String(mon.MaSP) === anh.dataset.maSanPham);
    if (theSanPham && sanPham) {
      theSanPham.querySelector(".san-pham-anh")?.replaceWith(document.createRange().createContextualFragment(taoAnhThayThe(sanPham, true)));
      veIcon();
      return;
    }
    const oTrong = document.createElement("div");
    oTrong.className = "san-pham-anh san-pham-anh-trong";
    oTrong.setAttribute("role", "img");
    oTrong.setAttribute("aria-label", anh.alt || "Ảnh sản phẩm không khả dụng");
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
}, true);

function capNhatSoGio() {
  const soLuong = duLieuLuu.gioHang.reduce((tong, mon) => tong + mon.soLuong, 0);
  document.getElementById("soLuongGio").textContent = soLuong;
  document.getElementById("nhanSoGio").textContent = `(${soLuong})`;
}

function chuyenTrang(trangMoi) {
  if (trangMoi === "quan-tri" && !["nhan_vien", "admin"].includes(duLieuLuu.taiKhoan?.vaiTro)) {
    hienThongBao("Bạn cần tài khoản nhân viên hoặc admin để mở trang quản trị.");
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
  trangHienTai = trangMoi;
  document.querySelectorAll("[data-xem]").forEach(nut => {
    const dangChon = nut.dataset.xem === trangMoi;
    nut.classList.toggle("dang-chon", dangChon);
    if (nut.classList.contains("nut-nav")) nut.setAttribute("aria-current", dangChon ? "page" : "false");
  });
  veTrang();
  if (trangMoi === "quan-tri") taiDuLieuQuanTri();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function duongDanTrangVaiTro(vaiTro) {
  return vaiTro === "admin" ? "/pages/admin.html" : "/pages/nhan-vien.html";
}

function veTrang() {
  oNoiDung.classList.toggle("trang-cua-hang", trangHienTai === "cua-hang");
  const hamVe = {
    "cua-hang": veCuaHang,
    "cam-nang": veCamNang,
    "don-hang": veDonHang,
    "tai-khoan": veTaiKhoan,
    "quan-tri": veQuanTri
  };
  (hamVe[trangHienTai] || veCuaHang)();
  veIcon();
}

function veSanPham(sanPham) {
  const maSP = thoatHTML(sanPham.MaSP);
  const tenSP = thoatHTML(sanPham.TenSP);
  return `<article class="the-san-pham" data-chi-tiet="${maSP}">
    ${sanPham.anh ? `<img class="san-pham-anh" data-ma-san-pham="${maSP}" alt="${tenSP}" src="${thoatHTML(sanPham.anh)}" loading="lazy" decoding="async">` : taoAnhThayThe(sanPham)}
    <span class="nhan-san-pham">${thoatHTML(sanPham.DviTinh)}</span>
    <button class="nut-yeu-thich ${duLieuLuu.yeuThich.includes(sanPham.MaSP) ? "da-thich" : ""}" data-thich="${maSP}" aria-label="${duLieuLuu.yeuThich.includes(sanPham.MaSP) ? "Bỏ yêu thích" : "Thêm yêu thích"}">${taoIcon("heart")}</button>
    <div class="san-pham-noi-dung">
      <div class="san-pham-loai">${thoatHTML(sanPham.TenNCC)}</div>
      <h3><button class="nut-xem-chi-tiet" data-chi-tiet="${maSP}">${tenSP}</button></h3>
      <div class="san-pham-danh-gia"><span class="so-luong-ton">Đơn vị: ${thoatHTML(sanPham.DviTinh)} · Còn ${thoatHTML(sanPham.Soluong)}</span></div>
      <div class="san-pham-gia-hang"><div class="san-pham-gia">${dinhDangTien(sanPham.Giaban)}<small>Giá bán lẻ</small></div><button class="them-gio" data-them-gio="${maSP}" aria-label="Thêm ${tenSP} vào giỏ">${taoIcon("plus")}</button></div>
    </div>
  </article>`;
}

function locSanPham() {
  return duLieuLuu.sanPham.filter(sanPham => {
    const noiDungTimKiem = `${sanPham.TenSP} ${sanPham.TenNCC} ${sanPham.DviTinh} ${sanPham.DanhMuc} ${sanPham.NhomDanhMuc}`.toLocaleLowerCase("vi");
    const khopTuKhoa = noiDungTimKiem.includes(boLocHienTai.tuKhoa.toLocaleLowerCase("vi"));
    const danhMucSanPham = (sanPham.DanhMuc || "").toLocaleLowerCase("vi");
    const nhomSanPham = (sanPham.NhomDanhMuc || "").toLocaleLowerCase("vi");
    const khopDanhMuc = !boLocHienTai.danhMuc || (boLocHienTai.nhomDanhMuc
      ? nhomSanPham === boLocHienTai.nhomDanhMuc.toLocaleLowerCase("vi")
      : danhMucSanPham === boLocHienTai.danhMuc.toLocaleLowerCase("vi"));
    return khopTuKhoa && khopDanhMuc;
  });
}

function veMenuDanhMuc() {
  const tenDangLoc = boLocHienTai.nhomDanhMuc || boLocHienTai.danhMuc;
  return `<div class="menu-danh-muc ${menuDanhMucDangMo ? "" : "an"}" id="menuDanhMuc">
    <div class="ds-danh-muc-cha" role="listbox" aria-label="Danh mục sản phẩm">
      <button class="nut-danh-muc-cha ${!boLocHienTai.danhMuc ? "dang-chon" : ""}" data-xoa-loc-danh-muc>Tất cả sản phẩm${taoIcon("chevron-right")}</button>
      ${danhSachDanhMuc.map(danhMuc => `<div class="muc-danh-muc ${danhMuc.ten === danhMucDangMo ? "dang-mo" : ""}">
        <button class="nut-danh-muc-cha ${danhMuc.ten === boLocHienTai.danhMuc ? "dang-chon" : ""}" data-mo-danh-muc="${danhMuc.ten}" aria-haspopup="true" aria-expanded="${danhMuc.ten === danhMucDangMo && menuDanhMucDangMo}">${danhMuc.ten}${taoIcon("chevron-right")}</button>
        <div class="ds-danh-muc-con" aria-label="${danhMuc.ten}">
          <button class="nut-danh-muc-con ${tenDangLoc === danhMuc.ten ? "dang-chon" : ""}" data-chon-danh-muc="${danhMuc.ten}">Tất cả ${danhMuc.ten}</button>
          ${danhMuc.nhom.map(nhom => `<button class="nut-danh-muc-con ${tenDangLoc === nhom ? "dang-chon" : ""}" data-danh-muc-cha="${danhMuc.ten}" data-chon-nhom-danh-muc="${nhom}">${nhom}</button>`).join("")}
        </div>
      </div>`).join("")}
    </div>
  </div>`;
}

function veCuaHang() {
  const ketQuaSanPham = locSanPham();
  const tongSoTrang = Math.max(1, Math.ceil(ketQuaSanPham.length / soSanPhamMoiTrang));
  trangSanPham = Math.min(trangSanPham, tongSoTrang);
  const viTriBatDau = (trangSanPham - 1) * soSanPhamMoiTrang;
  const sanPhamTrangHienTai = ketQuaSanPham.slice(viTriBatDau, viTriBatDau + soSanPhamMoiTrang);
  const dangLoc = Boolean(boLocHienTai.tuKhoa || boLocHienTai.danhMuc);
  const tieuDeLoc = boLocHienTai.nhomDanhMuc || boLocHienTai.danhMuc;
  oNoiDung.innerHTML = `<div class="khoi bo-cuc-cua-hang">
    <aside class="bo-loc-danh-muc" aria-label="Lọc sản phẩm theo danh mục"><h2 class="tieu-de-danh-muc">Danh mục sản phẩm</h2><button class="nut-mo-danh-muc" id="nutMoDanhMuc" aria-expanded="${menuDanhMucDangMo}" aria-controls="menuDanhMuc">${taoIcon("list-filter")} <span>${boLocHienTai.nhomDanhMuc || boLocHienTai.danhMuc || "Chọn danh mục"}</span> ${taoIcon("chevron-down")}</button>${veMenuDanhMuc()}</aside>
    <div class="noi-dung-cua-hang"><div class="banner-chinh">
      <div class="banner-noi-dung"><span class="nhan-mua">${taoIcon("leaf")} CHĂM VƯỜN THEO MÙA</span><h1>Vườn khỏe bắt đầu từ lựa chọn đúng.</h1><p>Vật tư trồng trọt được chọn lọc cùng cẩm nang chăm cây dễ hiểu cho từng khu vườn.</p><button class="nut-chinh" data-xuong="sanPhamNoiBat">Khám phá sản phẩm ${taoIcon("arrow-right")}</button></div>
      <div class="banner-anh" role="img" aria-label="Vườn rau xanh được chăm sóc"></div>
      <div class="banner-nhan"><span>${taoIcon("scan-line")} Đang có công cụ hỗ trợ cây trồng</span></div>
    </div>
    <div class="thanh-loi-ich">
      <div class="loi-ich">${taoIcon("truck")}<span><strong>Giao hàng toàn quốc</strong><small>Theo dõi đơn hàng tiện lợi</small></span></div>
      <div class="loi-ich">${taoIcon("badge-check")}<span><strong>Vật tư rõ nguồn gốc</strong><small>Thông tin sản phẩm dễ tra cứu</small></span></div>
      <div class="loi-ich">${taoIcon("messages-square")}<span><strong>Cẩm nang chăm cây</strong><small>Thông tin tham khảo dễ hiểu</small></span></div>
      <div class="loi-ich">${taoIcon("camera")}<span><strong>Hỗ trợ xem ảnh cây</strong><small>Xem trước ảnh ngay trên thiết bị</small></span></div>
    </div>
    <section id="sanPhamNoiBat" aria-labelledby="tieuDeSanPham"><div class="tieu-de-khu"><div><h2 id="tieuDeSanPham">${dangLoc ? `Sản phẩm: ${tieuDeLoc || "phù hợp"}` : "Sản phẩm"}</h2><p>${ketQuaSanPham.length} sản phẩm</p></div></div>
      ${dangLoc ? `<p class="ket-qua-loc">${boLocHienTai.tuKhoa ? `Từ khóa: “${boLocHienTai.tuKhoa}”` : ""}${boLocHienTai.tuKhoa && boLocHienTai.danhMuc ? " · " : ""}${boLocHienTai.danhMuc ? `Danh mục: ${tieuDeLoc}` : ""} <button class="nut-xem-tat-ca" data-xoa-bo-loc>Xóa bộ lọc</button></p>` : ""}
      <div class="luoi-san-pham">${ketQuaSanPham.length ? sanPhamTrangHienTai.map(veSanPham).join("") : `<div class="o-rong" style="grid-column:1/-1">${taoIcon("package-open")}<strong>${dangLoc ? "Không tìm thấy sản phẩm" : dangTaiSanPham ? "Đang tải sản phẩm" : loiTaiSanPham ? "Không thể tải sản phẩm" : "Chưa có sản phẩm"}</strong>${dangLoc ? "Thử lại với từ khóa hoặc danh mục khác." : dangTaiSanPham ? "Đang kết nối đến cơ sở dữ liệu." : loiTaiSanPham ? "Kiểm tra kết nối máy chủ và thử tải lại trang." : "Cơ sở dữ liệu chưa có sản phẩm."}</div>`}</div>
      ${vePhanTrangSanPham(ketQuaSanPham.length, tongSoTrang, viTriBatDau)}
    </section>
    </div>
  </div>`;
  if (boLocHienTai.tuKhoa) duaSanPhamLenDau();
}

function vePhanTrangSanPham(tongSanPham, tongSoTrang, viTriBatDau) {
  if (tongSoTrang <= 1) return "";

  const trangDau = Math.max(1, Math.min(trangSanPham - 2, tongSoTrang - 4));
  const trangCuoi = Math.min(tongSoTrang, trangDau + 4);
  const trang = Array.from({ length: trangCuoi - trangDau + 1 }, (_, viTri) => trangDau + viTri);
  return `<nav class="phan-trang-san-pham" aria-label="Phân trang sản phẩm">
    <span>Hiển thị ${viTriBatDau + 1}–${Math.min(viTriBatDau + soSanPhamMoiTrang, tongSanPham)} trong ${tongSanPham} sản phẩm</span>
    <div class="cac-nut-phan-trang">
      <button class="nut-trang-san-pham" data-trang-san-pham="${trangSanPham - 1}" aria-label="Trang trước" ${trangSanPham === 1 ? "disabled" : ""}>${taoIcon("chevron-left")} Trước</button>
      ${trang.map(soTrang => `<button class="nut-trang-san-pham ${soTrang === trangSanPham ? "dang-chon" : ""}" data-trang-san-pham="${soTrang}" aria-label="Trang ${soTrang}" ${soTrang === trangSanPham ? 'aria-current="page"' : ""}>${soTrang}</button>`).join("")}
      <button class="nut-trang-san-pham" data-trang-san-pham="${trangSanPham + 1}" aria-label="Trang sau" ${trangSanPham === tongSoTrang ? "disabled" : ""}>Sau ${taoIcon("chevron-right")}</button>
    </div>
  </nav>`;
}

function duaSanPhamLenDau() {
  const khungCuon = document.querySelector(".noi-dung-cua-hang");
  const mucSanPham = document.getElementById("sanPhamNoiBat");
  if (!khungCuon || !mucSanPham) return;
  khungCuon.scrollTo({
    top: mucSanPham.getBoundingClientRect().top - khungCuon.getBoundingClientRect().top + khungCuon.scrollTop,
    behavior: "smooth"
  });
}

function veCamNang() {
  oNoiDung.innerHTML = `<div class="khoi"><div class="duong-dan">Cửa hàng / Chăm sóc cây trồng</div><div class="dau-trang-trang"><div><h1>Cẩm nang bệnh cây</h1><p>Thông tin tham khảo để quan sát và chăm sóc vườn.</p></div></div>
    <div class="luoi-hai"><section class="khung-noi-dung"><h2 style="font-size:18px;margin-bottom:6px">Ảnh cây</h2><p style="color:var(--phu);font-size:12px;line-height:1.55">Chọn ảnh rõ vùng lá hoặc thân cần quan sát.</p>
      <div class="khung-tai-anh" id="vungTaiAnh"><div id="noiDungTaiAnh">${taoIcon("image-plus")}<strong>Chụp hoặc tải ảnh cây lên</strong><p>JPG, PNG hoặc WEBP · Chỉ xử lý hiển thị trên trang này</p><label class="nut-phu" for="tepAnhCay">${taoIcon("upload")} Chọn ảnh</label><input id="tepAnhCay" type="file" accept="image/*" capture="environment" aria-label="Chọn hoặc chụp ảnh cây"></div></div>
    </section><aside class="khung-noi-dung"><span class="nhan-mua">${taoIcon("route")} QUY TRÌNH THAM KHẢO</span><h2 style="margin:11px 0;font-size:19px">Quan sát trước, chọn giải pháp sau.</h2><p style="color:var(--phu);font-size:13px;line-height:1.6">Đối chiếu mặt trên và dưới lá, mức độ lan rộng, điều kiện tưới và ánh sáng. Với tình trạng nghiêm trọng, hãy hỏi người có chuyên môn tại địa phương.</p><div class="ghi-chu">${taoIcon("triangle-alert")} Gợi ý sản phẩm không xác nhận nguyên nhân bệnh và không thay thế hướng dẫn trên nhãn sản phẩm.</div></aside></div>
    <section><div class="tieu-de-khu"><div><h2>Bài viết chăm sóc cây</h2><p>Tra cứu dấu hiệu thường gặp và cách theo dõi vườn.</p></div></div><div class="o-rong">${taoIcon("book-open")}<strong>Chưa có bài viết</strong>Nội dung sẽ hiển thị tại đây khi có dữ liệu.</div></section></div>`;
}

function veDonHang() {
  const donCuaToi = duLieuLuu.taiKhoan ? duLieuLuu.donHang.filter(don => don.tenTaiKhoan === duLieuLuu.taiKhoan.tenTaiKhoan) : [];
  const danhSach = duLieuLuu.taiKhoan ? donCuaToi : duLieuLuu.donHang;
  oNoiDung.innerHTML = `<div class="khoi"><div class="duong-dan">Cửa hàng / Đơn hàng</div><div class="dau-trang-trang"><div><h1>Đơn hàng</h1><p>${duLieuLuu.taiKhoan ? `Xin chào ${duLieuLuu.taiKhoan.ten}, đây là đơn hàng của bạn.` : "Đơn hàng của bạn sẽ hiển thị tại đây."}</p></div></div>
    <div class="luoi-don-hang">${danhSach.length ? danhSach.map(don => `<article class="the-don-hang"><div><h3>${don.MaHD} <span class="nhan-trang-thai ${don.trangThai === "Đang xử lý" ? "cho-xu-ly" : ""}">${don.trangThai}</span></h3><p>${don.Ngaylap} · ${don.dongHang.map(dong => `${dong.TenSP} × ${dong.SlBan}`).join(", ")}<br>${don.phuongThuc}</p></div><strong>${dinhDangTien(don.tong)}</strong></article>`).join("") : `<div class="o-rong">${taoIcon("package-open")}<strong>Bạn chưa có đơn hàng</strong>Đăng nhập để xem đơn thuộc tài khoản hoặc tiếp tục chọn sản phẩm.</div>`}</div></div>`;
}

function veTaiKhoan() {
  const taiKhoan = duLieuLuu.taiKhoan;
  const vaiTro = taiKhoan?.vaiTro === "admin" ? "Quản trị viên" : taiKhoan?.vaiTro === "nhan_vien" ? "Nhân viên" : "Khách hàng";
  oNoiDung.innerHTML = `<div class="khoi"><div class="duong-dan">Cửa hàng / Tài khoản</div><div class="dau-trang-trang"><div><h1>Tài khoản của bạn</h1><p>Quản lý thông tin và theo dõi đơn hàng.</p></div>${taiKhoan ? `<button class="nut-phu" id="nutDangXuat">${taoIcon("log-out")} Đăng xuất</button>` : `<button class="nut-chinh" id="nutMoDangNhap">${taoIcon("log-in")} Đăng nhập</button>`}</div>
    <div class="khung-noi-dung" style="max-width:720px">${taiKhoan ? `<div class="luoi-hai"><div><small style="color:var(--phu)">TÊN TÀI KHOẢN</small><h2 style="font-size:20px;margin:6px 0 18px">${thoatHTML(taiKhoan.tenTaiKhoan || "")}</h2><small style="color:var(--phu)">VAI TRÒ</small><p style="margin:6px 0 18px">${vaiTro}</p>${taiKhoan.vaiTro === "khach_hang" ? `<button class="nut-phu" data-xem="don-hang">Xem đơn hàng ${taoIcon("arrow-right")}</button>` : ""}</div><div class="ghi-chu">${taoIcon("shield-check")} Phiên đăng nhập được xác thực bởi máy chủ.</div></div>` : `<h2 style="font-size:18px">Chưa có thông tin tài khoản</h2><p style="color:var(--phu);font-size:13px">Bạn có thể đăng nhập hoặc tạo tài khoản khách hàng.</p><div class="hang-nut" style="gap:9px"><button class="nut-chinh" id="nutMoDangNhap">Đăng nhập</button><button class="nut-phu" id="nutMoDangKy">Tạo tài khoản</button></div>`}</div></div>`;
}

function veQuanTri() {
  if (!["nhan_vien", "admin"].includes(duLieuLuu.taiKhoan?.vaiTro)) {
    return chuyenTrang("cua-hang");
  }
  const laAdmin = duLieuLuu.taiKhoan.vaiTro === "admin";
  const tongGiaTri = duLieuQuanTri.donHang.reduce((tong, don) => tong + Number(don.tong || 0), 0);
  const cacTab = [["tong-quan", "Tổng quan"], ["san-pham", "Sản phẩm & tồn kho"], ["don-hang", "Đơn hàng"], ["nguoi-dung", "Tài khoản"], ["benh-cay", "Dữ liệu bệnh cây"]];
  let noiDungTab = "";
  if (tabQuanTri === "tong-quan") noiDungTab = `<div class="luoi-thong-ke"><div class="the-thong-ke"><small>Sản phẩm</small><strong>${duLieuLuu.sanPham.length}</strong><span>${taoIcon("package")} ${dangTaiSanPham ? "Đang tải từ MySQL" : "Đang kinh doanh"}</span></div><div class="the-thong-ke"><small>Hóa đơn</small><strong>${duLieuQuanTri.donHang.length}</strong><span>${taoIcon("package-check")} ${dangTaiDuLieuQuanTri ? "Đang tải từ MySQL" : "Từ cơ sở dữ liệu"}</span></div><div class="the-thong-ke"><small>Tài khoản</small><strong>${duLieuQuanTri.taiKhoan.length}</strong><span>${taoIcon("users")} ${dangTaiDuLieuQuanTri ? "Đang tải từ MySQL" : "Từ cơ sở dữ liệu"}</span></div><div class="the-thong-ke"><small>Giá trị hóa đơn</small><strong style="font-size:18px">${dinhDangTien(tongGiaTri)}</strong><span>${taoIcon("badge-dollar-sign")} Tổng từ chi tiết hóa đơn</span></div></div><div class="khung-noi-dung"><div class="tieu-de-khu" style="margin:0 0 12px"><div><h2 style="font-size:18px">Hóa đơn mới nhất</h2></div><button class="nut-xem-tat-ca" data-tab-quan-tri="don-hang">Quản lý đơn ${taoIcon("arrow-right")}</button></div>${loiTaiDuLieuQuanTri ? `<p role="alert">Không thể tải hóa đơn từ MySQL. Kiểm tra API quản trị và cấu hình database.</p>` : veBangDonHang(duLieuQuanTri.donHang.slice(0, 4))}</div>`;
  if (tabQuanTri === "san-pham") noiDungTab = `<div class="khung-noi-dung"><div class="tieu-de-khu" style="margin:0"><div><h2 style="font-size:18px">Sản phẩm và tồn kho</h2><p>${laAdmin ? "Thêm, sửa, xóa sản phẩm và cập nhật kho hàng." : "Chế độ nhân viên: chỉ xem dữ liệu kho hàng."}</p></div>${laAdmin ? `<button class="nut-chinh" id="nutThemSanPham">${taoIcon("plus")} Thêm sản phẩm</button>` : ""}</div>${laAdmin && maSanPhamDangSua !== null ? veFormSanPham() : ""}${veBangSanPham(laAdmin)}</div>`;
  if (tabQuanTri === "don-hang") noiDungTab = `<div class="khung-noi-dung"><div class="tieu-de-khu" style="margin:0 0 12px"><div><h2 style="font-size:18px">Quản lý hóa đơn</h2><p>Hóa đơn và chi tiết bán hàng đã lưu trong database.</p></div></div>${loiTaiDuLieuQuanTri ? `<p role="alert">Không thể tải hóa đơn từ MySQL. Kiểm tra API quản trị và cấu hình database.</p>` : dangTaiDuLieuQuanTri ? `<div class="o-rong"><strong>Đang tải hóa đơn</strong>Đang kết nối cơ sở dữ liệu.</div>` : veBangDonHang(duLieuQuanTri.donHang)}</div>`;
  if (tabQuanTri === "nguoi-dung") noiDungTab = `<div class="khung-noi-dung"><div class="tieu-de-khu" style="margin:0 0 12px"><div><h2 style="font-size:18px">Tài khoản trong database</h2><p>Mật khẩu không được gửi tới giao diện quản trị.</p></div></div>${loiTaiDuLieuQuanTri ? `<p role="alert">Không thể tải tài khoản từ MySQL. Kiểm tra API quản trị và cấu hình database.</p>` : veBangNguoiDung()}</div>`;
  if (tabQuanTri === "nguoi-dung") noiDungTab = `<div class="khung-noi-dung"><div class="tieu-de-khu" style="margin:0 0 12px"><div><h2 style="font-size:18px">Tài khoản trong database</h2></div></div>${veBangNguoiDung()}</div>`;
  if (tabQuanTri === "benh-cay") noiDungTab = `<div class="khung-noi-dung"><div class="tieu-de-khu" style="margin:0"><div><h2 style="font-size:18px">Dữ liệu bệnh cây</h2><p>${laAdmin ? "Thêm hướng dẫn tham khảo và gắn sản phẩm phù hợp." : "Chế độ nhân viên: chỉ xem dữ liệu."}</p></div></div>${laAdmin ? `<form id="formThemBenh" class="form-quan-tri" style="grid-template-columns:2fr 1fr 2fr auto"><div class="form-nhom"><label for="tenBenhMoi">Tiêu đề bài viết</label><input id="tenBenhMoi" required placeholder="Tên dấu hiệu hoặc vấn đề"></div><div class="form-nhom"><label for="loaiBenhMoi">Nhóm cây</label><input id="loaiBenhMoi" required placeholder="Rau màu"></div><div class="form-nhom"><label for="moTaBenhMoi">Mô tả</label><input id="moTaBenhMoi" required placeholder="Thông tin tham khảo"></div><button class="nut-chinh" type="submit">${taoIcon("plus")} Thêm</button></form>` : ""}${veBangBenh(laAdmin)}</div>`;
  oNoiDung.innerHTML = `<div class="khoi"><div class="duong-dan">Không gian cửa hàng / Quản trị</div><div class="dau-trang-trang"><div><h1>Quản trị cửa hàng</h1><p>${laAdmin ? "Quản lý sản phẩm, tồn kho, hóa đơn và tài khoản." : "Nhân viên xem tình hình cửa hàng và tồn kho."}</p></div><span class="nhan-trang-thai">${laAdmin ? "Admin" : "Nhân viên"}</span></div><div class="dieu-huong-quan-tri" role="tablist">${cacTab.map(([ma, ten]) => `<button class="nut-tab ${tabQuanTri === ma ? "dang-chon" : ""}" role="tab" aria-selected="${tabQuanTri === ma}" data-tab-quan-tri="${ma}">${ten}</button>`).join("")}</div>${noiDungTab}</div>`;
}

function veFormSanPham() {
  const sanPham = duLieuLuu.sanPham.find(mon => String(mon.MaSP) === maSanPhamDangSua);
  const dangSua = sanPham !== undefined;
  return `<form id="formSanPham" class="form-quan-tri form-san-pham">
    <div class="form-nhom"><label for="maSanPham">Mã sản phẩm</label><input id="maSanPham" name="MaSP" required maxlength="32" value="${thoatHTML(sanPham?.MaSP || "")}" ${dangSua ? "readonly" : ""} placeholder="VD: SP001"></div>
    <div class="form-nhom"><label for="tenSanPham">Tên sản phẩm</label><input id="tenSanPham" name="TenSP" required maxlength="255" value="${thoatHTML(sanPham?.TenSP || "")}" placeholder="Tên sản phẩm"></div>
    <div class="form-nhom"><label for="nhaCungCap">Nhà cung cấp</label><input id="nhaCungCap" name="TenNCC" required maxlength="255" value="${thoatHTML(sanPham?.TenNCC || "")}" placeholder="Nhà cung cấp"></div>
    <div class="form-nhom"><label for="donViTinh">Đơn vị tính</label><input id="donViTinh" name="DviTinh" required maxlength="50" value="${thoatHTML(sanPham?.DviTinh || "")}" placeholder="Chai, kg, gói..."></div>
    <div class="form-nhom"><label for="giaSanPham">Giá bán (VND)</label><input id="giaSanPham" name="Giaban" type="number" min="0" step="1" required value="${sanPham?.Giaban ?? ""}"></div>
    <div class="form-nhom"><label for="tonKhoSanPham">Tồn kho</label><input id="tonKhoSanPham" name="Soluong" type="number" min="0" step="1" required value="${sanPham?.Soluong ?? ""}"></div>
    <div class="hang-nut"><button class="nut-chinh" type="submit">${taoIcon("save")} ${dangSua ? "Lưu thay đổi" : "Tạo sản phẩm"}</button><button class="nut-phu" type="button" id="nutHuySanPham">Hủy</button></div>
  </form>`;
}

function veBangSanPham(choPhepSua = false) {
  const cotThaoTac = choPhepSua ? "<th>Thao tác</th>" : "";
  if (dangTaiSanPham) return `<div class="o-rong">${taoIcon("loader-circle")}<strong>Đang tải sản phẩm</strong>Đang đọc danh sách từ MySQL.</div>`;
  if (loiTaiSanPham) return `<div class="o-rong" role="alert">${taoIcon("triangle-alert")}<strong>Không thể tải sản phẩm</strong>Kiểm tra API và kết nối database, sau đó tải lại trang.</div>`;
  if (!duLieuLuu.sanPham.length) return `<div class="o-rong">${taoIcon("package-open")}<strong>Chưa có sản phẩm</strong>${choPhepSua ? "Tạo sản phẩm đầu tiên để bắt đầu quản lý kho." : "Bảng sanpham chưa có dữ liệu."}</div>`;

  return `<div class="bang-cuon"><table><thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>Danh mục</th><th>Nhà cung cấp</th><th>Tồn kho</th><th>Giá bán</th>${cotThaoTac}</tr></thead><tbody>${duLieuLuu.sanPham.map(sanPham => `<tr><td>${sanPham.anh ? `<img class="anh-quan-tri" src="${thoatHTML(sanPham.anh)}" alt="" loading="lazy">` : `<div class="anh-quan-tri-trong" aria-hidden="true">${taoIcon("package")}</div>`}</td><td><strong>${thoatHTML(sanPham.TenSP)}</strong><br><small>${thoatHTML(sanPham.MaSP)} · ${thoatHTML(sanPham.DviTinh)}</small></td><td>${thoatHTML(sanPham.NhomDanhMuc || sanPham.DanhMuc)}</td><td>${thoatHTML(sanPham.TenNCC)}</td><td>${thoatHTML(sanPham.Soluong)}</td><td>${dinhDangTien(sanPham.Giaban)}</td>${choPhepSua ? `<td><div class="thao-tac-san-pham"><button class="nut-nho" data-sua-san-pham="${thoatHTML(sanPham.MaSP)}">Sửa</button><button class="nut-xoa" data-xoa-san-pham="${thoatHTML(sanPham.MaSP)}" aria-label="Xóa ${thoatHTML(sanPham.TenSP)}">${taoIcon("trash-2")}</button></div></td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}

function veBangDonHang(danhSach, coThaoTac = false) {
  return `<div class="bang-cuon"><table><thead><tr><th>Mã hóa đơn</th><th>Khách hàng</th><th>Thời gian</th><th>Thanh toán</th><th>Tổng tiền</th><th>Trạng thái</th>${coThaoTac ? "<th>Thao tác</th>" : ""}</tr></thead><tbody>${danhSach.length ? danhSach.map(don => `<tr><td><strong>${thoatHTML(don.MaHD)}</strong></td><td>${thoatHTML(don.khach)}</td><td>${thoatHTML(don.Ngaylap)}</td><td>${thoatHTML(don.phuongThuc)}</td><td>${dinhDangTien(Number(don.tong || 0))}</td><td><span class="nhan-trang-thai">${thoatHTML(don.trangThai)}</span></td>${coThaoTac ? `<td><button class="nut-nho" data-cap-nhat-don="${thoatHTML(don.MaHD)}">Cập nhật</button></td>` : ""}</tr>`).join("") : `<tr><td colspan="${coThaoTac ? 7 : 6}">Chưa có hóa đơn trong database.</td></tr>`}</tbody></table></div>`;
}

function veBangNguoiDung() {
  const tenVaiTro = { khach_hang: "Khách hàng", nhan_vien: "Nhân viên", admin: "Admin" };
  return `<div class="bang-cuon"><table><thead><tr><th>Mã tài khoản</th><th>Tên tài khoản</th><th>Vai trò</th></tr></thead><tbody>${duLieuQuanTri.taiKhoan.length ? duLieuQuanTri.taiKhoan.map(taiKhoan => `<tr><td>${thoatHTML(taiKhoan.MaTK)}</td><td>${thoatHTML(taiKhoan.TenTK)}</td><td>${tenVaiTro[taiKhoan.VaiTro] || thoatHTML(taiKhoan.VaiTro)}</td></tr>`).join("") : `<tr><td colspan="3">${dangTaiDuLieuQuanTri ? "Đang tải tài khoản..." : "Chưa có tài khoản trong database."}</td></tr>`}</tbody></table></div>`;
}

function veBangBenh(choPhepSua = false) {
  return `<div class="bang-cuon"><table><thead><tr><th>Bài viết</th><th>Nhóm cây</th><th>Mô tả</th>${choPhepSua ? "<th>Thao tác</th>" : ""}</tr></thead><tbody>${duLieuLuu.benhCay.length ? duLieuLuu.benhCay.map(bai => `<tr><td>${bai.ten}</td><td>${bai.loai}</td><td>${bai.moTa}</td>${choPhepSua ? `<td><button class="nut-xoa" data-xoa-benh="${bai.ma}" aria-label="Xóa bài viết ${bai.ten}">${taoIcon("trash-2")}</button></td>` : ""}</tr>`).join("") : `<tr><td colspan="${choPhepSua ? 4 : 3}">Chưa có bài viết.</td></tr>`}</tbody></table></div>`;
}

function themVaoGio(maSanPham) {
  const sanPham = duLieuLuu.sanPham.find(mon => mon.MaSP === maSanPham);
  if (!sanPham || sanPham.Soluong < 1) return hienThongBao("Sản phẩm hiện không đủ tồn kho.");
  const monTrongGio = duLieuLuu.gioHang.find(mon => mon.MaSP === maSanPham);
  if (monTrongGio) monTrongGio.soLuong = Math.min(monTrongGio.soLuong + 1, sanPham.Soluong);
  else duLieuLuu.gioHang.push({ MaSP: maSanPham, soLuong: 1 });
  luuDuLieu();
  hienThongBao("Đã thêm sản phẩm vào giỏ hàng.");
}

function moGioHang() {
  document.getElementById("lopPhu").classList.add("dang-mo");
  document.getElementById("nganGio").classList.add("dang-mo");
  document.getElementById("nganGio").setAttribute("aria-hidden", "false");
  document.getElementById("lopPhu").setAttribute("aria-hidden", "false");
  veGioHang();
  document.getElementById("nutDongGio").focus();
}

function dongGioHang() {
  document.getElementById("lopPhu").classList.remove("dang-mo");
  document.getElementById("nganGio").classList.remove("dang-mo");
  document.getElementById("nganGio").setAttribute("aria-hidden", "true");
  document.getElementById("lopPhu").setAttribute("aria-hidden", "true");
  document.getElementById("nutMoGio").focus();
}

function veGioHang() {
  const noiDung = document.getElementById("noiDungGio");
  const cacMon = duLieuLuu.gioHang.map(mon => ({ ...mon, sanPham: duLieuLuu.sanPham.find(sp => sp.MaSP === mon.MaSP) })).filter(mon => mon.sanPham);
  const tongTien = cacMon.reduce((tong, mon) => tong + mon.sanPham.Giaban * mon.soLuong, 0);
  if (!cacMon.length) {
    noiDung.innerHTML = `<div class="o-rong" style="margin-top:18px">${taoIcon("shopping-bag")}<strong>Giỏ hàng đang trống</strong>Thêm sản phẩm để bắt đầu đơn hàng.</div>`;
    veIcon();
    return;
  }
  noiDung.innerHTML = `<div>${cacMon.map(mon => `<div class="dong-gio">${mon.sanPham.anh ? `<img src="${mon.sanPham.anh}" alt="">` : `<div class="anh-san-pham-trong" aria-hidden="true">${taoIcon("package")}</div>`}<div><h3>${mon.sanPham.TenSP}</h3><small>${dinhDangTien(mon.sanPham.Giaban)}</small><div class="nut-so-luong"><button data-giam-gio="${mon.MaSP}" aria-label="Giảm số lượng">−</button><span>${mon.soLuong}</span><button data-tang-gio="${mon.MaSP}" aria-label="Tăng số lượng">+</button></div></div><button class="nut-xoa" data-bo-gio="${mon.MaSP}" aria-label="Xóa sản phẩm">${taoIcon("trash-2")}</button></div>`).join("")}</div><div class="tong-tien"><span>Tạm tính</span><strong>${dinhDangTien(tongTien)}</strong></div><p style="color:var(--phu);font-size:11px">Phí giao hàng được xác nhận ở bước tiếp theo.</p><form class="form-thanh-toan" id="formThanhToan"><h3 style="margin:4px 0;font-size:16px">Thông tin nhận hàng</h3><div class="form-nhom"><label for="tenNhanHang">Họ và tên</label><input id="tenNhanHang" required value="${duLieuLuu.taiKhoan ? duLieuLuu.taiKhoan.ten : ""}" placeholder="Tên người nhận"></div><div class="form-nhom"><label for="diaChiNhanHang">Địa chỉ nhận hàng</label><input id="diaChiNhanHang" required placeholder="Số nhà, đường, phường/xã"></div><div class="form-nhom"><label>Phương thức thanh toán</label><div class="chon-thanh-toan"><label><input type="radio" name="phuongThuc" value="Thanh toán khi nhận hàng" checked> Thanh toán khi nhận hàng</label><label><input type="radio" name="phuongThuc" value="Ví thử nghiệm"> Ví trực tuyến thử nghiệm</label></div></div><button class="nut-chinh" type="submit">Đặt đơn thử nghiệm · ${dinhDangTien(tongTien)}</button><p class="ghi-chu">Không phát sinh thanh toán thật. Đơn chỉ được lưu trên trình duyệt này.</p></form>`;
  veIcon();
}

function capNhatSoLuongGio(maSanPham, thayDoi) {
  const monTrongGio = duLieuLuu.gioHang.find(mon => mon.MaSP === maSanPham);
  const sanPham = duLieuLuu.sanPham.find(mon => mon.MaSP === maSanPham);
  if (!monTrongGio || !sanPham) return;
  monTrongGio.soLuong += thayDoi;
  if (monTrongGio.soLuong <= 0) duLieuLuu.gioHang = duLieuLuu.gioHang.filter(mon => mon.MaSP !== maSanPham);
  else if (monTrongGio.soLuong > sanPham.Soluong) monTrongGio.soLuong = sanPham.Soluong;
  luuDuLieu();
  veGioHang();
}

function moHopTaiKhoan(cheDo = "dang-nhap") {
  cheDoTaiKhoan = cheDo;
  const laDangKy = cheDo === "dang-ky";
  document.getElementById("tieuDeTaiKhoan").textContent = laDangKy ? "Tạo tài khoản" : "Đăng nhập";
  document.getElementById("moTaTaiKhoan").textContent = laDangKy
    ? "Tạo tài khoản demo bằng tên tài khoản và mật khẩu."
    : "Đăng nhập bằng tên tài khoản và mật khẩu.";
  document.getElementById("formTaiKhoan").innerHTML = laDangKy
    ? `<div class="form-nhom"><label for="tenDangNhapMoi">Tên tài khoản</label><input id="tenDangNhapMoi" required minlength="3" maxlength="32" pattern="[A-Za-z0-9._\\-]{3,32}" autocomplete="username" placeholder="Ví dụ: vuonxanh_01"><small>3–32 ký tự: chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.</small></div><div class="form-nhom"><label for="matKhauTaiKhoan">Mật khẩu</label><input id="matKhauTaiKhoan" type="password" required minlength="8" autocomplete="new-password" placeholder="Ít nhất 8 ký tự"></div><button class="nut-chinh" type="submit">Tạo tài khoản</button><button class="nut-xem-tat-ca" type="button" id="nutDoiCheDo">Đã có tài khoản? Đăng nhập</button>`
    : `<div class="form-nhom"><label for="tenDangNhap">Tên tài khoản</label><input id="tenDangNhap" required minlength="3" maxlength="32" autocomplete="username" placeholder="Tên tài khoản của bạn"></div><div class="form-nhom"><label for="matKhauTaiKhoan">Mật khẩu</label><input id="matKhauTaiKhoan" type="password" required autocomplete="current-password" placeholder="Mật khẩu của bạn"></div><button class="nut-chinh" type="submit">Đăng nhập</button><button class="nut-xem-tat-ca" type="button" id="nutDoiCheDo">Chưa có tài khoản? Tạo tài khoản</button>`;
  oHopTaiKhoan.showModal();
  veIcon();
}

async function xuLyDangNhap(suKien) {
  suKien.preventDefault();
  const matKhau = document.getElementById("matKhauTaiKhoan")?.value || "";
  const dangDangKy = cheDoTaiKhoan === "dang-ky";
  const nutGui = suKien.submitter;
  if (nutGui) nutGui.disabled = true;

  try {
    const tenTaiKhoan = document.getElementById(dangDangKy ? "tenDangNhapMoi" : "tenDangNhap").value.trim();
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(tenTaiKhoan) || !matKhau || (dangDangKy && matKhau.length < 8)) {
        hienThongBao("Nhập tên tài khoản hợp lệ và mật khẩu tối thiểu 8 ký tự.");
        if (nutGui) nutGui.disabled = false;
        return;
    }

    const phanHoi = await goiApi(`/api/auth/${dangDangKy ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenTaiKhoan, matKhau })
    });

    duLieuLuu.taiKhoan = phanHoi.nguoiDung;
    tokenCsrf = phanHoi.csrfToken;
    capNhatGiaoDienTaiKhoan();
    oHopTaiKhoan.close();
    const laQuanTri = ["nhan_vien", "admin"].includes(duLieuLuu.taiKhoan.vaiTro);
    chuyenTrang(laQuanTri ? "quan-tri" : "cua-hang");
    hienThongBao(laQuanTri ? "Đăng nhập thành công. Đã mở trang quản trị." : "Đăng nhập thành công.");
  } catch (loi) {
    console.error("Không thể xác thực tài khoản.", loi);
    hienThongBao(loi.message || "Không thể đăng nhập.");
    if (nutGui) nutGui.disabled = false;
  }
}

function xuLyDatHang(suKien) {
  suKien.preventDefault();
  const cacMon = duLieuLuu.gioHang.map(mon => ({ ...mon, sanPham: duLieuLuu.sanPham.find(sp => sp.MaSP === mon.MaSP) })).filter(mon => mon.sanPham);
  if (!cacMon.length) return hienThongBao("Giỏ hàng đang trống.");
  if (cacMon.some(mon => mon.soLuong > mon.sanPham.Soluong)) return hienThongBao("Một sản phẩm không còn đủ số lượng tồn.");
  const phuongThuc = new FormData(suKien.target).get("phuongThuc");
  const tongTien = cacMon.reduce((tong, mon) => tong + mon.sanPham.Giaban * mon.soLuong, 0);
  const ten = document.getElementById("tenNhanHang").value.trim();
  const maHoaDon = String(Date.now()).slice(-6);
  const donMoi = { MaHD: maHoaDon, Ngaylap: new Date().toISOString().slice(0, 10), MaKH: null, MaNv: null, khach: ten, tenTaiKhoan: duLieuLuu.taiKhoan?.tenTaiKhoan, tong: tongTien, trangThai: "Đang xử lý", phuongThuc, dongHang: cacMon.map(mon => ({ MaHD: maHoaDon, MaSP: mon.sanPham.MaSP, TenSP: mon.sanPham.TenSP, SlBan: mon.soLuong, GiaBan: mon.sanPham.Giaban, Giamgia: 0, TongHD: mon.sanPham.Giaban * mon.soLuong, DviTinh: mon.sanPham.DviTinh })) };
  cacMon.forEach(mon => { mon.sanPham.Soluong -= mon.soLuong; });
  duLieuLuu.donHang.unshift(donMoi);
  duLieuLuu.gioHang = [];
  luuDuLieu();
  dongGioHang();
  chuyenTrang("don-hang");
  hienThongBao(phuongThuc === "Ví thử nghiệm" ? "Thanh toán mô phỏng thành công, đơn đã được tạo." : "Đơn hàng thử nghiệm đã được tạo.");
}

function hienBaiViet(maBai) {
  const bai = duLieuLuu.benhCay.find(mon => mon.ma === maBai);
  if (!bai) return;
  const sanPhamGoiY = bai.sanPham.map(ma => duLieuLuu.sanPham.find(mon => mon.MaSP === ma)).filter(Boolean);
  document.getElementById("noiDungBaiViet").innerHTML = `<div class="dau-hop"><div><span class="nhan-mua">${bai.loai}</span><h2 style="margin:9px 0 0;font-size:20px">${bai.ten}</h2></div><button class="nut-dong" data-dong-hop aria-label="Đóng"><i data-lucide="x"></i></button></div><img class="anh-benh" src="${bai.anh}" alt="${bai.ten}"><p style="color:var(--phu);line-height:1.65">${bai.moTa}</p><h3 style="font-size:15px">Thông tin tham khảo</h3><p style="font-size:13px;line-height:1.6">Theo dõi các dấu hiệu mới trên lá và thân, ghi nhận điều kiện tưới nước, ánh sáng và độ thông thoáng. Xử lý từng bước theo hướng dẫn của chuyên gia tại địa phương và thông tin trên nhãn sản phẩm.</p><div class="ghi-chu">${taoIcon("triangle-alert")} Nội dung này chỉ mang tính tham khảo, không xác nhận nguyên nhân hoặc khuyến nghị liều lượng sử dụng.</div><h3 style="font-size:15px;margin:17px 0 8px">Vật tư có thể tham khảo</h3>${sanPhamGoiY.length ? sanPhamGoiY.map(mon => `<div class="dong-gio">${mon.anh ? `<img src="${mon.anh}" alt="">` : `<div class="anh-san-pham-trong" aria-hidden="true">${taoIcon("package")}</div>`}<div><h3>${mon.TenSP}</h3><small>${dinhDangTien(mon.Giaban)}</small></div><button class="them-gio" data-them-gio="${mon.MaSP}" aria-label="Thêm vào giỏ">${taoIcon("plus")}</button></div>`).join("") : `<div class="o-rong">${taoIcon("package-open")}<strong>Chưa có sản phẩm liên quan</strong></div>`}`;
  oHopBaiViet.showModal();
  veIcon();
}

async function hienChiTietSanPham(maSanPham) {
  try {
    const sanPham = await goiApi(`/api/san-pham/${encodeURIComponent(maSanPham)}`);
    if (!sanPham || !sanPham.MaSP) throw new TypeError("API không trả về thông tin sản phẩm hợp lệ.");
    const anhSanPham = sanPham.anh
      ? `<img class="chi-tiet-anh" src="${thoatHTML(sanPham.anh)}" alt="${thoatHTML(sanPham.TenSP)}">`
      : `<div class="chi-tiet-anh san-pham-anh-trong" role="img" aria-label="Chưa có ảnh sản phẩm">${taoIcon(iconTheoDanhMuc(sanPham))}<small>Chưa có ảnh sản phẩm</small></div>`;
    document.getElementById("noiDungChiTietSanPham").innerHTML = `<div class="dau-hop"><div><span class="nhan-trang-thai">${thoatHTML(sanPham.NhomDanhMuc || sanPham.DanhMuc)}</span></div><button class="nut-dong" data-dong-hop aria-label="Đóng"><i data-lucide="x"></i></button></div>
      <div class="chi-tiet-bo-cuc">${anhSanPham}<div class="chi-tiet-noi-dung"><small>${thoatHTML(sanPham.MaSP)} · ${thoatHTML(sanPham.TenNCC)}</small><h2>${thoatHTML(sanPham.TenSP)}</h2><p>Đơn vị tính: <strong>${thoatHTML(sanPham.DviTinh)}</strong></p><p>Tồn kho: <strong>${thoatHTML(sanPham.Soluong)}</strong></p><div class="san-pham-gia">${dinhDangTien(Number(sanPham.Giaban || 0))}<small>Giá bán lẻ</small></div><button class="nut-chinh" data-them-gio="${thoatHTML(sanPham.MaSP)}">${taoIcon("shopping-bag")} Thêm vào giỏ</button></div></div>`;
    oHopChiTietSanPham.showModal();
    veIcon();
  } catch (loi) {
    console.error("Không thể tải chi tiết sản phẩm.", loi);
    hienThongBao(loi.message || "Không thể tải chi tiết sản phẩm.");
  }
}

document.addEventListener("click", async suKien => {
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
    document.getElementById("menuDanhMuc").classList.toggle("an", !menuDanhMucDangMo);
    nutMoDanhMuc.setAttribute("aria-expanded", String(menuDanhMucDangMo));
    return;
  }
  const nutDanhMucCha = suKien.target.closest("[data-mo-danh-muc]");
  if (nutDanhMucCha) {
    const tenDanhMuc = nutDanhMucCha.dataset.moDanhMuc;
    boLocHienTai.danhMuc = tenDanhMuc;
    boLocHienTai.nhomDanhMuc = "";
    boLocHienTai.tuKhoa = "";
    oTimKiem.value = "";
    trangSanPham = 1;
    danhMucDangMo = tenDanhMuc;
    menuDanhMucDangMo = true;
    veCuaHang();
    veIcon();
    return;
  }
  const nutChonDanhMuc = suKien.target.closest("[data-chon-danh-muc]");
  if (nutChonDanhMuc) {
    boLocHienTai.danhMuc = nutChonDanhMuc.dataset.chonDanhMuc;
    boLocHienTai.nhomDanhMuc = "";
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
    trangSanPham = 1;
    danhMucDangMo = boLocHienTai.danhMuc;
    menuDanhMucDangMo = false;
    veCuaHang();
    veIcon();
    return;
  }
  if (suKien.target.closest("[data-xoa-loc-danh-muc], [data-xoa-bo-loc]")) {
    boLocHienTai.danhMuc = "";
    boLocHienTai.nhomDanhMuc = "";
    boLocHienTai.tuKhoa = "";
    oTimKiem.value = "";
    trangSanPham = 1;
    menuDanhMucDangMo = false;
    veCuaHang();
    veIcon();
    return;
  }
  if (!suKien.target.closest(".bo-loc-danh-muc") && menuDanhMucDangMo) {
    menuDanhMucDangMo = false;
    document.getElementById("menuDanhMuc")?.classList.add("an");
    document.getElementById("nutMoDanhMuc")?.setAttribute("aria-expanded", "false");
  }
  const nutTrang = suKien.target.closest("[data-xem]");
  if (nutTrang) return chuyenTrang(nutTrang.dataset.xem);
  const nutChiTiet = suKien.target.closest("[data-chi-tiet]");
  if (nutChiTiet && (!nutChiTiet.matches("article") || !suKien.target.closest("button"))) {
    return void hienChiTietSanPham(nutChiTiet.dataset.chiTiet);
  }
  const nutThem = suKien.target.closest("[data-them-gio]");
  if (nutThem) return themVaoGio(nutThem.dataset.themGio);
  const nutThich = suKien.target.closest("[data-thich]");
  if (nutThich) {
    const maSanPham = nutThich.dataset.thich;
    duLieuLuu.yeuThich = duLieuLuu.yeuThich.includes(maSanPham) ? duLieuLuu.yeuThich.filter(ma => ma !== maSanPham) : [...duLieuLuu.yeuThich, maSanPham];
    luuDuLieu();
    veCuaHang();
    return;
  }
  if (suKien.target.closest("#nutMoGio, #nutGioDiDong")) return moGioHang();
  if (suKien.target.closest("#nutDongGio, #lopPhu")) return dongGioHang();
  if (suKien.target.closest("[data-giam-gio]")) return capNhatSoLuongGio(suKien.target.closest("[data-giam-gio]").dataset.giamGio, -1);
  if (suKien.target.closest("[data-tang-gio]")) return capNhatSoLuongGio(suKien.target.closest("[data-tang-gio]").dataset.tangGio, 1);
  if (suKien.target.closest("[data-bo-gio]")) {
    duLieuLuu.gioHang = duLieuLuu.gioHang.filter(mon => mon.MaSP !== suKien.target.closest("[data-bo-gio]").dataset.boGio);
    luuDuLieu();
    return veGioHang();
  }
  const nutTab = suKien.target.closest("[data-tab-quan-tri]");
  if (nutTab) { tabQuanTri = nutTab.dataset.tabQuanTri; return veQuanTri(); }
  if (suKien.target.closest("#nutThemSanPham")) { maSanPhamDangSua = ""; return veQuanTri(); }
  if (suKien.target.closest("#nutHuySanPham")) { maSanPhamDangSua = null; return veQuanTri(); }
  const nutSuaSanPham = suKien.target.closest("[data-sua-san-pham]");
  if (nutSuaSanPham) { maSanPhamDangSua = nutSuaSanPham.dataset.suaSanPham; return veQuanTri(); }
  const nutXoaSanPham = suKien.target.closest("[data-xoa-san-pham]");
  if (nutXoaSanPham) {
    const maSP = nutXoaSanPham.dataset.xoaSanPham;
    if (!window.confirm(`Xóa sản phẩm ${maSP}? Thao tác này không thể hoàn tác.`)) return;
    try {
      await goiApi(`/api/san-pham/${encodeURIComponent(maSP)}`, { method: "DELETE" });
      duLieuLuu.gioHang = duLieuLuu.gioHang.filter(mon => mon.MaSP !== maSP);
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
  const nutCapNhatDon = suKien.target.closest("[data-cap-nhat-don]");
  if (nutCapNhatDon) {
    const donHang = duLieuLuu.donHang.find(mon => mon.MaHD === nutCapNhatDon.dataset.capNhatDon);
    if (donHang) donHang.trangThai = donHang.trangThai === "Đang xử lý" ? "Đang giao" : "Đã hoàn tất";
    luuDuLieu(); return veQuanTri();
  }
  const nutDoiNguoi = suKien.target.closest("[data-doi-nguoi-dung]");
  if (nutDoiNguoi) {
    const nguoiDung = duLieuLuu.nguoiDung.find(mon => mon.ma === nutDoiNguoi.dataset.doiNguoiDung);
    if (nguoiDung) nguoiDung.trangThai = nguoiDung.trangThai === "Hoạt động" ? "Tạm khóa" : "Hoạt động";
    luuDuLieu(); return veQuanTri();
  }
  const nutXoaBenh = suKien.target.closest("[data-xoa-benh]");
  if (nutXoaBenh) {
    duLieuLuu.benhCay = duLieuLuu.benhCay.filter(mon => mon.ma !== nutXoaBenh.dataset.xoaBenh);
    luuDuLieu(); return veQuanTri();
  }
  const nutDocBai = suKien.target.closest("[data-doc-bai]");
  if (nutDocBai) return hienBaiViet(nutDocBai.dataset.docBai);
  if (suKien.target.closest("[data-dong-hop]")) { oHopTaiKhoan.close(); oHopBaiViet.close(); oHopChiTietSanPham.close(); }
  if (suKien.target.closest("#nutDangXuat")) {
    try {
      const phanHoi = await goiApi("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      tokenCsrf = phanHoi.csrfToken;
      duLieuLuu.taiKhoan = null;
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
  if (suKien.target.closest("#nutMoDangNhap")) return moHopTaiKhoan("dang-nhap");
  if (suKien.target.closest("#nutMoDangKy")) return moHopTaiKhoan("dang-ky");
  if (suKien.target.closest("#nutTaiKhoan")) return duLieuLuu.taiKhoan ? chuyenTrang("tai-khoan") : moHopTaiKhoan("dang-nhap");
  if (suKien.target.closest("#nutDoiCheDo")) return moHopTaiKhoan(cheDoTaiKhoan === "dang-nhap" ? "dang-ky" : "dang-nhap");
  if (suKien.target.closest("[data-xuong]")) duaSanPhamLenDau();
});

document.addEventListener("submit", async suKien => {
  if (suKien.target.id === "formTimKiem") {
    suKien.preventDefault();
    boLocHienTai.tuKhoa = oTimKiem.value.trim();
    trangSanPham = 1;
    chuyenTrang("cua-hang");
  }
  if (suKien.target.id === "formTaiKhoan") { await xuLyDangNhap(suKien); return; }
  if (suKien.target.id === "formSanPham") {
    suKien.preventDefault();
    const form = suKien.target;
    const nutLuu = form.querySelector('[type="submit"]');
    nutLuu.disabled = true;
    try {
      const duLieu = Object.fromEntries(new FormData(form).entries());
      const dangSua = maSanPhamDangSua !== "";
      const duongDan = dangSua ? `/api/san-pham/${encodeURIComponent(maSanPhamDangSua)}` : "/api/san-pham";
      await goiApi(duongDan, {
        method: dangSua ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duLieu)
      });
      maSanPhamDangSua = null;
      dangTaiSanPham = true;
      await taiSanPham();
      hienThongBao(dangSua ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm vào kho.");
    } catch (loi) {
      console.error("Không thể lưu sản phẩm.", loi);
      hienThongBao(loi.message || "Không thể lưu sản phẩm.");
      nutLuu.disabled = false;
    }
    return;
  }
  if (suKien.target.id === "formThanhToan") xuLyDatHang(suKien);
  if (suKien.target.id === "formThemBenh") {
    suKien.preventDefault();
    duLieuLuu.benhCay.unshift({ ma: `bc${Date.now()}`, ten: document.getElementById("tenBenhMoi").value.trim(), loai: document.getElementById("loaiBenhMoi").value.trim(), moTa: document.getElementById("moTaBenhMoi").value.trim(), anh: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=82", sanPham: [] });
    luuDuLieu(); veQuanTri(); hienThongBao("Đã thêm bài viết tham khảo.");
  }
});

document.getElementById("formTimKiem").addEventListener("input", suKien => {
  if (!suKien.target.value.trim() && trangHienTai === "cua-hang" && boLocHienTai.tuKhoa) {
    boLocHienTai.tuKhoa = "";
    trangSanPham = 1;
    veCuaHang();
  }
});
document.getElementById("hopTaiKhoan").addEventListener("click", suKien => { if (suKien.target === oHopTaiKhoan) oHopTaiKhoan.close(); });
document.getElementById("hopBaiViet").addEventListener("click", suKien => { if (suKien.target === oHopBaiViet) oHopBaiViet.close(); });
oHopChiTietSanPham.addEventListener("click", suKien => { if (suKien.target === oHopChiTietSanPham) oHopChiTietSanPham.close(); });
document.getElementById("nutDongGio").addEventListener("click", dongGioHang);
document.getElementById("lopPhu").addEventListener("click", dongGioHang);

async function khoiDong() {
  capNhatGiaoDienTaiKhoan();
  capNhatSoGio();

  try {
    const phien = await goiApi("/api/auth/session");
    tokenCsrf = phien.csrfToken;
    duLieuLuu.taiKhoan = phien.nguoiDung;
  } catch (loi) {
    console.error("Không thể kiểm tra phiên đăng nhập.", loi);
    hienThongBao("Không thể kiểm tra đăng nhập. Hãy tải lại trang nếu cần đăng nhập.");
  }
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
