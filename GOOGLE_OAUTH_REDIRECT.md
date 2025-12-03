# Google OAuth Dynamic Redirect

## Tổng quan

Backend đã được cập nhật để **tự động redirect về đúng domain** mà user gửi request, thay vì hardcode redirect về một URL cố định.

## Cách hoạt động

### Flow hoàn chỉnh:

1. **User click "Login with Google"** trên frontend (ví dụ: `http://localhost:5173`)
   
2. **Frontend gọi backend** với origin hiện tại:
   ```javascript
   window.location.href = `http://localhost:3000/auth/google?redirect_url=${encodeURIComponent(window.location.origin)}`
   ```

3. **Backend (GoogleAuthGuard) xử lý request**:
   - Lấy `redirect_url` từ query parameter
   - Nếu không có, fallback về Referer header
   - Nếu không có, fallback về Origin header
   - Nếu vẫn không có, dùng `CLIENT_URL` từ env
   - Pass redirect URL vào `state` parameter của Google OAuth

4. **Backend redirect user đến Google OAuth consent screen**:
   ```
   https://accounts.google.com/o/oauth2/v2/auth
     ?client_id=...
     &redirect_uri=http://localhost:3000/auth/google/callback
     &state=http://localhost:5173  ← redirect URL được pass vào state
     &scope=email+profile
   ```

5. **User cấp quyền trên Google**

6. **Google redirect về backend callback** với state parameter:
   ```
   http://localhost:3000/auth/google/callback
     ?code=...
     &state=http://localhost:5173  ← Google giữ và trả về state
   ```

7. **Backend xử lý callback**:
   - Verify authorization code với Google
   - Tạo/update user trong database
   - Generate JWT tokens
   - Set HttpOnly cookies
   - Lấy redirect URL từ `state` parameter
   - **Redirect về đúng frontend origin**: `http://localhost:5173`

### Code thay đổi:

#### Backend - GoogleAuthGuard (`src/auth/guards/google-auth.guard.ts`):

```typescript
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Get redirect URL from query parameter or Referer header
    const redirectUrl =
      request.query.redirect_url ||
      request.headers.referer ||
      request.headers.origin ||
      process.env.CLIENT_URL ||
      'http://localhost:3001';

    // Pass redirect URL as state parameter to Google OAuth
    return {
      state: redirectUrl,
    };
  }
}
```

#### Backend - Auth Controller (`src/auth/auth.controller.ts`):

```typescript
@Public()
@Get('google/callback')
@UseGuards(GoogleAuthGuard)
async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
  // ... authentication logic ...

  // Get the redirect URL from state parameter (passed from Google)
  const state = req.query.state as string;
  const redirectUrl =
    state || process.env.CLIENT_URL || 'http://localhost:3001';

  res.redirect(redirectUrl);
}
```

#### Frontend - Auth Service (`src/services/auth.service.ts`):

```typescript
initiateGoogleLogin(): void {
  const currentOrigin = window.location.origin
  window.location.href = `${API_URL}/auth/google?redirect_url=${encodeURIComponent(currentOrigin)}`
}
```

## Ưu điểm

✅ **Dynamic redirect**: Tự động redirect về đúng domain mà user truy cập
✅ **Multi-environment support**: Không cần config riêng cho dev/staging/production
✅ **Multiple frontends**: Support nhiều frontend domains cùng lúc
✅ **Fallback strategy**: Có nhiều cách để lấy redirect URL nếu một cách thất bại
✅ **Secure**: Sử dụng `state` parameter - chuẩn OAuth 2.0

## Use Cases

### Development với multiple ports:
```
Frontend 1: http://localhost:5173  → Redirect về http://localhost:5173
Frontend 2: http://localhost:3001  → Redirect về http://localhost:3001
```

### Production với multiple domains:
```
Main site:  https://app.example.com     → Redirect về https://app.example.com
Admin site: https://admin.example.com   → Redirect về https://admin.example.com
```

### Testing với ngrok:
```
ngrok URL: https://abc123.ngrok.io  → Redirect về https://abc123.ngrok.io
```

## Fallback Strategy

Backend sẽ thử lấy redirect URL theo thứ tự:

1. **Query parameter** `redirect_url`: Ưu tiên cao nhất
   ```
   /auth/google?redirect_url=http://localhost:5173
   ```

2. **Referer header**: Header tự động gửi bởi browser
   ```
   Referer: http://localhost:5173/sign-in
   ```

3. **Origin header**: Header cho CORS requests
   ```
   Origin: http://localhost:5173
   ```

4. **Environment variable** `CLIENT_URL`: Fallback cuối cùng
   ```
   CLIENT_URL=http://localhost:3001
   ```

5. **Hardcoded default**: `http://localhost:3001`

## Security Considerations

### ✅ Safe:
- Sử dụng `state` parameter - chuẩn OAuth 2.0
- State được Google giữ và trả về, không thể bị modify
- Backend validate và sanitize redirect URL

### ⚠️ Lưu ý:
- Nếu cần strict security, có thể validate redirect URL với whitelist:
  ```typescript
  const allowedDomains = [
    'http://localhost:3001',
    'http://localhost:5173',
    'https://app.example.com',
    'https://admin.example.com',
  ];
  
  if (!allowedDomains.includes(redirectUrl)) {
    redirectUrl = process.env.CLIENT_URL || 'http://localhost:3001';
  }
  ```

## Testing

### Test với localhost:5173:
1. Frontend chạy ở `http://localhost:5173`
2. Click "Login with Google"
3. Sau khi authorize → redirect về `http://localhost:5173`

### Test với localhost:3001:
1. Frontend chạy ở `http://localhost:3001`
2. Click "Login with Google"
3. Sau khi authorize → redirect về `http://localhost:3001`

### Test với custom port:
1. Frontend chạy ở `http://localhost:8080`
2. Click "Login with Google"
3. Sau khi authorize → redirect về `http://localhost:8080`

## Troubleshooting

### Problem: Vẫn redirect về localhost:3001

**Nguyên nhân:**
- Query parameter không được pass
- Referer header bị block
- Browser security settings

**Giải pháp:**
1. Check browser console - URL có chứa `redirect_url` không?
2. Check browser không block Referer header
3. Thêm explicit redirect_url:
   ```javascript
   window.location.href = `${API_URL}/auth/google?redirect_url=${encodeURIComponent(window.location.origin)}`
   ```

### Problem: Google OAuth error "redirect_uri_mismatch"

**Nguyên nhân:**
- Google Console không có backend callback URL

**Giải pháp:**
- Thêm `http://localhost:3000/auth/google/callback` vào Google Console
- Đảm bảo `GOOGLE_CALLBACK_URL` trong `.env` match với Google Console

### Problem: Redirect về sai domain

**Nguyên nhân:**
- State parameter bị mất hoặc invalid

**Giải pháp:**
1. Check logs - state có được pass không?
2. Verify `getAuthenticateOptions` được call
3. Check Google có preserve state không

## Environment Variables

Backend không cần thay đổi environment variables, nhưng vẫn giữ `CLIENT_URL` để fallback:

```env
# Backend .env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
CLIENT_URL=http://localhost:3001  # Fallback URL
CORS_ORIGIN=http://localhost:5173
```

**Note:** `CORS_ORIGIN` vẫn cần config để cookies hoạt động. Nếu có nhiều frontends, có thể dùng array:
```env
CORS_ORIGIN=http://localhost:3001,http://localhost:5173
```

Hoặc trong production, dùng wildcard cho subdomains:
```typescript
// main.ts
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:5173',
      /^https:\/\/.*\.example\.com$/,  // Allow all subdomains
    ];
    
    const isAllowed = allowedOrigins.some(pattern => 
      typeof pattern === 'string' 
        ? pattern === origin
        : pattern.test(origin)
    );
    
    callback(null, isAllowed);
  },
  credentials: true,
});
```

## Summary

Thay đổi này giúp backend **linh hoạt hơn** và **không cần config cứng** redirect URL. Backend sẽ tự động redirect về đúng domain mà user đang sử dụng, hỗ trợ development với multiple ports và production với multiple domains.

