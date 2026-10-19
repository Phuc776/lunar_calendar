# Ghi công và thư viện

Phần giao diện, bộ xác thực, ngày lễ và tích hợp desktop được viết cho ứng dụng **Lịch âm**.

## Lịch âm

- `@nghiavuive/lunar_date_vi` 2.0.1, tác giả NghiaCaNgao; metadata npm ghi giấy phép ISC. Nguồn: <https://github.com/nacana22/lunar-date> (trước đây là NghiaCaNgao/LunarDate).
- Thư viện ghi nhận thuật toán lịch âm của **Hồ Ngọc Đức**, dựa trên phương pháp thiên văn của Jean Meeus. Giữ nguyên ghi công này khi sử dụng hoặc sửa mã nguồn.
- Ứng dụng bọc thư viện mà không sửa nội dung package, bổ sung kiểm tra đầu vào và xác thực tháng nhuận bằng chuyển đổi ngược.

## Giao diện và desktop

- React / React DOM: Meta và các cộng tác viên, MIT.
- Lucide: các tác giả Lucide, ISC; các biểu tượng kế thừa Feather có ghi công trong giấy phép package.
- Tauri và các plugin chính thức: Tauri Programme within The Commons Conservancy và các cộng tác viên, MIT / Apache-2.0.
- Vite, TypeScript, Vitest và Playwright được dùng để phát triển, biên dịch và kiểm thử; xem giấy phép tương ứng trong package gốc.

Phiên bản dependency chính xác và checksum được lưu trong `package-lock.json` và `src-tauri/Cargo.lock`. Các giấy phép upstream được giữ trong thư viện cài qua npm/Cargo; bảng trên là ghi công các thành phần chính.
