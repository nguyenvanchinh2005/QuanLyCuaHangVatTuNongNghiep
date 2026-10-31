
import json
from pathlib import Path

import torch
from PIL import Image
from torchvision import models, transforms
from tkinter import Tk, filedialog


# Duong dan mo hinh
thuMucGoc = Path(
    r"C:\QuanLyCuaHangVatTuNongNghiep\AI_NongNghiep"
)

thuMucMoHinh = thuMucGoc / "moHinh"


# Chon anh can nhan dien
cuaSo = Tk()
cuaSo.withdraw()

duongDanAnh = filedialog.askopenfilename(
    title="Chon anh cay can nhan dien",
    filetypes=[
        ("Tep anh", "*.jpg *.jpeg *.png *.bmp *.webp")
    ]
)

cuaSo.destroy()

if not duongDanAnh:
    print("Ban chua chon anh.")
    exit()


# Doc danh sach loai cay
with open(
    thuMucMoHinh / "nhanCay.json",
    "r",
    encoding="utf-8"
) as tep:
    tenNhan = json.load(tep)


# Doc kich thuoc anh
tepMoHinh = torch.load(
    thuMucMoHinh / "nhanDienCay.pth",
    map_location="cuda",
    weights_only=True
)

kichThuocAnh = tepMoHinh["kichThuocAnh"]


# Tao mo hinh ResNet18
moHinh = models.resnet18(weights=None)

moHinh.fc = torch.nn.Linear(
    moHinh.fc.in_features,
    len(tenNhan)
)

moHinh.load_state_dict(tepMoHinh["modelStateDict"])

thietBi = torch.device("cuda")
moHinh = moHinh.to(thietBi)
moHinh.eval()


# Xu ly anh dau vao
bienDoiAnh = transforms.Compose([
    transforms.Resize((kichThuocAnh, kichThuocAnh)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

anh = Image.open(duongDanAnh).convert("RGB")
anh = bienDoiAnh(anh).unsqueeze(0).to(thietBi)


# Du doan loai cay
with torch.no_grad():
    ketQua = moHinh(anh)
    xacSuat = torch.softmax(ketQua, dim=1)
    chiSo = xacSuat.argmax(dim=1).item()

print("Anh da chon:", duongDanAnh)
print("Loai cay du doan:", tenNhan[chiSo])
print(f"Do tin cay: {xacSuat[0][chiSo].item() * 100:.2f}%")
