# Authentication APIs Documentation

## Overview

Tài liệu API xác thực và quản lý người dùng cho hệ thống mimkat-api.

**Base URL**: `/auth`

**Technology Stack**:

- Framework: NestJS
- Authentication: JWT (JSON Web Tokens)
- Password Hashing: bcrypt (salt rounds = 12)
- OAuth Provider: Google OAuth 2.0
- Database: PostgreSQL + Prisma ORM
- Email Service: NodeMailer

---

## API Endpoints Summary

### Authentication

| Method | Endpoint       | Description                 | Auth Required | Rate Limit  |
| ------ | -------------- | --------------------------- | ------------- | ----------- |
| POST   | /auth/register | Đăng ký tài khoản mới       | No            | 5 / 15 min  |
| POST   | /auth/login    | Đăng nhập                   | No            | 10 / 15 min |
| POST   | /auth/logout   | Đăng xuất thiết bị hiện tại | Yes           | -           |
| POST   | /auth/refresh  | Làm mới access token        | No            | -           |
| GET    | /auth/me       | Lấy thông tin user hiện tại | Yes           | -           |

### Email Verification

| Method | Endpoint                  | Description            | Auth Required | Rate Limit |
| ------ | ------------------------- | ---------------------- | ------------- | ---------- |
| GET    | /auth/verify-email        | Xác thực email         | No            | -          |
| POST   | /auth/resend-verification | Gửi lại email xác thực | No            | 3 / 1 hour |

### Password Reset

| Method | Endpoint              | Description            | Auth Required | Rate Limit |
| ------ | --------------------- | ---------------------- | ------------- | ---------- |
| POST   | /auth/forgot-password | Yêu cầu reset password | No            | 3 / 1 hour |
| POST   | /auth/reset-password  | Đặt lại password mới   | No            | 5 / 1 hour |

### Google OAuth

| Method | Endpoint              | Description              | Auth Required |
| ------ | --------------------- | ------------------------ | ------------- |
| GET    | /auth/google          | Khởi tạo Google OAuth    | No            |
| GET    | /auth/google/callback | Xử lý callback từ Google | No            |

### Session Management

| Method | Endpoint                | Description               | Auth Required |
| ------ | ----------------------- | ------------------------- | ------------- |
| GET    | /auth/sessions          | Danh sách phiên đăng nhập | Yes           |
| DELETE | /auth/sessions          | Đăng xuất tất cả thiết bị | Yes           |
| DELETE | /auth/sessions/:tokenId | Đăng xuất thiết bị cụ thể | Yes           |

---

## Documentation Files

### 📄 [Authentication](./authentication.md)

API xác thực cơ bản: đăng ký, đăng nhập, đăng xuất, refresh token.

**Key Features**:

- Email/password registration
- JWT-based authentication
- Token rotation on refresh
- Device tracking
- Concurrent session management

**Endpoints**:

- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/logout` - Đăng xuất
- `POST /auth/refresh` - Refresh token

---

### 📄 [Email Verification](./email-verification.md)

Xác thực email sau khi đăng ký.

**Key Features**:

- Token-based verification (48 hours expiry)
- Secure token hashing with bcrypt
- Resend verification email
- Auto-send on registration

**Endpoints**:

- `GET /auth/verify-email?token=...` - Xác thực email
- `POST /auth/resend-verification` - Gửi lại email

---

### 📄 [Password Reset](./password-reset.md)

Quên mật khẩu và đặt lại mật khẩu.

**Key Features**:

- Secure reset token (1 hour expiry)
- Email privacy protection
- Session invalidation after reset
- Local accounts only

**Endpoints**:

- `POST /auth/forgot-password` - Gửi email reset
- `POST /auth/reset-password` - Đặt lại mật khẩu

---

### 📄 [Google OAuth](./google-oauth.md)

Đăng nhập bằng Google OAuth 2.0.

**Key Features**:

- Authorization Code Flow
- Auto email verification
- Account linking (local → Google)
- Spam prevention

**Endpoints**:

- `GET /auth/google` - Khởi tạo OAuth
- `GET /auth/google/callback` - OAuth callback

---

### 📄 [Session Management](./session-management.md)

Quản lý phiên đăng nhập trên nhiều thiết bị.

**Key Features**:

- Multi-device session tracking
- Device information (name, type, IP, user-agent)
- Remote logout
- Concurrent session limit

**Endpoints**:

- `GET /auth/sessions` - Danh sách sessions
- `DELETE /auth/sessions` - Logout all
- `DELETE /auth/sessions/:tokenId` - Logout device

---

### 📄 [User Profile](./user-profile.md)

Lấy thông tin profile người dùng hiện tại.

**Key Features**:

- JWT-based user info
- Minimal data exposure
- No password/tokens in response

**Endpoints**:

- `GET /auth/me` - Current user info

---

## Authentication Flow

### 1. Registration & Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant M as Mail Service

    Note over U,M: Registration
    U->>F: Fill registration form
    F->>B: POST /auth/register {email, password}
    B->>B: Hash password (bcrypt, rounds=12)
    B->>B: Generate verification token
    B->>DB: Create user (isEmailVerified: false)
    B->>M: Send verification email
    M->>U: Email with verification link
    B->>F: 201 Created

    Note over U,M: Email Verification
    U->>F: Click verification link
    F->>B: GET /auth/verify-email?token=...
    B->>DB: Verify token and update user
    B->>F: 200 OK

    Note over U,M: Login
    U->>F: Fill login form
    F->>B: POST /auth/login {email, password}
    B->>DB: Find user and verify password
    B->>B: Generate JWT tokens
    B->>DB: Create session with device info
    B->>F: {accessToken, refreshToken, user}
    F->>F: Store tokens in localStorage
```

### 2. Google OAuth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as Google
    participant DB as Database

    U->>F: Click "Sign in with Google"
    F->>B: GET /auth/google
    B->>G: Redirect to Google OAuth
    G->>U: Google consent screen
    U->>G: Approve permissions
    G->>B: Redirect to /auth/google/callback?code=...
    B->>G: Exchange code for user data
    G->>B: {googleId, email, name, avatar}
    B->>DB: Find or create user
    B->>B: Generate JWT tokens
    B->>DB: Create session
    B->>F: Redirect with authData (base64)
    F->>F: Decode and store tokens
    F->>U: Redirect to dashboard
```

### 3. Token Refresh Flow

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    F->>B: API call with expired accessToken
    B->>F: 401 Unauthorized
    F->>B: POST /auth/refresh {refreshToken}
    B->>DB: Verify refresh token
    B->>B: Generate new tokens
    B->>DB: Delete old session
    B->>DB: Create new session (token rotation)
    B->>F: {accessToken, refreshToken}
    F->>F: Update stored tokens
    F->>B: Retry original API call
```

---

## Security Features

### Password Security

- **Hashing**: bcrypt with salt rounds = 12
- **Minimum length**: 8 characters
- **Validation**: Required on registration and reset

### Token Security

**Access Token**:

- Algorithm: HS256 (HMAC with SHA-256)
- TTL: 1 hour
- Storage: Client-side (localStorage or memory)

**Refresh Token**:

- Algorithm: HS256
- TTL: 7 days
- Storage: Database + Client-side
- Rotation: New token on each refresh

**Verification/Reset Tokens**:

- Generation: `crypto.randomBytes(32).toString('hex')`
- Storage: Hashed in database
- Expiry: 48 hours (verification), 1 hour (reset)

### Rate Limiting

| Endpoint                       | Limit       | Window |
| ------------------------------ | ----------- | ------ |
| POST /auth/register            | 5 requests  | 15 min |
| POST /auth/login               | 10 requests | 15 min |
| POST /auth/resend-verification | 3 requests  | 1 hour |
| POST /auth/forgot-password     | 3 requests  | 1 hour |
| POST /auth/reset-password      | 5 requests  | 1 hour |

### Session Security

- **Device tracking**: IP, user-agent, device type
- **Concurrent limit**: Configurable max sessions
- **Auto cleanup**: Expired sessions removed
- **Remote logout**: User can logout specific devices

### Privacy Protection

- **Email enumeration**: No distinction between existing/non-existing emails in forgot-password
- **Provider protection**: OAuth accounts can't reset password
- **Spam prevention**: Unverified accounts replaced by Google login

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mimkat"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# Frontend URL
FRONTEND_URL="http://localhost:3001"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Email Service (NodeMailer)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASSWORD="your-app-password"
MAIL_FROM="noreply@mimkat.com"
```

### Optional Variables

```bash
# Token Expiration (defaults shown)
JWT_ACCESS_TOKEN_EXPIRATION="1h"
JWT_REFRESH_TOKEN_EXPIRATION="7d"

# Session Configuration
MAX_CONCURRENT_SESSIONS=5
```

---

## Error Codes

### Common HTTP Status Codes

| Code | Name                  | Description                       |
| ---- | --------------------- | --------------------------------- |
| 200  | OK                    | Request successful                |
| 201  | Created               | Resource created successfully     |
| 400  | Bad Request           | Invalid input data                |
| 401  | Unauthorized          | Invalid or missing authentication |
| 409  | Conflict              | Resource already exists           |
| 429  | Too Many Requests     | Rate limit exceeded               |
| 500  | Internal Server Error | Server error                      |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error description" | ["Error 1", "Error 2"],
  "error": "Bad Request"
}
```

---

## Testing

### API Testing with cURL

See individual documentation files for cURL examples.

### Postman Collection

A Postman collection is available (to be created) with:

- All endpoints
- Environment variables
- Pre-request scripts for token management
- Test scripts for response validation

---

## Client Integration Examples

### React/Next.js Integration

See [User Profile](./user-profile.md) for complete React examples including:

- Auth Context Provider
- Protected Routes
- Auto token refresh
- SWR hooks

### Storage Recommendations

**localStorage** (Recommended for web apps):

```typescript
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
```

**Memory** (Recommended for sensitive apps):

```typescript
// Store in memory (lost on page refresh)
let accessToken: string | null = null;
let refreshToken: string | null = null;
```

**Cookies** (Server-side rendering):

```typescript
// Set httpOnly cookies from backend
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000, // 1 hour
});
```

---

## Database Schema

### User Model

```prisma
model User {
  id                        String    @id @default(cuid())
  email                     String    @unique
  password                  String?
  fullName                  String?
  username                  String?   @unique
  avatar                    String?
  provider                  String    @default("local")
  googleId                  String?   @unique
  isEmailVerified           Boolean   @default(false)
  isActive                  Boolean   @default(true)
  verificationToken         String?
  verificationTokenExpiry   DateTime?
  passwordResetToken        String?
  passwordResetTokenExpiry  DateTime?
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt

  sessions Session[]
}
```

### Session Model

```prisma
model Session {
  id            String   @id @default(cuid())
  userId        String
  refreshToken  String   @unique
  deviceName    String?
  deviceType    String?
  ipAddress     String?
  userAgent     String?
  lastUsedAt    DateTime @default(now())
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

---

## Support & Resources

### Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/)
- [Google OAuth Setup](https://console.cloud.google.com/)

### Related Documents

- [Business Requirements](../../business/README.md)
- [Environment Variables Guide](../../guides/environment-variables.md)

---

## Changelog

### v1.0.0 (2025-11-07)

- ✅ Email/password authentication
- ✅ JWT access/refresh tokens with rotation
- ✅ Email verification
- ✅ Password reset
- ✅ Google OAuth 2.0
- ✅ Multi-device session management
- ✅ Device tracking
- ✅ Rate limiting
- ✅ Account linking
- ✅ Spam prevention

---

## License

Copyright © 2025 Mimkat. All rights reserved.
