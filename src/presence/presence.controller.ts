import { Get, Query, HttpCode, UseGuards, Controller, HttpStatus } from '@nestjs/common';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PresenceService } from '@/presence/presence.service';
import { GetPresenceQueryDto } from '@/presence/dto/get-presence-query.dto';

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getPresence(@Query() query: GetPresenceQueryDto) {
    return this.presenceService.getPresenceForUsers(query.userIds);
  }
}
