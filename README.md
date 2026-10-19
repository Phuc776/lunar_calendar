# Lịch âm

Ứng dụng lịch âm Việt Nam cho **Windows 10/11 x64**. Xem ngày âm, tra cứu âm–dương, dùng ngoại tuyến và đặt một widget trong suốt ngay trên desktop.

**Phiên bản hiện tại: 1.1.0** · [Trang tải ứng dụng](https://lich-am-ecru.vercel.app/) · [Tải bản Windows](https://github.com/Phuc776/lunar_calendar/releases/latest) · [Có gì mới](CHANGELOG.md)

## Tải và mở ứng dụng

Tải file từ **[GitHub Releases](https://github.com/Phuc776/lunar_calendar/releases)**:

| File | Cách dùng |
| --- | --- |
| `Lich-am-1.1.0-setup.exe` | Bộ cài khuyên dùng; tạo shortcut, có gỡ cài đặt và đường dẫn ổn định cho tự khởi động. |
| `Lich-am.exe` | Bản chạy ngay trên máy có Microsoft Edge WebView2. |
| `SHA256SUMS.txt` | Checksum SHA256 để đối chiếu file tải. |

Bộ cài cần mạng nếu máy thiếu WebView2. Sau đó, chức năng xem và tra cứu lịch hoạt động ngoại tuyến.

**Repo Git chứa mã nguồn; file `.exe` không nằm trong Git.** Thư mục [`release/`](release/README.md) trên remote chỉ có hướng dẫn. Chạy script build mới sinh file vào thư mục này; một bản clone mới chưa có sẵn bộ cài.

## Chức năng

- Lịch âm Việt Nam UTC+7, phạm vi ngày dương **01/01/1900–31/12/2100**.
- Ngày dương, ngày âm hôm nay, năm can chi; cập nhật khi sang ngày mới hoặc trở lại ứng dụng.
- Lịch tháng bắt đầu từ thứ Hai; chọn ngày, chuyển tháng/năm, đánh dấu mùng 1, rằm và ngày lễ.
- Tra cứu hai chiều, kiểm tra ngày không tồn tại và chọn đúng tháng nhuận theo năm.
- Giao diện sáng/tối/theo hệ thống, lưu tùy chọn trên máy.
- **Widget desktop:** không viền, kéo thả, khóa vị trí, luôn trên cùng và đặt lại vị trí.
- **Nền trong suốt 0–100%:** 0% là nền đặc, 100% chỉ còn nội dung; chữ giữ độ rõ.
- **Khay hệ thống:** hiện/ẩn widget, mở lịch đầy đủ, cài đặt và thoát.
- **Khởi động cùng Windows:** mở widget sau đăng nhập, không bật cửa sổ lớn; chỉ chạy một tiến trình.

Widget là cửa sổ không viền, chưa nhúng vào lớp hình nền Windows. **Win+D có thể ẩn widget** cùng các cửa sổ khác; mở lại từ biểu tượng cạnh đồng hồ. Tự khởi động mặc định tắt và có thể bật trong Cài đặt. Với bản chạy ngay, nên đặt file ở vị trí cố định trước khi bật tính năng này.

Ngày lễ là ngày sự kiện, không phải lịch nghỉ bù chính thức. Một phần năm âm 1899 nằm trong tháng 1/1900 nên tra cứu âm cho phép năm 1899, nhưng ngày dương kết quả vẫn nằm trong dải hỗ trợ.

## Sử dụng

1. Mở **Cài đặt** bằng biểu tượng góc trên phải.
2. Bật **Hiển thị widget**, kéo thanh độ trong suốt và chọn khóa vị trí nếu cần.
3. Kéo widget bằng vùng tiêu đề; các nút và ô lịch vẫn bấm được bình thường.
4. Bật **Khởi động cùng Windows** nếu muốn tự mở sau khi đăng nhập.
5. Nút × đóng cửa sổ về khay hệ thống. Chọn **Thoát Lịch âm** trong menu khay để dừng hẳn.

| Phím | Hành động trong lịch đầy đủ |
| --- | --- |
| Ctrl+K | Tra cứu ngày |
| ← ↑ → ↓ | Di chuyển ngày khi ô lịch có focus |
| Page Up / Page Down | Chuyển tháng; thêm Shift để chuyển năm |
| Home / End | Đầu/cuối tuần |
| Escape | Đóng hộp thoại |

## Phát triển

Cần Node.js LTS có npm, Rust stable MSVC, Microsoft C++ Build Tools với workload Desktop development with C++, Windows SDK và WebView2. [Yêu cầu build Tauri](https://v2.tauri.app/start/prerequisites/).

```powershell
npm ci
npm test
npm run build
npm run desktop:dev
```

Kiểm thử giao diện với Microsoft Edge:

```powershell
npm run test:e2e
```

Playwright tự mở máy chủ Vite trên `127.0.0.1:1420`. `npm run dev` dùng để preview giao diện; mở `/?widget=1` để xem widget. Tự khởi động và khay hệ thống chỉ hoạt động trong bản desktop.

## Build bản phát hành

```powershell
npm run release:build
```

Script cài dependency, chạy kiểm thử lịch, build Tauri và sinh:

```text
release/Lich-am.exe
release/Lich-am-1.1.0-setup.exe
release/SHA256SUMS.txt
```

Tên bộ cài được lấy từ phiên bản trong `package.json`, không viết cứng theo bản cũ. Nếu dependency đã cài, dùng `powershell -File scripts/build-release.ps1 -SkipInstall`.

`npm run desktop:build` chỉ build ra đường dẫn chuẩn của Tauri: `src-tauri/target/release/` và `src-tauri/target/release/bundle/nsis/`.

## Trang tải trên Vercel

Trang tĩnh nằm trong `web/`, được build bằng `node scripts/build-site.mjs`. `vercel.json` cấu hình sẵn ở gốc repo; file tải thực tế nằm trên GitHub Releases. [Hướng dẫn deploy Vercel Hobby](docs/DEPLOYMENT.md).

## Công nghệ và cấu trúc

Tauri 2 / Rust, React 19 / TypeScript / CSS, Vite, Tauri Store, Autostart, Single Instance và Window State. Lịch dựa trên `@nghiavuive/lunar_date_vi@2.0.1`, có lớp xác thực tháng nhuận và ngày không hợp lệ riêng.

```text
src/                  Giao diện lịch, widget và tùy chọn
src-tauri/            Rust, quản lý cửa sổ, khay hệ thống, tự khởi động
scripts/              Đóng gói Windows và build trang tải
tests/                Kiểm thử giao diện
docs/                 Kiểm chứng và deploy
web/                  Trang tải tĩnh cho Vercel
release/              Hướng dẫn được theo dõi; binary/checksum sinh khi build
```

Dữ liệu và tùy chọn lưu trên máy; không có tài khoản, quảng cáo hay dịch vụ phân tích trong desktop app. Xem [kiểm chứng](docs/VALIDATION.md) và [ghi công thư viện](THIRD_PARTY_NOTICES.md).
