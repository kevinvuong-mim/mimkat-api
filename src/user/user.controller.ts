import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { UserService } from './user.service';
import { ChangePasswordDto } from '@auth/dto/change-password.dto';
import {
  CurrentUser,
  type UserPayload,
} from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@CurrentUser() user: UserPayload) {
    // Return full profile with hasPassword and hasGoogleAuth flags
    return this.userService.getUserProfile(user.id);
  }

  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per 1 hour
  @Put('password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: UserPayload,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.userService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getActiveSessions(@CurrentUser() user: UserPayload) {
    return this.userService.getActiveSessions(user.id, user.sessionId);
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  async logoutAllDevices(@CurrentUser() user: UserPayload) {
    return this.userService.logoutAllDevices(user.id);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async logoutDevice(
    @CurrentUser() user: UserPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.userService.logoutDevice(user.id, sessionId);
  }
}
