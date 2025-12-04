import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { VerificationService } from './verification.service';
import { ForgotPasswordDto } from '@/verification/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/verification/dto/reset-password.dto';
import { ResendVerificationDto } from '@/verification/dto/resend-verification.dto';
import { Public } from '@common/decorators/public.decorator';
import { extractFrontendUrl } from '@common/utils/frontend-url.util';
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
  @Throttle({ default: { limit: 12, ttl: 3600000 } }) // 12 requests per 1 hour
  @Post('resend')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
    @Req() req: Request,
  ) {
    const frontendUrl = extractFrontendUrl(req);
    return this.verificationService.resendVerificationEmail(
      resendVerificationDto.email,
      frontendUrl,
    );
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per 1 hour
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    const frontendUrl = extractFrontendUrl(req);
    return this.verificationService.forgotPassword(
      forgotPasswordDto.email,
      frontendUrl,
    );
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
