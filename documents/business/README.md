# README - Tài liệu Business Logic

## Giới thiệu

Đây là bộ tài liệu về **Logic Nghiệp vụ** của hệ thống Mimkat API, được viết dành cho **người non-tech** (không chuyên về kỹ thuật).

Tài liệu sử dụng ngôn ngữ đơn giản, dễ hiểu, tránh thuật ngữ kỹ thuật phức tạp.

## Mục đích

- 📖 Giúp team non-tech hiểu cách hệ thống hoạt động
- 🤝 Hỗ trợ team Customer Support trả lời câu hỏi của người dùng
- 📊 Cung cấp thông tin cho Product Manager, Business Analyst
- 🎓 Đào tạo nhân viên mới về quy trình nghiệp vụ
- 📋 Tài liệu tham khảo cho stakeholders

## Đối tượng

✅ **Customer Support** - Hỗ trợ khách hàng

✅ **Product Manager** - Quản lý sản phẩm

✅ **Business Analyst** - Phân tích nghiệp vụ

✅ **Marketing Team** - Hiểu sản phẩm để marketing

✅ **Sales Team** - Giới thiệu sản phẩm cho khách hàng

✅ **Management** - Ra quyết định kinh doanh

✅ **Người dùng cuối** - Muốn hiểu rõ về hệ thống

## Danh sách Tài liệu

### 1. Tổng quan

**[00 - Tổng quan Hệ thống](00-tong-quan-he-thong.md)**

- Mimkat là gì?
- Các chức năng chính
- Đối tượng sử dụng
- Kiến trúc tổng quan

### 2. Tài khoản & Xác thực

**[01 - Đăng ký và Xác thực Tài khoản](01-dang-ky-va-xac-thuc.md)**

- Cách đăng ký tài khoản
- Đăng ký bằng Email vs Google
- Quy trình xác thực email
- Xử lý các trường hợp đặc biệt

**[02 - Quy trình Đăng nhập](02-dang-nhap.md)**

- Cách đăng nhập vào hệ thống
- Đăng nhập từ nhiều thiết bị
- Cơ chế duy trì đăng nhập
- Khôi phục mật khẩu

**[03 - Quản lý Phiên Đăng nhập](03-quan-ly-phien.md)**

- Phiên đăng nhập (Session) là gì?
- Vòng đời của một phiên
- Quản lý thiết bị đã đăng nhập
- Bảo mật phiên đăng nhập

### 3. Bảo mật & Quyền riêng tư

**[04 - Bảo mật và Quyền riêng tư](04-bao-mat.md)**

- Các lớp bảo mật
- Bảo vệ mật khẩu và token
- Quyền riêng tư dữ liệu
- Mẹo bảo vệ tài khoản

**[07 - Quy trình Xử lý Dữ liệu](07-xu-ly-du-lieu.md)**

- Vòng đời dữ liệu
- Thu thập và xử lý
- Lưu trữ và backup
- Quyền của người dùng
- Tuân thủ pháp luật

### 4. Giao tiếp & Thông báo

**[05 - Hệ thống Thông báo Email](05-thong-bao-email.md)**

- Các loại email
- Cấu trúc email
- Bảo mật email
- Xử lý sự cố email

### 5. Hỗ trợ

**[06 - FAQ - Câu hỏi Thường gặp](06-faq.md)**

- Về tài khoản
- Về đăng nhập
- Về bảo mật
- Về email
- Về hỗ trợ
- Thuật ngữ thường gặp

## Cách sử dụng Tài liệu

### Cho Customer Support

**Khi khách hàng hỏi về:**

- Đăng ký tài khoản → Đọc [01 - Đăng ký và Xác thực](01-dang-ky-va-xac-thuc.md)
- Không đăng nhập được → Đọc [02 - Đăng nhập](02-dang-nhap.md)
- Thấy thiết bị lạ → Đọc [03 - Quản lý Phiên](03-quan-ly-phien.md)
- Lo ngại bảo mật → Đọc [04 - Bảo mật](04-bao-mat.md)
- Không nhận email → Đọc [05 - Email](05-thong-bao-email.md)
- Câu hỏi chung → Đọc [06 - FAQ](06-faq.md)

### Cho Product Manager

**Khi cần:**

- Hiểu tổng quan hệ thống → [00 - Tổng quan](00-tong-quan-he-thong.md)
- Thiết kế flow mới → Tham khảo các flow hiện tại
- Viết PRD → Dùng ngôn ngữ tương tự
- Đề xuất tính năng → Hiểu rõ nghiệp vụ hiện tại

### Cho Business Analyst

**Khi phân tích:**

- Quy trình nghiệp vụ → Các tài liệu 01-07
- Xử lý dữ liệu → [07 - Xử lý Dữ liệu](07-xu-ly-du-lieu.md)
- Bảo mật → [04 - Bảo mật](04-bao-mat.md)
- Tuân thủ pháp luật → [07 - Xử lý Dữ liệu](07-xu-ly-du-lieu.md)

### Cho Marketing/Sales

**Khi giới thiệu sản phẩm:**

- Tính năng chính → [00 - Tổng quan](00-tong-quan-he-thong.md)
- Ưu điểm về bảo mật → [04 - Bảo mật](04-bao-mat.md)
- Dễ sử dụng thế nào → [01 - Đăng ký](01-dang-ky-va-xac-thuc.md), [02 - Đăng nhập](02-dang-nhap.md)
- Giải đáp thắc mắc → [06 - FAQ](06-faq.md)

## Nguyên tắc Viết

Tài liệu này tuân thủ các nguyên tắc:

### 1. Ngôn ngữ Đơn giản

- ✅ Dùng từ ngữ hàng ngày
- ✅ Giải thích thuật ngữ kỹ thuật
- ❌ Tránh jargon không cần thiết

### 2. Cấu trúc Rõ ràng

- ✅ Heading phân cấp logic
- ✅ Bullet points dễ đọc
- ✅ Sơ đồ trực quan
- ✅ Ví dụ cụ thể

### 3. Thực tế & Hữu ích

- ✅ Tình huống thực tế
- ✅ Giải pháp cụ thể
- ✅ Mẹo sử dụng
- ✅ Xử lý lỗi

### 4. Dễ Tìm kiếm

- ✅ Tiêu đề mô tả rõ nội dung
- ✅ Liên kết tài liệu liên quan
- ✅ FAQ tổng hợp

## Biểu tượng sử dụng

Để dễ đọc, tài liệu sử dụng các biểu tượng:

- ✅ Có thể làm / Nên làm / Đúng
- ❌ Không thể làm / Không nên làm / Sai
- ⚠️ Cảnh báo / Lưu ý quan trọng
- 📧 Email
- 🔒 Bảo mật
- 📱 Mobile / Điện thoại
- 💻 Desktop / Máy tính
- 🖥️ Máy tính để bàn
- 📲 Tablet / Máy tính bảng
- 🌍 Vị trí / Quốc tế
- 🕐 Thời gian
- 👤 Người dùng
- 🚨 Khẩn cấp
- 💡 Mẹo / Gợi ý
- 📊 Thống kê
- 🎁 Phần thưởng
- 🔧 Sửa chữa / Xử lý
- 📞 Điện thoại / Liên hệ

## Cập nhật Tài liệu

### Tần suất

- Cập nhật khi có thay đổi tính năng
- Review lại mỗi quý
- Sửa lỗi ngay khi phát hiện

### Quy trình

1. Tính năng mới → Cập nhật tài liệu
2. Review bởi Product Manager
3. Review bởi Tech Lead (kiểm tra tính chính xác)
4. Merge vào repository

### Đóng góp

Nếu bạn phát hiện:

- 🐛 Lỗi sai trong tài liệu
- 📝 Thiếu thông tin quan trọng
- 💡 Đề xuất cải thiện

**Liên hệ:**

- 📧 Email: docs@mimkat.com
- 💬 Tạo issue trên GitHub
- 📞 Nói với Tech Lead

## So sánh với Tài liệu Kỹ thuật

| Khía cạnh     | Business Docs (này)     | Technical Docs (khác) |
| ------------- | ----------------------- | --------------------- |
| **Đối tượng** | Non-tech                | Developers            |
| **Ngôn ngữ**  | Đơn giản, hàng ngày     | Kỹ thuật, chính xác   |
| **Nội dung**  | Quy trình nghiệp vụ     | API, Code, Database   |
| **Ví dụ**     | Tình huống người dùng   | Code samples          |
| **Mục đích**  | Hiểu hệ thống hoạt động | Triển khai kỹ thuật   |

**Tài liệu Kỹ thuật ở đâu?**

- API Docs: `/documents/apis/`
- Development Guides: `/documents/guides/`

## Liên kết Hữu ích

### Nội bộ

- [Tài liệu API](../apis/) - Cho developers
- [Environment Variables](../guides/environment-variables.md) - Setup môi trường

### Bên ngoài

- [Chính sách Bảo mật](https://mimkat.com/privacy) - Cho người dùng
- [Điều khoản Sử dụng](https://mimkat.com/terms) - Cho người dùng
- [Trung tâm Hỗ trợ](https://support.mimkat.com) - FAQ cho người dùng

## Feedback

Tài liệu này có hữu ích không? Có gì chưa rõ?

**Gửi feedback:**

- 📧 Email: docs@mimkat.com
- 💬 Chat với Product Team
- 📋 Điền form khảo sát (sắp có)

**Chúng tôi cam kết:**

- Đọc tất cả feedback
- Phản hồi trong 3-5 ngày làm việc
- Cập nhật tài liệu dựa trên góp ý

---

## Lịch sử Cập nhật

### Version 1.0 (Tháng 11, 2025)

- ✨ Ra mắt bộ tài liệu business đầu tiên
- 📄 7 tài liệu chính
- 📝 Bao quát toàn bộ quy trình xác thực và bảo mật

### Kế hoạch Tiếp theo

- [ ] Thêm tài liệu về Quản lý Công việc (Task Management)
- [ ] Thêm tài liệu về Làm việc Nhóm (Team Collaboration)
- [ ] Thêm tài liệu về Thông báo Push Notification
- [ ] Video hướng dẫn minh họa

---

**Bắt đầu từ:** [00 - Tổng quan Hệ thống](00-tong-quan-he-thong.md)

_Tài liệu được tạo và duy trì bởi Mimkat Team_
