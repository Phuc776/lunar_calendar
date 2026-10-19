# Lịch âm

Ứng dụng desktop tiếng Việt để xem lịch âm Việt Nam, lịch tháng và chuyển đổi ngày âm–dương. Chạy trên Windows x64, hoạt động ngoại tuyến sau khi cài đặt, dùng múi giờ Việt Nam UTC+7.

## Mở ứng dụng

- Chạy `release/Lich-am.exe` để dùng ngay trên máy đã có Microsoft Edge WebView2.
- Hoặc chạy bộ cài `release/Lich-am-1.0.0-setup.exe` để tạo shortcut trong Start Menu/desktop và có mục gỡ cài đặt Windows.
- Bộ cài kiểm tra WebView2; nếu máy thiếu, cần mạng cho lần tải thành phần này. Việc xem và tra cứu lịch sau đó không cần mạng.

## Chức năng

- Ngày dương, ngày âm hôm nay và tên năm can chi; cập nhật lại khi qua ngày mới, trở lại cửa sổ hoặc đánh thức máy.
- Lịch tháng bắt đầu từ thứ Hai; ngày dương lớn, ngày âm nhỏ; đánh dấu hôm nay, ngày đang chọn, mùng 1, rằm và ngày lễ.
- Chuyển tháng, chọn tháng/năm, về hôm nay và xem chi tiết ngày.
- Tra cứu hai chiều; chọn tháng nhuận theo đúng năm; thông báo khi ngày không tồn tại.
- Tết Nguyên đán, Nguyên tiêu, Giỗ Tổ Hùng Vương, Đoan Ngọ, Vu Lan, Trung thu, Ông Công Ông Táo và các ngày lễ dương lịch cơ bản.
- Giao diện sáng/tối/theo hệ thống; tùy chọn được lưu trên máy.
- Danh sách ba dịp lễ sắp tới nằm phía dưới, có thể cuộn xuống để xem.

Phạm vi: **ngày dương từ 01/01/1900 đến 31/12/2100**. Một phần tháng âm cuối năm 1899 nằm trong tháng 1/1900 nên ô năm âm cho phép nhập 1899; ngày kết quả vẫn phải nằm trong phạm vi ngày dương trên. Ngày lễ là ngày sự kiện, không phải lịch nghỉ bù hay số ngày nghỉ chính thức.

## Thao tác nhanh

| Thao tác | Cách dùng |
| --- | --- |
| Xem chi tiết | Bấm một ngày trong lịch |
| Tra cứu | Bấm **Tra cứu ngày** hoặc **Ctrl+K** |
| Chọn tháng/năm | Bấm tiêu đề tháng ở giữa hai mũi tên |
| Di chuyển ngày | Khi ô lịch có focus, dùng ← ↑ → ↓ |
| Di chuyển tháng/năm | Page Up / Page Down; thêm Shift để di chuyển một năm |
| Đầu/cuối tuần | Home / End |
| Đóng hộp thoại | Escape hoặc nút × |
| Đổi giao diện | Nút cài đặt ở góc trên phải |

## Công nghệ

- Tauri 2 / Rust: cửa sổ desktop và đóng gói NSIS.
- React 19 / TypeScript / CSS: giao diện; Vite: build.
- `src/calendar.ts`: mô-đun ngày dân sự, múi giờ, tra cứu, ngày lễ; bọc thư viện `@nghiavuive/lunar_date_vi@2.0.1` và bổ sung xác thực tháng nhuận/ngày không hợp lệ.
- Tauri Store: `preferences.json` trong thư mục dữ liệu ứng dụng Windows. Bản preview trên trình duyệt dùng localStorage.
- Vitest: kiểm thử logic. Playwright / Edge: kiểm thử giao diện.

Ứng dụng không sử dụng máy chủ, tài khoản, quảng cáo hay dịch vụ phân tích. Tài nguyên giao diện và dữ liệu lịch được đóng gói tại máy; không có font hoặc script tải từ CDN.

## Phát triển và build

Cần Node.js LTS có npm, Rust stable MSVC, Microsoft C++ Build Tools với workload Desktop development with C++, Windows SDK và WebView2. Hướng dẫn chính thức: <https://v2.tauri.app/start/prerequisites/>.

```powershell
npm ci
npm test
npm run build
npm run desktop:dev
```

Build bộ cài:

```powershell
npm run desktop:build
```

Kết quả mặc định ở `src-tauri/target/release/` và `src-tauri/target/release/bundle/nsis/`.

Chạy kiểm thử giao diện (cần Microsoft Edge):

```powershell
npm run test:e2e
```

Playwright tự mở máy chủ Vite trên `127.0.0.1:1420`, hoặc dùng máy chủ sẵn có cùng cổng. Dùng `npm run dev` để xem bản giao diện trên trình duyệt khi phát triển.

## Cấu trúc

```text
src/
  App.tsx               Màn hình lịch, tra cứu và cài đặt
  calendar.ts           Xử lý lịch, kiểm tra ngày và ngày lễ
  calendar.test.ts      Kiểm thử lịch
  preferences.ts        Đọc/ghi tùy chọn giao diện
  styles.css            Giao diện sáng/tối và bố cục
src-tauri/              Rust, cấu hình Windows và icon
tests/app.spec.ts       Kiểm thử thao tác giao diện
docs/                  Ghi chú thiết kế và kiểm chứng
release/               Bản chạy và bộ cài Windows
```

Các kiểm tra và giới hạn xác minh được ghi trong `docs/VALIDATION.md`. Ghi công các thư viện và thuật toán trong `THIRD_PARTY_NOTICES.md`.
