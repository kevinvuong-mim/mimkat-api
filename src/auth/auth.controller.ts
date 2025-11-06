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
    @CurrentUser() user: UserPayload,
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
    const tokens = await this.authService.googleLogin(
      req.user as any,
      deviceInfo,
    );

    // Return HTML page that sends tokens to parent window via postMessage
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Success</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 10px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .success-icon {
              font-size: 3rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #333;
              margin-bottom: 0.5rem;
            }
            p {
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Đăng nhập thành công!</h1>
            <p>Đang đóng cửa sổ...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage(
                  {
                    type: 'GOOGLE_AUTH_SUCCESS',
                    data: ${JSON.stringify(tokens)}
                  },
                  '${frontendUrl}'
                );
                setTimeout(() => window.close(), 1000);
              } else {
                document.body.innerHTML = '<div class="container"><h1>⚠️ Lỗi</h1><p>Không thể gửi dữ liệu về cửa sổ chính</p></div>';
              }
            } catch (error) {
              console.error('Error sending message:', error);
              document.body.innerHTML = '<div class="container"><h1>⚠️ Lỗi</h1><p>Có lỗi xảy ra: ' + error.message + '</p></div>';
            }
          </script>
        </body>
      </html>
    `);
  }
}
