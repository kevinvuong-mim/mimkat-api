# Hướng dẫn lấy các biến môi trường

Tài liệu này hướng dẫn cách lấy các biến môi trường cần thiết cho dự án mimkat-api.

## 1. Google OAuth

### GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET

**Bước 1: Truy cập Google Cloud Console**

- Truy cập [Google Cloud Console](https://console.cloud.google.com/)
- Đăng nhập bằng tài khoản Google của bạn

**Bước 2: Tạo hoặc chọn Project**

- Nếu chưa có project, tạo project mới bằng cách click vào dropdown project ở góc trên bên trái và chọn "New Project"
- Nhập tên project và click "Create"
- Nếu đã có project, chọn project đó

**Bước 3: Kích hoạt Google+ API**

- Vào menu "APIs & Services" > "Library"
- Tìm kiếm "Google+ API" hoặc "Google People API"
- Click vào và nhấn "Enable"

**Bước 4: Tạo OAuth 2.0 Credentials**

- Vào menu "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth client ID"
- Nếu chưa có OAuth consent screen, bạn sẽ được yêu cầu cấu hình:
  - Chọn "External" user type (hoặc "Internal" nếu dùng Google Workspace)
  - Điền thông tin ứng dụng (tên, email hỗ trợ, v.v.)
  - Thêm scopes cần thiết (email, profile, openid)
  - Thêm test users nếu ứng dụng đang ở chế độ testing
  - Click "Save and Continue"

**Bước 5: Cấu hình OAuth Client**

- Chọn "Application type" là "Web application"
- Nhập tên cho OAuth client
- Thêm "Authorized JavaScript origins":
  - `http://localhost:3000` (cho development)
  - Domain production của bạn
- Thêm "Authorized redirect URIs":
  - `http://localhost:3000/api/v1/auth/google/callback` (cho development)
  - URL production callback của bạn
- Click "Create"

**Bước 6: Lấy credentials**

- Sau khi tạo xong, một popup sẽ hiện ra với:
  - **Client ID** → Sao chép và dán vào `GOOGLE_CLIENT_ID`
  - **Client Secret** → Sao chép và dán vào `GOOGLE_CLIENT_SECRET`
- Bạn cũng có thể xem lại credentials này bất cứ lúc nào trong "Credentials" tab

### GOOGLE_CALLBACK_URL

Đây là URL mà Google OAuth sẽ redirect người dùng về sau khi xác thực thành công.

**Format:**

```
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
```

**Lưu ý:**

- Đối với môi trường development: `http://localhost:3000/api/v1/auth/google/callback`
- Đối với môi trường production: `https://yourdomain.com/api/v1/auth/google/callback`
- URL này phải khớp với "Authorized redirect URIs" đã cấu hình trong Google Cloud Console

---

## 2. Database

### DATABASE_URL

Đây là connection string để kết nối tới PostgreSQL database.

**Format:**

```
DATABASE_URL="postgresql://username:password@host:port/database_name"
```

**Các thành phần:**

- `username`: Tên user PostgreSQL (mặc định: `postgres`)
- `password`: Mật khẩu của user
- `host`: Địa chỉ server database (mặc định: `localhost`)
- `port`: Cổng PostgreSQL (mặc định: `5432`)
- `database_name`: Tên database (ví dụ: `mimkat`)

**Ví dụ:**

```
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/mimkat"
```

**Hướng dẫn cài đặt PostgreSQL:**

**Trên macOS (sử dụng Homebrew):**

```bash
# Cài đặt PostgreSQL
brew install postgresql@15

# Khởi động PostgreSQL service
brew services start postgresql@15

# Tạo database
createdb mimkat
```

**Trên Ubuntu/Debian:**

```bash
# Cài đặt PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Khởi động service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Tạo database
sudo -u postgres createdb mimkat
```

**Trên Windows:**

- Download PostgreSQL installer từ [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
- Chạy installer và làm theo hướng dẫn
- Sử dụng pgAdmin hoặc psql để tạo database

---

## 3. JWT (JSON Web Token)

### JWT_SECRET

Secret key để ký và xác thực access token.

**Cách tạo:**

**Sử dụng OpenSSL:**

```bash
openssl rand -base64 32
```

**Sử dụng Node.js:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Sử dụng online generator:**

- Truy cập [https://randomkeygen.com/](https://randomkeygen.com/)
- Sao chép một trong các CodeIgniter Encryption Keys hoặc 256-bit WPA Key

**Ví dụ:**

```
JWT_SECRET="aB3$xY9#mK8@pL2&nQ7*rT5%vW1!zD4^"
```

**Lưu ý:**

- Phải là chuỗi ngẫu nhiên, dài ít nhất 32 ký tự
- Không chia sẻ secret này với bất kỳ ai
- Sử dụng secret khác nhau cho mỗi môi trường (dev, staging, production)

### JWT_REFRESH_SECRET

Secret key để ký và xác thực refresh token.

**Cách tạo:** Tương tự như JWT_SECRET, nhưng phải khác với JWT_SECRET

```bash
openssl rand -base64 32
```

**Ví dụ:**

```
JWT_REFRESH_SECRET="cD6%eF4*gH2@iJ8#kL1&mN9$oP3!qR7^"
```

**Lưu ý:**

- Phải khác với JWT_SECRET
- Không bao giờ sử dụng cùng một secret cho cả access token và refresh token

---

## 4. Email Configuration

### MAIL_HOST

SMTP server host để gửi email.

**Các SMTP host phổ biến:**

- Gmail: `smtp.gmail.com`
- Outlook/Hotmail: `smtp-mail.outlook.com`
- Yahoo: `smtp.mail.yahoo.com`
- SendGrid: `smtp.sendgrid.net`
- Mailgun: `smtp.mailgun.org`

**Ví dụ:**

```
MAIL_HOST="smtp.gmail.com"
```

### MAIL_PORT

Cổng SMTP server.

**Các port phổ biến:**

- `587`: TLS/STARTTLS (khuyến nghị)
- `465`: SSL
- `25`: Không mã hóa (không khuyến nghị)

**Ví dụ:**

```
MAIL_PORT=587
```

### MAIL_USER

Địa chỉ email dùng để gửi email.

**Ví dụ:**

```
MAIL_USER="your-email@gmail.com"
```

### MAIL_PASSWORD

Đây là mật khẩu ứng dụng (App Password) để gửi email qua Gmail.

**Bước 1: Bật xác thực 2 bước (2FA)**

- Truy cập [Google Account Security](https://myaccount.google.com/security)
- Đăng nhập bằng tài khoản Gmail muốn sử dụng
- Tìm phần "2-Step Verification" và click vào
- Làm theo hướng dẫn để bật 2FA (nếu chưa bật)

**Bước 2: Tạo App Password**

- Sau khi bật 2FA, quay lại [Google Account Security](https://myaccount.google.com/security)
- Tìm phần "2-Step Verification" và click vào
- Cuộn xuống phần "App passwords" và click vào
- Hoặc truy cập trực tiếp: [App Passwords](https://myaccount.google.com/apppasswords)

**Bước 3: Tạo mật khẩu ứng dụng mới**

- Chọn "Select app" → "Mail"
- Chọn "Select device" → "Other (Custom name)"
- Nhập tên ứng dụng (ví dụ: "Mimkat API")
- Click "Generate"

**Bước 4: Lấy mật khẩu**

- Google sẽ hiển thị một mật khẩu 16 ký tự
- Sao chép mật khẩu này (không có khoảng trắng)
- Dán vào biến `MAIL_PASSWORD` trong file `.env`

**Ví dụ:**

```
MAIL_PASSWORD=abcd efgh ijkl mnop
```

(Loại bỏ khoảng trắng: `abcdefghijklmnop`)

**Lưu ý:**

- Không sử dụng mật khẩu đăng nhập Gmail thông thường
- Mỗi App Password chỉ hiển thị một lần duy nhất, hãy lưu lại cẩn thận
- Nếu mất App Password, bạn cần tạo lại một cái mới
- Có thể thu hồi App Password bất cứ lúc nào từ trang quản lý

### MAIL_FROM

Địa chỉ email hiển thị trong phần "From" khi gửi email.

**Ví dụ:**

```
MAIL_FROM="noreply@mimkat.com"
```

**Lưu ý:**

- Có thể khác với MAIL_USER
- Thường sử dụng địa chỉ dạng `noreply@` hoặc `support@`
- Email này sẽ hiển thị cho người nhận

### APP_URL

URL của ứng dụng, dùng để tạo các link trong email (reset password, verify email, v.v.)

**Ví dụ:**

```
# Development
APP_URL="http://localhost:3000"

# Production
APP_URL="https://mimkat.com"
```

---

## 5. CORS (Cross-Origin Resource Sharing)

### CORS_ORIGIN

Danh sách các domain được phép truy cập API.

**Format:**

```
CORS_ORIGIN="http://localhost:3001, http://localhost:3002"
```

**Lưu ý:**

- Các domain cách nhau bởi dấu phẩy và khoảng trắng
- Không có dấu `/` ở cuối URL
- Có thể thêm nhiều domain

**Ví dụ:**

```
# Development - nhiều client app
CORS_ORIGIN="http://localhost:3001, http://localhost:3002, http://localhost:3003"

# Production
CORS_ORIGIN="https://mimkat.com, https://admin.mimkat.com"

# Cho phép tất cả (không khuyến nghị cho production)
CORS_ORIGIN="*"
```

---

## 6. Server Configuration

### PORT

Cổng mà server API sẽ chạy.

**Ví dụ:**

```
PORT=3000
```

**Lưu ý:**

- Port mặc định thường là 3000
- Đảm bảo port không bị sử dụng bởi ứng dụng khác
- Có thể thay đổi nếu cần (3001, 8000, 8080, v.v.)

---

## Tổng hợp - File .env hoàn chỉnh

Sau khi lấy được tất cả các biến, thêm chúng vào file `.env` của dự án:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mimkat"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Email
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASSWORD="your-app-password"
MAIL_FROM="noreply@mimkat.com"
APP_URL="http://localhost:3000"

# CORS
CORS_ORIGIN="http://localhost:3001, http://localhost:3002"

# Server
PORT=3000
```

**Lưu ý quan trọng:**

- File `.env` chứa thông tin nhạy cảm, không commit lên Git
- Đảm bảo `.env` đã được thêm vào `.gitignore`
- Sử dụng file `.env.example` để chia sẻ template với team
- Mỗi môi trường (dev, staging, production) nên có file `.env` riêng với các giá trị khác nhau

## Kiểm tra

Sau khi cấu hình xong, khởi động lại ứng dụng để các biến môi trường có hiệu lực:

```bash
npm run start:dev
```

## Troubleshooting

### Lỗi Database

**Lỗi: "ECONNREFUSED" hoặc không kết nối được database**

- Kiểm tra PostgreSQL service đã chạy chưa
- Kiểm tra username, password, host, port trong DATABASE_URL có đúng không
- Kiểm tra database đã được tạo chưa
- Kiểm tra firewall có chặn kết nối không

**Lỗi: "authentication failed"**

- Kiểm tra lại username và password
- Kiểm tra user có quyền truy cập database không

### Lỗi JWT

**Lỗi: "invalid token" hoặc "jwt malformed"**

- Kiểm tra JWT_SECRET và JWT_REFRESH_SECRET có được set đúng không
- Kiểm tra secret có bị thay đổi giữa các lần khởi động không
- Đảm bảo secret đủ dài và phức tạp

### Lỗi Google OAuth

**Lỗi: "redirect_uri_mismatch"**

- Kiểm tra GOOGLE_CALLBACK_URL khớp với Authorized redirect URIs trong Google Console
- Đảm bảo không có khoảng trắng thừa trong URL

**Lỗi: "access_denied"**

- Kiểm tra ứng dụng có được publish (hoặc thêm test users) chưa
- Xác nhận Google+ API hoặc Google People API đã được enable
- Kiểm tra OAuth consent screen đã cấu hình đầy đủ

**Lỗi: "invalid_client"**

- Kiểm tra GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET có đúng không
- Kiểm tra không có khoảng trắng thừa

### Lỗi Email

**Lỗi: "Invalid login" hoặc "Authentication failed"**

- Kiểm tra đã bật 2FA cho tài khoản Gmail chưa
- Kiểm tra App Password có đúng không (16 ký tự, không có khoảng trắng)
- Kiểm tra MAIL_USER có đúng địa chỉ email không

**Lỗi: "Connection timeout"**

- Kiểm tra MAIL_HOST và MAIL_PORT có đúng không
- Kiểm tra firewall hoặc antivirus có chặn kết nối SMTP không
- Thử chuyển sang port khác (587 hoặc 465)

**Lỗi: Gmail bị khóa**

- Truy cập [https://accounts.google.com/DisplayUnlockCaptcha](https://accounts.google.com/DisplayUnlockCaptcha)
- Làm theo hướng dẫn để mở khóa tài khoản

### Lỗi CORS

**Lỗi: "CORS policy: No 'Access-Control-Allow-Origin' header"**

- Kiểm tra CORS_ORIGIN có chứa domain của client app không
- Đảm bảo format đúng (các domain cách nhau bởi dấu phẩy)
- Kiểm tra không có dấu `/` ở cuối URL

### Lỗi Server

**Lỗi: "Port already in use"**

- Port đã bị sử dụng bởi ứng dụng khác
- Thay đổi PORT trong file `.env`
- Hoặc dừng ứng dụng đang chạy trên port đó:

```bash
# Tìm process đang dùng port
lsof -i :3000

# Kill process
kill -9 <PID>
```
