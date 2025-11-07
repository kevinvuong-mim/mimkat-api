import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '@common/decorators/public.decorator';
import {
  CurrentUser,
  type UserPayload,
} from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { GoogleAuthGuard } from '@auth/guards/google-auth.guard';
import { DeviceUtil } from '@common/utils/device.util';
import { ClientTypeUtil, ClientType } from '@common/utils/client-type.util';
import { AUTH_CONSTANTS } from '@auth/constants/auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    // Generate a random CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Set CSRF token as a cookie (must be readable by JavaScript)
    res.cookie(AUTH_CONSTANTS.CSRF_TOKEN_COOKIE_NAME, csrfToken, {
      httpOnly: false, // Must be readable by JavaScript to send in headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return { csrfToken };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 requests per 15 minutes
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 900000 } }) // 10 requests per 15 minutes
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo = DeviceUtil.extractDeviceInfo(req);
    const clientType = ClientTypeUtil.detectClientType(req);

    return this.authService.login(loginDto, deviceInfo, res, clientType);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: UserPayload,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.authService.extractRefreshToken(
      req,
      refreshTokenDto,
    );

    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }

    const result = await this.authService.logout(user.id, refreshToken);

    // Clear cookies for web clients
    const clientType = ClientTypeUtil.detectClientType(req);
    if (clientType === ClientType.WEB) {
      this.authService.clearAuthCookies(res);
    }

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo = DeviceUtil.extractDeviceInfo(req);
    const clientType = ClientTypeUtil.detectClientType(req);
    const refreshToken = this.authService.extractRefreshToken(
      req,
      refreshTokenDto,
    );

    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }

    return this.authService.refreshTokens(
      refreshToken,
      deviceInfo,
      res,
      clientType,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getCurrentUser(@CurrentUser() user: UserPayload) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      isActive: user.isActive,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getActiveSessions(
    @CurrentUser() user: UserPayload,
    @Body() refreshTokenDto?: RefreshTokenDto,
  ) {
    return this.authService.getActiveSessions(
      user.id,
      refreshTokenDto?.refreshToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  async logoutAllDevices(@CurrentUser() user: UserPayload) {
    return this.authService.logoutAllDevices(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:tokenId')
  @HttpCode(HttpStatus.OK)
  async logoutDevice(
    @CurrentUser() user: UserPayload,
    @Param('tokenId') tokenId: string,
  ) {
    return this.authService.logoutDevice(user.id, tokenId);
  }

  // Email verification routes
  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per 1 hour
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  // Google OAuth routes
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // This route initiates the Google OAuth flow
    // User will be redirected to Google's login page
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    // After Google authentication, this callback is triggered
    const deviceInfo = DeviceUtil.extractDeviceInfo(req);
    const clientType = ClientTypeUtil.detectClientType(req);

    const result = await this.authService.googleLogin(
      req.user as any,
      deviceInfo,
      res,
      clientType,
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Encode user data as base64 to safely pass in URL
    const userData = Buffer.from(JSON.stringify(result.user)).toString(
      'base64',
    );

    // For web clients: cookies are set, only pass user data (NO TOKENS IN URL!)
    if (clientType === ClientType.WEB) {
      const callbackUrl = `${frontendUrl}/auth/callback?userData=${userData}&success=true`;
      res.redirect(callbackUrl);
    } else {
      // For mobile clients: pass tokens in URL (mobile handles deep links differently)
      // Mobile apps should handle this via deep linking and store in secure storage
      const callbackUrl = `${frontendUrl}/auth/callback?accessToken=${(result as any).accessToken}&refreshToken=${(result as any).refreshToken}&userData=${userData}`;
      res.redirect(callbackUrl);
    }
  }
}
