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
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { DeviceUtil } from '../common/utils/device.util';

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
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const deviceInfo = DeviceUtil.extractDeviceInfo(req);
    return this.authService.login(loginDto, deviceInfo);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: { id: string },
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.logout(user.id, refreshTokenDto.refreshToken);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    const deviceInfo = DeviceUtil.extractDeviceInfo(req);
    return this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
      deviceInfo,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getActiveSessions(
    @CurrentUser() user: { id: string },
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
  async logoutAllDevices(@CurrentUser() user: { id: string }) {
    return this.authService.logoutAllDevices(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:tokenId')
  @HttpCode(HttpStatus.OK)
  async logoutDevice(
    @CurrentUser() user: { id: string },
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
  async googleAuthCallback(@Req() req: Request) {
    // After Google authentication, this callback is triggered
    const deviceInfo = DeviceUtil.extractDeviceInfo(req);
    return this.authService.googleLogin(req.user as any, deviceInfo);
  }
}
