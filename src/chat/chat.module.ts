import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ChatGateway } from '@/chat/chat.gateway';
import { MessagesService } from '@/chat/services/messages.service';
import { ChatWsAuthService } from '@/chat/services/chat-ws-auth.service';
import { ConversationsController } from '@/chat/conversations.controller';
import { ConversationsService } from '@/chat/services/conversations.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ConversationsController],
  exports: [ChatGateway, MessagesService, ConversationsService, ChatWsAuthService],
  providers: [ChatGateway, MessagesService, ChatWsAuthService, ConversationsService],
})
export class ChatModule {}
