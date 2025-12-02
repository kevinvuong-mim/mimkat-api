import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@prisma/prisma.service';
import { createPaginatedResponse } from '@common/utils/pagination.util';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ImageProcessingService } from '@image-processing/image-processing.service';
import { StorageService } from '@storage/storage.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly awsEndpoint: string;
  private readonly awsBucketName: string;

  constructor(
    private prisma: PrismaService,
    private imageProcessing: ImageProcessingService,
    private storage: StorageService,
    private configService: ConfigService,
  ) {
    this.awsEndpoint = this.configService.get<string>('AWS_ENDPOINT') || '';
    this.awsBucketName =
      this.configService.get<string>('AWS_BUCKET_NAME') || '';
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        avatar: true,
        avatarUpdatedAt: true,
        phoneNumber: true,
        isActive: true,
        isEmailVerified: true,
        password: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserProfile(user);
  }

  private buildAvatarUrl(avatarKey: string | null): string | null {
    if (!avatarKey) {
      return null;
    }

    // If avatar is already a full URL (legacy data from Google OAuth), use it as is
    if (avatarKey.startsWith('http://') || avatarKey.startsWith('https://')) {
      return avatarKey;
    }

    return `${this.awsEndpoint}/${this.awsBucketName}/${avatarKey}`;
  }

  private formatUserProfile(user: any) {
    let avatarUrl = this.buildAvatarUrl(user.avatar);

    // Add cache busting query param if avatar exists
    if (avatarUrl) {
      const timestamp = user.avatarUpdatedAt
        ? new Date(user.avatarUpdatedAt).getTime()
        : Date.now();
      avatarUrl = `${avatarUrl}?v=${timestamp}`;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      avatar: avatarUrl,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      hasPassword: !!user.password,
      hasGoogleAuth: !!user.googleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    // 1. Find user and get old avatar
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatar: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Process image
    const processedImage = await this.imageProcessing.processImage(file);

    // 3. Generate storage key with correct extension based on mimetype
    const extension = processedImage.mimetype === 'image/gif' ? 'gif' : 'webp';
    const storageKey = `general/avatars/${userId}.${extension}`;

    // 4. Check if new avatar key is same as old (to avoid deleting the file we just uploaded)
    const isSameKey = user.avatar === storageKey;

    // 5. Upload to storage (returns encoded key, not full URL)
    let avatarKey: string;
    try {
      avatarKey = await this.storage.upload(
        processedImage.buffer,
        storageKey,
        processedImage.mimetype,
      );
    } catch (uploadError) {
      this.logger.error('Failed to upload avatar to S3', uploadError);
      throw new BadRequestException('Failed to upload avatar');
    }

    // 6. Update database with new avatar key and timestamp (with optimistic locking)
    let updatedUser: any;
    try {
      updatedUser = await this.prisma.user.updateMany({
        where: {
          id: userId,
          avatar: user.avatar, // Optimistic locking - only update if avatar unchanged
        },
        data: {
          avatar: avatarKey,
          avatarUpdatedAt: new Date(),
        },
      });

      // Check if update was successful
      if (updatedUser.count === 0) {
        // Avatar was changed by another request, rollback our upload
        // Only rollback if new key is different from old (to avoid deleting the file we just uploaded)
        if (!isSameKey) {
          await this.storage
            .delete(storageKey)
            .catch((err) =>
              this.logger.error(
                'Failed to rollback upload after conflict',
                err,
              ),
            );
        }
        throw new ConflictException(
          'Avatar was updated by another request. Please try again.',
        );
      }

      // Fetch updated user data
      updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          avatar: true,
          avatarUpdatedAt: true,
          phoneNumber: true,
          isActive: true,
          isEmailVerified: true,
          password: true,
          googleId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (dbError) {
      // Rollback: Delete uploaded file if DB update fails
      // Only rollback if new key is different from old (to avoid deleting the file we just uploaded)
      if (!(dbError instanceof ConflictException) && !isSameKey) {
        await this.storage
          .delete(storageKey)
          .catch((err) =>
            this.logger.error('Failed to rollback upload after DB error', err),
          );
      }
      throw dbError;
    }

    // 7. Delete old avatar from storage (fire and forget)
    // Only delete if old avatar exists and is different from new avatar
    if (user.avatar && !isSameKey) {
      this.deleteOldAvatar(user.avatar).catch((err) =>
        this.logger.warn('Failed to delete old avatar', err),
      );
    }
  }

  private async deleteOldAvatar(avatarKey: string): Promise<void> {
    try {
      // If avatarKey is a full URL (legacy data from Google OAuth or old system), skip deletion
      // We don't delete external URLs (Google profile pictures) or legacy data
      if (avatarKey.startsWith('http://') || avatarKey.startsWith('https://')) {
        // Check if it's our own S3 URL that needs bucket name removed
        if (
          avatarKey.includes(this.awsEndpoint) &&
          avatarKey.includes(this.awsBucketName)
        ) {
          try {
            const url = new URL(avatarKey);
            // Remove leading slash, bucket name, and query params
            // Format: /bucketName/general/avatars/userId.webp -> general/avatars/userId.webp
            const pathWithoutLeadingSlash = url.pathname.slice(1); // Remove leading /
            const pathParts = pathWithoutLeadingSlash.split('/');

            // Remove bucket name (first part) if it exists
            if (pathParts[0] === this.awsBucketName) {
              pathParts.shift();
            }

            const key = pathParts.join('/').split('?')[0]; // Remove query params

            if (!key || key === '') {
              this.logger.warn('Invalid storage key after parsing URL', {
                avatarKey,
              });
              return;
            }

            await this.storage.delete(key);
          } catch {
            this.logger.warn('Invalid URL format for old avatar', {
              avatarKey,
            });
            return;
          }
        } else {
          // External URL (like Google profile picture), skip deletion
          this.logger.log('Skipping deletion of external avatar URL', {
            avatarKey,
          });
        }
        return;
      }

      // If it's already a key (not a URL), use it directly
      const key = avatarKey;

      if (!key || key === '') {
        this.logger.warn('Invalid storage key for old avatar', {
          avatarKey,
        });
        return;
      }

      await this.storage.delete(key);
    } catch (error) {
      this.logger.warn('Failed to delete old avatar', {
        avatarKey,
        error: error.message,
      });
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if username is being updated and if it's already taken
    if (
      updateProfileDto.username &&
      updateProfileDto.username !== user.username
    ) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: updateProfileDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username is already taken');
      }
    }

    // Update user profile
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateProfileDto.username !== undefined && {
          username: updateProfileDto.username,
        }),
        ...(updateProfileDto.fullName !== undefined && {
          fullName: updateProfileDto.fullName,
        }),
        ...(updateProfileDto.phoneNumber !== undefined && {
          phoneNumber: updateProfileDto.phoneNumber,
        }),
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string | undefined,
    newPassword: string,
  ) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user has a password (traditional account or Google account with password set)
    if (user.password) {
      // Current password is required when user already has a password
      if (!currentPassword) {
        throw new BadRequestException(
          'Current password is required to change password',
        );
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }
    // If user doesn't have a password (Google-only account), allow setting password without current password

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    // Invalidate all existing sessions for security
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async getActiveSessions(
    userId: string,
    currentSessionId?: string,
    page: number = 1,
    limit: number = 10,
    skip: number = 0,
  ) {
    const where = {
      userId,
      expiresAt: {
        gte: new Date(), // Only active (non-expired) sessions
      },
    };

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        orderBy: {
          lastUsedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.session.count({ where }),
    ]);

    const sessionDtos = sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName || 'Unknown',
      deviceType: session.deviceType || 'Unknown',
      ipAddress: session.ipAddress || 'Unknown',
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      isCurrent: currentSessionId ? session.id === currentSessionId : false,
    }));

    return createPaginatedResponse(sessionDtos, total, page, limit);
  }

  async logoutAllDevices(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async logoutDevice(userId: string, sessionId: string) {
    const token = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!token) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async getUserByIdOrUsername(identifier: string) {
    // Try to find user by ID first, then by username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { username: identifier }],
        isActive: true, // Only return active users
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        avatarUpdatedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build public URL from key if avatar exists
    let avatarUrl = this.buildAvatarUrl(user.avatar);

    // Add cache busting query param if avatar exists
    if (avatarUrl) {
      const timestamp = user.avatarUpdatedAt
        ? new Date(user.avatarUpdatedAt).getTime()
        : Date.now();
      avatarUrl = `${avatarUrl}?v=${timestamp}`;
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: avatarUrl,
      createdAt: user.createdAt,
    };
  }
}
