import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '@prisma/prisma.service';
import { RegisterDto } from '@auth/dto/register.dto';
import { LoginDto } from '@auth/dto/login.dto';
import { DeviceInfo } from '@common/utils/device.util';
import { ActiveSessionsResponseDto } from '@auth/dto/session.dto';
import { AUTH_CONSTANTS } from '@auth/constants/auth.constants';
import { GoogleAuthDto } from '@auth/dto/google-auth.dto';
import { MailService } from '@mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password with bcrypt (salt rounds = 12 for high security)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    const hashedToken = await bcrypt.hash(verificationToken, 10);

    // Token expires in 48 hours
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 48);

    // Create new user with verification fields
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        provider: 'local',
        isEmailVerified: false,
        verificationToken: hashedToken,
        verificationTokenExpiry,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    // Send verification email
    try {
      await this.mailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      // Log error but don't fail registration
      this.logger.error(
        'Failed to send verification email',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      user,
    };
  }

  async login(loginDto: LoginDto, deviceInfo?: DeviceInfo) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user supports password login (local accounts only)
    if (!user.password || user.provider !== 'local') {
      throw new UnauthorizedException(
        'This account does not support password login. Please use your account provider.',
      );
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in. Check your inbox for the verification link.',
      );
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been disabled');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check device limit
    await this.enforceDeviceLimit(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Save refresh token to database with device info
    await this.saveSession(user.id, tokens.refreshToken, deviceInfo);

    // Return tokens in response body for localStorage storage
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  async logout(userId: string, refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }

    // Find the refresh token first to verify it exists
    const tokenRecord = await this.prisma.session.findFirst({
      where: {
        userId,
        refreshToken,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Delete refresh token from database
    await this.prisma.session.delete({
      where: {
        id: tokenRecord.id,
      },
    });

    return {
      message: 'Logout successful',
    };
  }

  async refreshTokens(refreshToken: string, deviceInfo?: DeviceInfo) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }

    // Check refresh token in database
    const tokenRecord = await this.prisma.session.findUnique({
      where: { refreshToken: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token has expired
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.session.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Verify refresh token with JWT
    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      await this.prisma.session.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.user.id);

    // Delete old refresh token and save new token (token rotation)
    await this.prisma.session.delete({
      where: { id: tokenRecord.id },
    });

    // Preserve device info from old token if not provided
    const deviceInfoToSave = deviceInfo || {
      deviceName: tokenRecord.deviceName ?? 'Unknown',
      deviceType: tokenRecord.deviceType ?? 'Unknown',
      ipAddress: tokenRecord.ipAddress ?? 'Unknown',
      userAgent: tokenRecord.userAgent ?? 'Unknown',
    };

    await this.saveSession(
      tokenRecord.user.id,
      tokens.refreshToken,
      deviceInfoToSave,
    );

    // Return tokens in response body for localStorage storage
    return {
      message: 'Token refresh successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRATION,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRATION,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveSession(
    userId: string,
    refreshToken: string,
    deviceInfo?: DeviceInfo,
  ) {
    const expiresIn = AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRATION;
    const expiresAt = new Date();

    // Parse expiration time (e.g., 7d, 24h, 60m)
    const match = expiresIn.match(/^(\d+)([dhm])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];

      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
      }
    }

    await this.prisma.session.create({
      data: {
        refreshToken,
        userId,
        expiresAt,
        deviceName: deviceInfo?.deviceName,
        deviceType: deviceInfo?.deviceType,
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
        lastUsedAt: new Date(),
      },
    });
  }

  // Session management methods
  async getActiveSessions(
    userId: string,
    currentToken?: string,
  ): Promise<ActiveSessionsResponseDto> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gte: new Date(), // Only active (non-expired) sessions
        },
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });

    const sessionDtos = sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName || 'Unknown',
      deviceType: session.deviceType || 'Unknown',
      ipAddress: session.ipAddress || 'Unknown',
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      isCurrent: currentToken ? session.refreshToken === currentToken : false,
    }));

    return {
      sessions: sessionDtos,
      total: sessionDtos.length,
    };
  }

  async logoutAllDevices(userId: string): Promise<{ message: string }> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return {
      message: 'Logged out from all devices successfully',
    };
  }

  async logoutDevice(
    userId: string,
    tokenId: string,
  ): Promise<{ message: string }> {
    const token = await this.prisma.session.findFirst({
      where: {
        id: tokenId,
        userId,
      },
    });

    if (!token) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: tokenId },
    });

    return {
      message: 'Device logged out successfully',
    };
  }

  private async enforceDeviceLimit(userId: string): Promise<void> {
    const activeTokens = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        lastUsedAt: 'asc', // Oldest first
      },
    });

    // If at or over limit, delete the oldest session(s)
    if (activeTokens.length >= AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS) {
      const tokensToDelete = activeTokens.slice(
        0,
        activeTokens.length - AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS + 1,
      );

      await this.prisma.session.deleteMany({
        where: {
          id: {
            in: tokensToDelete.map((t) => t.id),
          },
        },
      });
    }
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async verifyEmail(token: string) {
    // Find user with matching token that hasn't expired
    const users = await this.prisma.user.findMany({
      where: {
        verificationTokenExpiry: {
          gte: new Date(),
        },
        isEmailVerified: false,
      },
    });

    // Check token against all unverified users
    let matchedUserId: string | null = null;
    for (const user of users) {
      if (user.verificationToken) {
        const isValid = await bcrypt.compare(token, user.verificationToken);
        if (isValid) {
          matchedUserId = user.id;
          break;
        }
      }
    }

    if (!matchedUserId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user as verified
    await this.prisma.user.update({
      where: { id: matchedUserId },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken();
    const hashedToken = await bcrypt.hash(verificationToken, 10);

    // Token expires in 48 hours
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 48);

    // Update user with new token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedToken,
        verificationTokenExpiry,
      },
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(email, verificationToken);

    return {
      message: 'Verification email sent successfully',
    };
  }

  // Password Reset Methods
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return {
        message:
          'If an account with that email exists, we sent a password reset link.',
      };
    }

    // Only allow password reset for local accounts
    if (user.provider !== 'local') {
      return {
        message:
          'If an account with that email exists, we sent a password reset link.',
      };
    }

    // Generate password reset token
    const resetToken = this.generateVerificationToken();
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Token expires in 1 hour (shorter than email verification for security)
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

    // Update user with reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetTokenExpiry: resetTokenExpiry,
      },
    });

    // Send password reset email
    try {
      await this.mailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      // Log error but don't fail the request
      this.logger.error(
        'Failed to send password reset email',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return {
      message:
        'If an account with that email exists, we sent a password reset link.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find users with non-expired reset tokens
    const users = await this.prisma.user.findMany({
      where: {
        passwordResetTokenExpiry: {
          gte: new Date(),
        },
        passwordResetToken: {
          not: null,
        },
      },
    });

    // Check token against all users with active reset tokens
    let matchedUserId: string | null = null;
    for (const user of users) {
      if (user.passwordResetToken) {
        const isValid = await bcrypt.compare(token, user.passwordResetToken);
        if (isValid) {
          matchedUserId = user.id;
          break;
        }
      }
    }

    if (!matchedUserId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    await this.prisma.user.update({
      where: { id: matchedUserId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    });

    // Invalidate all existing sessions for security
    await this.prisma.session.deleteMany({
      where: { userId: matchedUserId },
    });

    return {
      message:
        'Password reset successful. Please log in with your new password.',
    };
  }

  async googleLogin(googleUser: GoogleAuthDto, deviceInfo?: DeviceInfo) {
    if (!googleUser) {
      throw new BadRequestException('No user from Google');
    }

    // Check if user exists with Google ID
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    // If not found by googleId, check by email
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });
    }

    // If user exists but not verified (from local registration spam attack)
    // Delete the unverified account and create new one with Google
    if (user && !user.isEmailVerified && !user.googleId) {
      await this.prisma.user.delete({
        where: { id: user.id },
      });
      user = null;
    }

    // If user exists with verified email but no Google ID, link Google account
    if (user && !user.googleId && user.isEmailVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          provider: 'google',
          password: null, // Clear password when converting to Google account
          avatar: googleUser.avatar,
          fullName:
            user.fullName || `${googleUser.firstName} ${googleUser.lastName}`,
        },
      });
    }

    // If user doesn't exist, create new user with verified email
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.googleId,
          fullName: `${googleUser.firstName} ${googleUser.lastName}`,
          avatar: googleUser.avatar,
          provider: 'google',
          password: null,
          isEmailVerified: true, // Google accounts are pre-verified
        },
      });
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been disabled');
    }

    // Check device limit
    await this.enforceDeviceLimit(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Save refresh token to database with device info
    await this.saveSession(user.id, tokens.refreshToken, deviceInfo);

    // Return tokens in response body for localStorage storage
    return {
      message: 'Google login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }
}
