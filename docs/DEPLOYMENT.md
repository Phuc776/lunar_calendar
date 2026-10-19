# Trang tải miễn phí trên Vercel


## Website đang hoạt động

- URL: https://lich-am-ecru.vercel.app/
- Project: lich-am trong workspace doxphuc-9059's projects, gói Hobby.
- Bản đầu được triển khai bằng **Drop to Deploy** từ thư mục site-dist đã build. Chưa liên kết GitHub nên push repo chưa tự cập nhật website.
- Cập nhật tiếp bằng Vercel CLI đã đăng nhập, hoặc liên kết repo rồi dùng cấu hình build bên dưới.

## Kiến trúc

- **Vercel Hobby:** HTML/CSS/JS tĩnh để giới thiệu và tải Lịch âm. Không có backend, database, Vercel Blob, analytics hoặc font trả phí.
- **GitHub Releases:** chứa `Lich-am.exe`, `Lich-am-<version>-setup.exe` và `SHA256SUMS.txt`.
- `scripts/build-site.mjs` đọc phiên bản từ `package.json` và sinh `site-dist/release.json` với link của đúng tag `v<version>`.

Vercel Hobby miễn phí cho dự án cá nhân, phi thương mại, trong hạn mức của gói: <https://vercel.com/docs/plans/hobby>. Không bật trial Pro hoặc dịch vụ trả phí. Hết hạn mức Hobby có thể làm trang tạm ngưng; không có cam kết băng thông vô hạn.

## Deploy từ repo

1. Đăng nhập tài khoản Vercel Hobby cá nhân.
2. Import repo `Phuc776/lunar_calendar`.
3. Giữ **Root Directory** ở gốc repo. `vercel.json` đã cấu hình build bằng `node scripts/build-site.mjs`, output `site-dist`, không cần cài dependency của desktop.
4. Deploy. Dùng domain `.vercel.app` miễn phí được Vercel cấp.
5. Thử hai nút tải sau khi GitHub Release tương ứng đã được xuất bản.

Nếu deploy qua CLI đã đăng nhập: `vercel --prod` tại gốc repo. Không đặt token trong mã nguồn, README hoặc file `.env` được commit. `.vercel/` đã được bỏ qua bởi Git.

## Phát hành phiên bản tiếp theo

1. Cập nhật cùng phiên bản trong `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` và lockfile.
2. Chạy kiểm thử, `npm run release:build` và kiểm tra bản Windows.
3. Commit/push code, tạo GitHub Release với tag `v<version>` trỏ đúng commit đó.
4. Upload đúng ba file của phiên bản trong `release/`; không đẩy `.exe` vào Git.
5. Deploy lại trang Vercel từ commit mới. Kiểm tra `release.json` và cả hai link tải.

Trang giữ link dự phòng đến GitHub Releases nếu không tải được metadata. README dùng GitHub Releases làm địa chỉ tải chính để luôn có đường tải độc lập với Vercel.
