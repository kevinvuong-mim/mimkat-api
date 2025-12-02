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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { UserService } from './user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  CurrentUser,
  type UserPayload,
} from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { AUTH_CONSTANTS } from '@auth/constants/auth.constants';
import { getPaginationParams } from '@common/utils/pagination.util';

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

  @Put('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.id, updateProfileDto);
  }

  @Put('me/avatar')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 uploads per hour
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(
    @CurrentUser() user: UserPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp|gif)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(user.id, file);
  }

  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 requests per 1 hour
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
    res.clearCookie(AUTH_CONSTANTS.ACCESS_TOKEN_KEY);
    res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getActiveSessions(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const {
      page: normalizedPage,
      limit: normalizedLimit,
      skip,
    } = getPaginationParams(Number(page), Number(limit));

    return this.userService.getActiveSessions(
      user.id,
      user.sessionId,
      normalizedPage,
      normalizedLimit,
      skip,
    );
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  async logoutAllDevices(
    @CurrentUser() user: UserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.userService.logoutAllDevices(user.id);

    // Clear cookies
    res.clearCookie(AUTH_CONSTANTS.ACCESS_TOKEN_KEY);
    res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async logoutDevice(
    @CurrentUser() user: UserPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.userService.logoutDevice(user.id, sessionId);
  }

  @Get(':identifier')
  @HttpCode(HttpStatus.OK)
  getUserByIdOrUsername(@Param('identifier') identifier: string) {
    return this.userService.getUserByIdOrUsername(identifier);
  }
}
