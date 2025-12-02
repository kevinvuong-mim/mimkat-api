import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
import { AUTH_CONSTANTS } from './constants/auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const result = await this.authService.login(loginDto, deviceInfo);

    // Set access token in httpOnly cookie
    res.cookie(AUTH_CONSTANTS.ACCESS_TOKEN_KEY, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRATION, // 1 hour
    });

    // Set refresh token in httpOnly cookie
    res.cookie(AUTH_CONSTANTS.REFRESH_TOKEN_KEY, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRATION, // 7 days
    });

    return result;
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
    // Get refresh token from cookie if not provided in body
    const refreshToken =
      refreshTokenDto.refreshToken || req.cookies?.refreshToken;

    await this.authService.logout(user.id, refreshToken);

    // Clear cookies
    res.clearCookie(AUTH_CONSTANTS.ACCESS_TOKEN_KEY);
    res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const deviceInfo = DeviceUtil.extractDeviceInfo(req);

      // Get refresh token from cookie if not provided in body
      const refreshToken =
        refreshTokenDto.refreshToken || req.cookies?.refreshToken;

      const result = await this.authService.refreshTokens(
        refreshToken,
        deviceInfo,
      );

      // Set new access token in httpOnly cookie
      res.cookie(AUTH_CONSTANTS.ACCESS_TOKEN_KEY, result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRATION, // 1 hour
      });

      // Set new refresh token in httpOnly cookie
      res.cookie(AUTH_CONSTANTS.REFRESH_TOKEN_KEY, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRATION, // 7 days
      });

      return result;
    } catch (error) {
      // Clear invalid cookies
      res.clearCookie(AUTH_CONSTANTS.ACCESS_TOKEN_KEY);
      res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);

      throw error; // Re-throw để NestJS handle
    }
  }

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

    const result = await this.authService.googleLogin(
      req.user as any,
      deviceInfo,
    );

    // Set access token in httpOnly cookie
    res.cookie(AUTH_CONSTANTS.ACCESS_TOKEN_KEY, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRATION, // 1 hour
    });

    // Set refresh token in httpOnly cookie
    res.cookie(AUTH_CONSTANTS.REFRESH_TOKEN_KEY, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRATION, // 7 days
    });

    res.redirect(process.env.CLIENT_URL || 'http://localhost:3001');
  }
}
