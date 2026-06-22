import { Module } from '@nestjs/common';

import { ChatModule } from '@/chat/chat.module';
import { PresenceGateway } from '@/presence/presence.gateway';
import { PresenceService } from '@/presence/presence.service';
import { PresenceController } from '@/presence/presence.controller';

@Module({
  imports: [ChatModule],
  exports: [PresenceService],
  controllers: [PresenceController],
  providers: [PresenceGateway, PresenceService],
})
export class PresenceModule {}
