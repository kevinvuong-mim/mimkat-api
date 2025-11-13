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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(verificationToken, 10);

    // Token expires in 48 hours
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 48);

    // Create new user with verification fields
    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
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

    // Check if user has a password
    if (!user.password) {
      throw new UnauthorizedException(
        'This account does not have a password set. Please use Google login or reset your password.',
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

    // Check session limit
    await this.enforceSessionLimit(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Save refresh token to database with device info
    await this.saveSession(user.id, tokens.refreshToken, deviceInfo);

    // Return tokens in response body for localStorage storage
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
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
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
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

  private async enforceSessionLimit(userId: string): Promise<void> {
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

  async googleLogin(googleUser: GoogleAuthDto, deviceInfo?: DeviceInfo) {
    if (!googleUser) {
      throw new BadRequestException('No user from Google');
    }

    // Check if user exists with Google ID or email
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
      },
    });

    // If user exists by email but doesn't have Google linked yet
    if (user && !user.googleId) {
      // Link Google account to existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          avatar: user.avatar || googleUser.avatar,
          fullName:
            user.fullName || `${googleUser.firstName} ${googleUser.lastName}`,
          isEmailVerified: true, // Google login implies email is verified
        },
      });
    }

    // If user doesn't exist at all, create new user with Google
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.googleId,
          fullName: `${googleUser.firstName} ${googleUser.lastName}`,
          avatar: googleUser.avatar,
          password: null,
          isEmailVerified: true, // Google accounts are pre-verified
        },
      });
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been disabled');
    }

    // Check session limit
    await this.enforceSessionLimit(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Save refresh token to database with device info
    await this.saveSession(user.id, tokens.refreshToken, deviceInfo);

    // Return tokens in response body for localStorage storage
    return tokens;
  }
}
