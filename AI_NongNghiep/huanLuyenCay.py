
import json
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms


# Duong dan thu muc
thuMucDuLieu = Path(
    r"C:\QuanLyCuaHangVatTuNongNghiep\AI_NongNghiep\duLieu\nhanDienCay"
)

thuMucMoHinh = Path(
    r"C:\QuanLyCuaHangVatTuNongNghiep\AI_NongNghiep\moHinh"
)


# Cau hinh huan luyen
kichThuocAnh = 224
soEpoch = 10
kichThuocLo = 4
tocDoHoc = 0.001


# Xu ly anh
bienDoiAnh = transforms.Compose([
    transforms.Resize((kichThuocAnh, kichThuocAnh)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# Doc anh theo tung loai cay
duLieu = datasets.ImageFolder(
    root=str(thuMucDuLieu),
    transform=bienDoiAnh
)

print("Cac loai cay:", duLieu.classes)
print("Tong so anh:", len(duLieu))


# Luu danh sach loai cay
with open(
    thuMucMoHinh / "nhanCay.json",
    "w",
    encoding="utf-8"
) as tep:
    json.dump(
        duLieu.classes,
        tep,
        ensure_ascii=False,
        indent=4
    )


# Tao bo du lieu huan luyen
boDuLieuHuanLuyen = DataLoader(
    duLieu,
    batch_size=kichThuocLo,
    shuffle=True,
    num_workers=0
)


# Su dung GPU NVIDIA
thietBi = torch.device("cuda")
print("GPU huan luyen:", torch.cuda.get_device_name(0))


# Tai mo hinh ResNet18 da hoc truoc
moHinh = models.resnet18(
    weights=models.ResNet18_Weights.DEFAULT
)


# Dong bang cac lop da hoc
for thamSo in moHinh.parameters():
    thamSo.requires_grad = False


# Thay lop phan loai theo so loai cay
moHinh.fc = nn.Linear(
    moHinh.fc.in_features,
    len(duLieu.classes)
)

moHinh = moHinh.to(thietBi)


# Ham tinh sai so va bo toi uu
hamMatMat = nn.CrossEntropyLoss()

boToiUu = torch.optim.Adam(
    moHinh.fc.parameters(),
    lr=tocDoHoc
)


# Bat dau huan luyen
for epoch in range(soEpoch):
    moHinh.train()

    tongMatMat = 0.0
    tongDung = 0
    tongAnh = 0

    for anh, nhan in boDuLieuHuanLuyen:
        anh = anh.to(thietBi)
        nhan = nhan.to(thietBi)

        boToiUu.zero_grad()

        duDoan = moHinh(anh)
        matMat = hamMatMat(duDoan, nhan)

        matMat.backward()
        boToiUu.step()

        tongMatMat += matMat.item() * anh.size(0)
        tongDung += (duDoan.argmax(1) == nhan).sum().item()
        tongAnh += nhan.size(0)

    matMatTrungBinh = tongMatMat / tongAnh
    doChinhXac = 100 * tongDung / tongAnh

    print(
        f"Epoch {epoch + 1}/{soEpoch} | "
        f"Mat mat: {matMatTrungBinh:.4f} | "
        f"Chinh xac huan luyen: {doChinhXac:.2f}%"
    )


# Luu mo hinh nhan dien cay
duongDanMoHinh = thuMucMoHinh / "nhanDienCay.pth"

torch.save(
    {
        "modelStateDict": moHinh.state_dict(),
        "tenNhan": duLieu.classes,
        "kichThuocAnh": kichThuocAnh
    },
    duongDanMoHinh
)


print("Huan luyen nhan dien cay hoan tat!")
print("Da luu mo hinh:", duongDanMoHinh)
print("Da luu danh sach loai cay:", thuMucMoHinh / "nhanCay.json")
