# Google OAuth Setup Guide

## 1. Tạo Google OAuth Credentials

### Bước 1: Truy cập Google Cloud Console

1. Đi tới [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**

### Bước 2: Tạo OAuth 2.0 Client ID

1. Click **Create Credentials** > **OAuth client ID**
2. Chọn **Application type**: **Web application**
3. Đặt tên: `Mimkat API`
4. Thêm **Authorized redirect URIs**:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
5. Click **Create**

### Bước 3: Lấy Credentials

1. Copy **Client ID** và **Client Secret**
2. Thêm vào file `.env`:

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
```

## 2. Backend API Endpoints

### Google OAuth Flow

1. **Initiate Login**: `GET /auth/google`
   - Redirect user đến Google login page

2. **Callback**: `GET /auth/google/callback`
   - Google redirect về sau khi user đăng nhập
   - Trả về JWT tokens

### Response Format

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

## 3. Frontend Integration

### Option 1: Simple Redirect (Recommended for Web)

```javascript
// Redirect to backend Google OAuth endpoint
window.location.href = 'http://localhost:3000/auth/google';

// Handle callback in your app
// Backend will redirect to: /auth/google/callback?token=xxx
```

### Option 2: React Example with Google Sign-In Button

```bash
npm install @react-oauth/google
```

```jsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="your-google-client-id">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          // Send to your backend
          const response = await fetch(
            'http://localhost:3000/auth/google/token',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: credentialResponse.credential,
              }),
            },
          );

          const data = await response.json();
          // Store JWT tokens
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
        }}
        onError={() => {
          console.log('Login Failed');
        }}
      />
    </GoogleOAuthProvider>
  );
}
```

### Option 3: Next.js Example

```tsx
'use client';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    // Redirect to backend
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return <button onClick={handleGoogleLogin}>Sign in with Google</button>;
}

// Create callback page: app/auth/callback/page.tsx
('use client');
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      window.location.href = '/dashboard';
    }
  }, [searchParams]);

  return <div>Processing authentication...</div>;
}
```

### Option 4: Vue.js Example

```vue
<template>
  <button @click="handleGoogleLogin">Sign in with Google</button>
</template>

<script setup>
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3000/auth/google';
};
</script>
```

## 4. Testing

### Test Google Login Flow

1. Start backend: `npm run start:dev`
2. Open browser: `http://localhost:3000/auth/google`
3. Login with Google account
4. Should redirect to callback with tokens

### Test with cURL

```bash
# Can't test directly with cURL due to OAuth flow
# Use browser or frontend app
```

## 5. Security Best Practices

1. **HTTPS in Production**: Always use HTTPS for OAuth callbacks
2. **Environment Variables**: Never commit `.env` file
3. **Token Storage**:
   - Store tokens in httpOnly cookies (recommended)
   - Or use secure storage like localStorage with proper XSS protection
4. **CORS Configuration**: Configure proper CORS for your frontend domain
5. **State Parameter**: Add state parameter to prevent CSRF attacks

## 6. Common Issues

### Issue: "redirect_uri_mismatch"

- **Solution**: Make sure the redirect URI in Google Console exactly matches your callback URL

### Issue: "Invalid client"

- **Solution**: Check if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

### Issue: "Access blocked: This app's request is invalid"

- **Solution**: Add authorized domains in Google Cloud Console

## 7. Frontend Integration Flow

```
1. User clicks "Login with Google" button
2. Frontend redirects to: GET /auth/google
3. Backend redirects to Google login page
4. User logs in with Google
5. Google redirects to: GET /auth/google/callback
6. Backend processes authentication
7. Backend returns tokens or redirects to frontend with tokens
8. Frontend stores tokens and redirects to dashboard
```

## 8. Production Deployment

### Update .env for production

```env
GOOGLE_CALLBACK_URL="https://api.yourdomain.com/auth/google/callback"
```

### Add production redirect URI to Google Console

```
https://api.yourdomain.com/auth/google/callback
```

### CORS Configuration

Make sure your backend allows requests from your frontend domain.
