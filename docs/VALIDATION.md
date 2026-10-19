# Kiểm chứng Lịch âm

## Bản 1.1.0

- **18 kiểm thử logic lịch** vẫn đạt, gồm 73.414 ngày trong dải 1900–2100.
- **13 kiểm thử giao diện**: 10 kịch bản lịch đầy đủ và 3 kịch bản widget (bố cục 360×480, nền trang trong suốt, đồng bộ nền/khóa giữa hai cửa sổ, khôi phục sau reload, đổi ngày UTC+7).
- **2 kiểm thử Rust**: khôi phục tùy chọn cũ bằng giá trị mặc định và kiểm tra đầy đủ biên cửa sổ với màn hình có tọa độ âm.
- Build Rust/Tauri release x64 và NSIS thành công.
- Kiểm thử tích hợp file exe thật qua WebView2: `--autostart` giữ cửa sổ lớn ẩn, widget hiện; nền 100% trong suốt nhưng chữ opacity 1; khóa vị trí, ẩn/hiện, thêm/xóa đăng ký khởi động, đường dẫn exe có quote, chống chạy trùng, nhớ tùy chọn và khôi phục vị trí qua lần mở lại.
- Cài vào thư mục riêng có dấu cách và chạy lại toàn bộ kiểm thử native; mã thoát cài/gỡ đều 0. Gỡ cài đặt xóa file ứng dụng và đăng ký tự khởi động.
- Trang tải qua kiểm tra desktop 1280 px/mobile 390 px, không tràn ngang, không lỗi console/CSP và link tải sinh đúng theo phiên bản.

Luồng tự khởi động được kiểm chứng bằng đăng ký Windows và tham số `--autostart`; không đăng xuất hay khởi động lại máy của người dùng. Widget vẫn là cửa sổ không viền, không nhúng vào lớp hình nền và không bảo đảm luôn hiện sau Win+D.

Kiểm thử native có thể chạy lại bằng `node scripts/check-native.mjs` khi không có phiên bản Lịch âm khác đang mở. Script chỉ mở cổng debug WebView2 localhost trong tiến trình kiểm thử, khôi phục tùy chọn và tắt tự khởi động sau kiểm tra. Cổng debug không được bật trong ứng dụng thông thường.

## Các kiểm chứng từ bản 1.0

## Logic lịch

18 bài kiểm thử trong `src/calendar.test.ts`:

- Chuyển âm–dương rồi đổi ngược lại đủ **73.414 ngày**, từ 01/01/1900 đến hết 31/12/2100; kiểm tra tính liên tục của ngày âm và độ dài tháng 29/30 ngày.
- Kiểm tra số tháng của mọi năm 1900–2100: 12 hoặc 13 tháng, tối đa một tháng nhuận. Xác minh tháng 2 nhuận 2023 và tháng 6 nhuận 2025.
- Các mốc Tết, Trung thu, tháng nhuận và tên năm trước/sau Tết.
- Năm dương 1900/2000/2100, ngày 31/4, ngày âm vượt độ dài tháng, tháng nhuận không tồn tại và ranh giới dải hỗ trợ.
- UTC+7 đổi ngày ở 17:00 UTC; lưới lịch bắt đầu thứ Hai; điều hướng cuối tháng; ngày lễ truyền thống không lặp lại ở tháng nhuận.

Chuyển đổi qua lại là kiểm tra tính nhất quán, **không phải** đối chiếu độc lập từng ngày với lịch xuất bản. Một số mốc được đối chiếu riêng; đây là phạm vi bảo đảm thực tế của bộ kiểm thử.

## Nguồn và mốc tham khảo

- Tết 2026, 17/02/2026 = 01/01/Bính Ngọ: Cổng Thông tin điện tử Chính phủ, <https://tphcm.chinhphu.vn/hanh-khach-di-lai-mien-phi-tren-tau-metro-so-1-ngay-29-thang-chap-den-mong-1-tet-binh-ngo-2026-101260204190908512.htm>.
- Bảng lịch 28/07/2025 của Báo Hà Tĩnh ghi ngày 4 tháng 6 nhuận, tương ứng đầu tháng là 25/07/2025: <https://cdn.baohatinh.vn/files/bc4e011dc1286e6f6f0781566444224204ca0ce0324febdb70bec86aef89a9a4/28-7.pdf>.
- Kiểm tra chéo Tết 2027 = 06/02/2027 với engine thiên văn UTC+7 riêng: <https://github.com/doxuta/amlich>.
- Các mốc phân biệt lịch UTC+7/UTC+8 (Tết 1968, Tết 1985) được dùng làm hồi quy; tham khảo quy tắc của tác giả thuật toán: <https://www.xemamlich.uhm.vn/histcal.html>.
- Thư viện cơ sở, tài liệu và nguồn gốc thuật toán: <https://github.com/nacana22/lunar-date>. Bản ứng dụng khóa dependency npm ở phiên bản 2.0.1 bằng package-lock.

App dùng lịch Việt Nam UTC+7 nhất quán cho dải hỗ trợ, không tái dựng từng thay đổi múi giờ/lịch pháp định lịch sử theo vùng miền.

## Giao diện

10 kịch bản Playwright: hôm nay/đổi tháng, tra cứu Tết và mở ngày kết quả, tra cứu tháng nhuận, dữ liệu nhập sai, hai ranh giới 1900/2100, bàn phím, lưu theme khi reload, qua nửa đêm Việt Nam, bố cục 360/460/680 px và thao tác khi ngoại tuyến sau khi tải giao diện.

Các kiểm tra này chạy với Microsoft Edge headless, thời gian cố định 19/10/2026 để kết quả tái lập. Kiểm tra bố cục bổ sung gồm cửa sổ cao 640 px, cùng ảnh render ở mật độ pixel 1×, 1.25× và 1.5×. Ảnh mật độ pixel này không thay thế việc thay đổi cài đặt DPI toàn hệ thống Windows.

## Bản Windows

- Build Tauri/Rust release x64 thành công; tạo bộ cài NSIS bằng công cụ chính thức của Tauri, không cần chạy máy chủ Vite khi sử dụng.
- Cài thử im lặng vào thư mục kiểm thử riêng: mã thoát **0**, có `lich-am.exe` và `uninstall.exe`.
- Mở ứng dụng đã cài, kiểm tra trực tiếp lịch và hộp tra cứu/cài đặt bằng Windows Computer Use.
- Chọn giao diện tối: `preferences.json` ghi `theme: dark`; đóng rồi mở lại ứng dụng giữ đúng giao diện tối.
- Sau kiểm tra màn hình thực tế, cửa sổ mặc định được chỉnh về cao **640 px**, với bố cục gọn cho màn hình thấp.
- Gỡ bản cài thử bằng uninstaller NSIS: mã thoát **0**, file ứng dụng trong thư mục cài thử được xóa thành công.
- Mở lại bản phát hành cuối từ thư mục mã nguồn được chỉ định: cửa sổ gọn hiển thị đủ hai nút **Về hôm nay** và **Tra cứu ngày** trên màn hình thực tế.

## Chi tiết xác thực tháng nhuận

Thư viện cơ sở có thể giữ nguyên cờ `leap_month` của đầu vào ngay cả khi tháng đó không nhuận. Ứng dụng không tin trực tiếp cờ này: nó chuyển sang ngày dương rồi tính lại âm lịch, so sánh đủ ngày/tháng/năm và cờ nhuận. Cùng bước kiểm tra này loại ngày 30 trong tháng chỉ có 29 ngày. Danh sách tháng nhuận cũng được xác thực bằng cách chuyển đổi lại.
