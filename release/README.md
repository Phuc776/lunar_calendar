# Bản phát hành Windows

Thư mục này trên Git chỉ chứa hướng dẫn. Các file `.exe` và checksum là đầu ra build, không được commit.

Tải bản đã xuất bản tại **[GitHub Releases](https://github.com/Phuc776/lunar_calendar/releases)**.

Để tạo bản chạy trên máy:

```powershell
npm run release:build
```

Script đọc phiên bản từ `package.json`, kiểm tra nhất quán với cấu hình Tauri/Rust và sinh:

- `release/Lich-am.exe`: bản chạy ngay, cần WebView2.
- `release/Lich-am-<version>-setup.exe`: bộ cài Windows x64.
- `release/SHA256SUMS.txt`: checksum của đúng hai file trên.

Vì vậy một bản clone mới sẽ không có sẵn `.exe` dù thư mục `release/` có tồn tại. Cài công cụ build theo README gốc hoặc tải file từ GitHub Releases.
