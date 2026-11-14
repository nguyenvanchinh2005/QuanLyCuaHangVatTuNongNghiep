SELECT
    TenTK,
    LENGTH(MatKhau) AS DoDaiMatKhau,
    LEFT(MatKhau, 10) AS DauMatKhau,
    VaiTro,
    Email
FROM taikhoan
WHERE TenTK = 'tuan';