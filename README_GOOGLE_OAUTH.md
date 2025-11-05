# Mimkat API - Google OAuth Integration

## 🚀 Tính năng mới: Đăng nhập bằng Google

API đã được tích hợp tính năng đăng nhập bằng Google OAuth2, cho phép người dùng đăng nhập nhanh chóng và an toàn bằng tài khoản Google của họ.

## 📋 Yêu cầu

- Node.js v24+
- PostgreSQL
- Google Cloud Console account

## 🔧 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Google OAuth

Xem chi tiết trong file [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

Tóm tắt:

1. Tạo OAuth 2.0 Client ID tại [Google Cloud Console](https://console.cloud.google.com/)
2. Thêm Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
3. Copy Client ID và Client Secret vào file `.env`

### 3. Cấu hình file .env

```bash
cp .env.example .env
```

Cập nhật các biến sau trong file `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
```

### 4. Chạy migrations

```bash
npx prisma migrate dev
```

### 5. Khởi động server

```bash
npm run start:dev
```

## 📚 API Endpoints

### Authentication Endpoints

#### 1. Register (Local Auth)

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

#### 2. Login (Local Auth)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### 3. Google OAuth Login (NEW! 🎉)

**Initiate Google Login:**

```http
GET /auth/google
```

Browser sẽ redirect đến Google login page.

**Callback (Handled automatically):**

```http
GET /auth/google/callback
```

Google sẽ redirect về endpoint này sau khi user đăng nhập thành công.

**Response:**

```json
{
  "message": "Google login successful",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "fullName": "John Doe",
    "avatar": "https://lh3.googleusercontent.com/..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 4. Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### 5. Logout

```http
POST /auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### 6. Get Active Sessions

```http
GET /auth/sessions
Authorization: Bearer {accessToken}
```

#### 7. Logout All Devices

```http
DELETE /auth/sessions
Authorization: Bearer {accessToken}
```

#### 8. Logout Specific Device

```http
DELETE /auth/sessions/{tokenId}
Authorization: Bearer {accessToken}
```

## 🎨 Frontend Integration

### React Example

```jsx
import React from 'react';

function LoginPage() {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div>
      <h1>Login</h1>

      {/* Traditional Login Form */}
      <form>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>

      {/* Google OAuth Login */}
      <button onClick={handleGoogleLogin}>🔐 Sign in with Google</button>
    </div>
  );
}

export default LoginPage;
```

### Xử lý Callback

**Option 1: Backend redirect với tokens trong query string**

```jsx
// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { accessToken, refreshToken } = router.query;

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Redirect to dashboard
      router.push('/dashboard');
    }
  }, [router.query]);

  return <div>Authenticating...</div>;
}
```

**Option 2: Backend trả về HTML page với postMessage**

Backend có thể trả về HTML page này:

```html
<script>
  window.opener.postMessage(
    {
      type: 'GOOGLE_AUTH_SUCCESS',
      accessToken: 'xxx',
      refreshToken: 'yyy',
    },
    '*',
  );
  window.close();
</script>
```

Frontend:

```jsx
function LoginPage() {
  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        localStorage.setItem('accessToken', event.data.accessToken);
        localStorage.setItem('refreshToken', event.data.refreshToken);
        // Redirect to dashboard
      }
    });
  }, []);

  const handleGoogleLogin = () => {
    window.open(
      'http://localhost:3000/auth/google',
      'Google Login',
      'width=500,height=600',
    );
  };

  return <button onClick={handleGoogleLogin}>Sign in with Google</button>;
}
```

### Next.js App Router Example

```tsx
// app/login/page.tsx
'use client';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="bg-white border border-gray-300 rounded-lg px-6 py-2 flex items-center gap-2"
    >
      <img src="/google-logo.svg" alt="Google" className="w-5 h-5" />
      Sign in with Google
    </button>
  );
}
```

### Vue.js Example

```vue
<template>
  <div class="login-page">
    <h1>Login</h1>

    <!-- Google Login Button -->
    <button @click="handleGoogleLogin" class="google-btn">
      🔐 Sign in with Google
    </button>
  </div>
</template>

<script setup>
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3000/auth/google';
};
</script>
```

## 🔐 Security Features

1. **JWT Tokens**: Access token (15m) và Refresh token (7d)
2. **Device Tracking**: Theo dõi và quản lý nhiều devices
3. **Session Management**: Logout specific device hoặc all devices
4. **Password Security**: Bcrypt với 12 rounds
5. **OAuth2**: Google OAuth2 authentication
6. **Account Linking**: Tự động link Google account với local account nếu email trùng

## 🗄️ Database Schema

### User Model

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String?   // Optional cho Google users
  username  String?   @unique
  fullName  String?
  isActive  Boolean   @default(true)

  // Google OAuth fields
  googleId  String?   @unique
  avatar    String?
  provider  String?   @default("local") // 'local' or 'google'

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  sessions  Session[]
}
```

## 📝 User Flow

### Local Registration/Login Flow

```
1. User registers with email/password
2. Password được hash với bcrypt
3. User login với credentials
4. Server generate JWT tokens
5. Client store tokens và sử dụng cho authenticated requests
```

### Google OAuth Flow

```
1. User clicks "Sign in with Google"
2. Frontend redirect đến GET /auth/google
3. Backend redirect đến Google login page
4. User đăng nhập với Google account
5. Google redirect về GET /auth/google/callback
6. Backend tạo hoặc tìm user trong database
7. Backend generate JWT tokens
8. Backend trả về tokens cho frontend
9. Frontend store tokens và redirect đến dashboard
```

## 🧪 Testing

### Test Local Authentication

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Google Authentication

1. Open browser: `http://localhost:3000/auth/google`
2. Login with Google account
3. Check response for tokens

## 🚀 Production Deployment

### Environment Variables

Update `.env` cho production:

```env
GOOGLE_CALLBACK_URL="https://api.yourdomain.com/auth/google/callback"
```

### Google Cloud Console

1. Thêm production redirect URI:

   ```
   https://api.yourdomain.com/auth/google/callback
   ```

2. Add authorized domains:
   ```
   yourdomain.com
   api.yourdomain.com
   ```

### CORS Configuration

Configure CORS để allow frontend domain:

```typescript
// main.ts
app.enableCors({
  origin: ['https://yourdomain.com'],
  credentials: true,
});
```

## 📖 Additional Resources

- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)
- [NestJS Passport Documentation](https://docs.nestjs.com/security/authentication)
- [Prisma Documentation](https://www.prisma.io/docs/)

## 🐛 Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch"**
   - Check Google Console redirect URI matches exactly
   - Include protocol (http/https)
   - Check for trailing slashes

2. **"Invalid client"**
   - Verify GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET
   - Check .env file được load correctly

3. **"This account uses Google login"**
   - User đã đăng ký bằng Google, không thể login bằng password
   - Yêu cầu user sử dụng Google login

4. **Prisma Client errors**
   - Run: `npx prisma generate`
   - Run: `npx prisma migrate deploy`

## 📄 License

UNLICENSED
