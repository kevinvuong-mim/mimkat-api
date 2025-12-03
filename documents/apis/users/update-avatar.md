# Update Avatar API

API cho phép người dùng upload và cập nhật ảnh đại diện (avatar).

## Endpoint

```
PUT /users/me/avatar
```

## Authentication

Yêu cầu JWT token trong:

- **Cookie**: `access_token` (HttpOnly cookie)
- **Header**: `Authorization: Bearer <access_token>`

## Rate Limiting

**5 uploads per hour** - Để tránh abuse và giảm chi phí storage/bandwidth.

## Request

### Content Type

```
Content-Type: multipart/form-data
```

### Form Data

| Field  | Type | Required | Description          |
| ------ | ---- | -------- | -------------------- |
| `file` | File | Yes      | Image file to upload |

### File Validation

#### File Size

- **Max size:** 10 MB
- Larger files sẽ bị reject với error 400

#### Allowed File Types

- JPG / JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- GIF (`.gif`) - animation được preserve

#### Image Requirements

**Minimum dimensions:** 50x50 pixels

**Aspect ratio:** 1:5 đến 5:1 (prevents banner-like images)

**Examples:**

- ✅ Valid: 500x500, 1000x800, 800x1000, 1000x200 (5:1)
- ❌ Invalid: 40x40 (too small), 1000x100 (aspect ratio 10:1)

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource updated successfully",
  "data": null,
  "timestamp": "2024-12-01T08:15:23.456Z",
  "path": "/users/me/avatar"
}
```

### Error Responses

#### 400 Bad Request - File Too Large

Khi file size > 10 MB:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed (expected size is less than 10485760)",
  "error": "Bad Request",
  "timestamp": "2024-12-01T08:00:00.000Z",
  "path": "/users/me/avatar"
}
```

#### 400 Bad Request - Invalid File Type

Khi file không phải image hợp lệ:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.",
  "error": "Bad Request",
  "timestamp": "2024-12-01T08:00:00.000Z",
  "path": "/users/me/avatar"
}
```

#### 400 Bad Request - Image Too Small

Khi ảnh < 50x50 pixels:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Image too small. Minimum dimensions: 50x50 pixels.",
  "error": "Bad Request",
  "timestamp": "2024-12-01T08:00:00.000Z",
  "path": "/users/me/avatar"
}
```

#### 400 Bad Request - Invalid Aspect Ratio

Khi aspect ratio không hợp lệ (banner-like images):

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid aspect ratio. Image dimensions must be between 1:5 and 5:1.",
  "error": "Bad Request",
  "timestamp": "2024-12-01T08:00:00.000Z",
  "path": "/users/me/avatar"
}
```

#### 400 Bad Request - Upload Failed

Khi upload lên S3 thất bại:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Failed to upload avatar",
  "error": "Bad Request",
  "timestamp": "2024-12-01T08:00:00.000Z",
  "path": "/users/me/avatar"
}
```

#### 401 Unauthorized

Khi không có JWT token hoặc token không hợp lệ:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2024-12-01T08:00:00.000Z",
  "path": "/users/me/avatar"
}
```

#### 404 Not Found

Khi user không tồn tại:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found",
  "timestamp": "2024-12-01T08:00:00.000Z",
  "path": "/users/me/avatar"
}
```

#### 409 Conflict

Khi avatar được update bởi request khác (race condition):

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Failed to update avatar. Please try again",
  "error": "Conflict",
  "timestamp": "2024-12-01T08:00:00.000Z",
  "path": "/users/me/avatar"
}
```

#### 429 Too Many Requests

Khi vượt quá rate limit (5 uploads/hour):

```json
{
  "success": false,
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests",
  "timestamp": "2024-12-01T08:00:00.000Z",
  "path": "/users/me/avatar"
}
```

## Examples

### Example 1: Upload Avatar (cURL)

```bash
curl -X PUT http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/avatar.jpg"
```

### Example 2: Upload Avatar (JavaScript Fetch)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/users/me/avatar', {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  body: formData,
});

const result = await response.json();
console.log('New avatar URL:', result.data.avatar);
```

### Example 3: Upload Avatar (Axios)

```javascript
const formData = new FormData();
formData.append('file', file);

const response = await axios.put(
  'http://localhost:3000/users/me/avatar',
  formData,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    },
  },
);

console.log('Updated user:', response.data.data);
```

### Example 4: React Component

```tsx
import { useState } from 'react';

function AvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be less than 10 MB');
      return;
    }

    // Validate file type
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
        file.type,
      )
    ) {
      setError('Only JPG, PNG, WebP, and GIF are allowed');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/me/avatar', {
        method: 'PUT',
        credentials: 'include', // Send cookies
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      console.log('Avatar updated:', result.data.avatar);

      // Update UI with new avatar
      setAvatarUrl(result.data.avatar);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

## Image Processing

### Automatic Processing

Tất cả ảnh upload sẽ được tự động xử lý:

#### 1. Format Conversion

- **JPG, PNG, WebP** → Converted to **WebP** (tối ưu dung lượng, ~70-90% smaller)
- **GIF** → Giữ nguyên **GIF** (preserve animation)

#### 2. Resize

- Max dimensions: **1024x1024 pixels**
- Maintains aspect ratio
- Ảnh nhỏ hơn 1024px giữ nguyên (không upscale)

**Examples:**

- 3000x2000 → 1024x683
- 2000x3000 → 683x1024
- 800x600 → 800x600 (unchanged)

#### 3. Compression

- WebP quality: **80** (good balance between quality and size)
- GIF: No additional compression (preserve animation)

#### 4. Result

**Typical savings:**

- PNG 5000x5000 (8.5 MB) → WebP 1024x1024 (850 KB) = **90% smaller**
- JPG 4000x3000 (3.2 MB) → WebP 1024x768 (420 KB) = **87% smaller**
- GIF animated (1.5 MB) → GIF resized (1.2 MB) = **20% smaller** (animation preserved)

## Storage

### S3 Storage

Avatars được lưu trên AWS S3 (hoặc S3-compatible storage):

**Storage key format:**

```
general/avatars/{userId}.{extension}
```

**Examples:**

- `general/avatars/123e4567-e89b-12d3-a456-426614174000.webp`
- `general/avatars/987fcdeb-51a2-43d1-b789-123456789abc.gif`

### Old Avatar Cleanup

Khi upload avatar mới:

1. Process và upload ảnh mới
2. Update database với avatar key mới
3. **Overwite old avatar** (fire-and-forget, không chặn response)

**Benefits:**

- Giảm storage cost
- Không có orphaned files
- Non-blocking (không làm chậm response)

## Race Condition Handling

API sử dụng **optimistic locking** để prevent race conditions:

### Scenario

User mở 2 tabs và upload avatar đồng thời:

```
Tab 1: Upload avatar1.jpg
Tab 2: Upload avatar2.jpg (at the same time)
```

### Protection Mechanism

```typescript
// Update with optimistic locking
await prisma.user.updateMany({
  where: {
    id: userId,
    avatar: oldAvatar, // Only update if avatar unchanged
  },
  data: {
    avatar: newAvatar,
    avatarUpdatedAt: new Date(),
  },
});

// Check if update successful
if (updatedCount === 0) {
  // Avatar changed by another request
  // Rollback: delete uploaded file
  await storage.delete(newAvatar);
  throw new ConflictException('Failed to update avatar. Please try again');
}
```

### Behavior

- **First request**: Succeeds, avatar updated
- **Second request**: Fails với 409 Conflict
- **Cleanup**: Second request's uploaded file được tự động xóa

### Client Handling

```javascript
try {
  await uploadAvatar(file);
} catch (error) {
  if (error.status === 409) {
    // Conflict - retry upload
    await uploadAvatar(file);
  }
}
```

## Database Changes

### Schema

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  avatar          String?
  avatarUpdatedAt DateTime?  // New field for cache busting
  // ... other fields
}
```

### Migration

```sql
-- Add avatarUpdatedAt column
ALTER TABLE "users" ADD COLUMN "avatarUpdatedAt" TIMESTAMP(3);
```

## Security

### File Validation

- **Size limit:** 10 MB (prevents memory issues)
- **Type validation:** Only image types
- **Content validation:** Sharp validates actual image content
- **Dimension validation:** Min 50x50, aspect ratio 1:5 to 5:1

### Storage Security

- **Path traversal protection:** Key cannot contain `..`
- **Key sanitization:** Auto URI-encode keys
- **Private storage:** Files accessible via authenticated URL only (optional)

### Rate Limiting

- **5 uploads per hour** prevents:
  - Spam abuse
  - Storage cost abuse
  - Bandwidth abuse

## Performance

### Optimization Techniques

1. **WebP Compression:** 70-90% smaller than JPG/PNG
2. **Resize before upload:** Max 1024x1024 (reduces upload time)
3. **Async old file deletion:** Non-blocking cleanup
4. **Cache busting:** `?v=timestamp` ensures latest avatar loads
5. **Sharp optimization:** Fast image processing (~100-500ms)

### Response Time

Typical upload flow:

- File validation: ~5ms
- Image processing: ~100-500ms (depends on size)
- S3 upload: ~200-1000ms (depends on network)
- Database update: ~10-50ms
- **Total:** ~315-1555ms

## Best Practices

### Client-Side

#### 1. Validate before upload

```javascript
function validateImage(file) {
  // Check file size
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File must be less than 10 MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, WebP, and GIF are allowed');
  }
}
```

#### 2. Show upload progress

```javascript
const response = await axios.post(url, formData, {
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total,
    );
    setProgress(percentCompleted);
  },
});
```

#### 3. Handle errors gracefully

```javascript
try {
  await uploadAvatar(file);
  showSuccess('Avatar updated successfully');
} catch (error) {
  if (error.status === 413) {
    showError('File too large. Please use a smaller image');
  } else if (error.status === 400) {
    showError(error.message);
  } else if (error.status === 429) {
    showError('Too many uploads. Please wait before trying again');
  } else {
    showError('Failed to upload avatar. Please try again');
  }
}
```

#### 4. Update UI immediately

```javascript
// Optimistic update
const previewUrl = URL.createObjectURL(file);
setAvatarUrl(previewUrl);

try {
  const result = await uploadAvatar(file);
  setAvatarUrl(result.data.avatar); // Use server URL
} catch (error) {
  setAvatarUrl(oldAvatarUrl); // Revert on error
  showError(error.message);
}
```

### Server-Side

#### 1. Use multer file size limit

```typescript
// In controller
@Put('avatar')
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}))
```

#### 2. Log processing stats

```typescript
this.logger.log(
  `Avatar uploaded: ${file.size} → ${processed.size} bytes ` +
    `(${savings}% saved) for user ${userId}`,
);
```

#### 3. Handle cleanup errors

```typescript
// Fire-and-forget cleanup
this.deleteOldAvatar(oldKey).catch((err) =>
  this.logger.warn('Failed to delete old avatar', { oldKey, error: err }),
);
```

## Troubleshooting

### 1. Avatar không hiển thị (404)

**Possible causes:**

- Avatar key sai trong database
- S3 bucket/permissions issue
- CORS issue

**Solutions:**

- Check database: `SELECT avatar FROM users WHERE id = 'xxx'`
- Test S3 URL directly in browser
- Verify S3 CORS settings allow GET from client domain

### 2. Upload failed with 400

**Check:**

- File size < 10 MB?
- File type valid (JPG, PNG, WebP, GIF)?
- Image dimensions >= 50x50?
- Aspect ratio between 1:5 and 5:1?

### 3. Upload succeeded but old avatar still shows

**Cause:** Browser caching

**Solution:**

- API tự động thêm `?v=timestamp` để bypass cache
- Client cần reload avatar URL sau upload
- Check `avatarUpdatedAt` field được update chưa

### 4. 429 Too Many Requests

**Cause:** Exceeded 5 uploads/hour rate limit

**Solutions:**

- Wait for rate limit to reset (1 hour)
- Show friendly error message to user
- Consider increasing limit in production if needed

## Related Documentation

- [Get User Profile](./user-profile.md) - Xem avatar đã upload
- [Update Profile](./update-profile.md) - Update thông tin profile khác
- [Image Processing Module](../../modules/image-processing.md) - Chi tiết xử lý ảnh
- [Storage Module](../../modules/storage.md) - Chi tiết S3 storage
- [Environment Variables](../../setup/environment-variables.md) - Cấu hình AWS S3
