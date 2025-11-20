import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { VerificationService } from './verification.service';
import { ForgotPasswordDto } from '@auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@auth/dto/reset-password.dto';
import { Public } from '@common/decorators/public.decorator';
import { AUTH_CONSTANTS } from '@auth/constants/auth.constants';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Get('email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    return this.verificationService.verifyEmail(token);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per 1 hour
  @Post('resend')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    return this.verificationService.resendVerificationEmail(email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per 1 hour
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.verificationService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 requests per 1 hour
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.verificationService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );

    // Clear cookies
    res.clearCookie(AUTH_CONSTANTS.ACCESS_TOKEN_KEY);
    res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
  }
}
