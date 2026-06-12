import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Query,
  Delete,
  HttpCode,
  UseGuards,
  Controller,
  HttpStatus,
} from '@nestjs/common';

import { ChatGateway } from '@/chat/chat.gateway';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { MessagesQueryDto } from '@/chat/dto/messages-query.dto';
import { MessagesService } from '@/chat/services/messages.service';
import { CurrentUser, type UserPayload } from '@/common/decorators';
import { UpdateConversationDto } from '@/chat/dto/update-conversation.dto';
import { ConversationsService } from '@/chat/services/conversations.service';
import { CreateGroupConversationDto } from '@/chat/dto/create-group-conversation.dto';
import { CreateDirectConversationDto } from '@/chat/dto/create-direct-conversation.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  list(@CurrentUser() user: UserPayload) {
    return this.conversationsService.listForUser(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getOne(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.conversationsService.getById(id, user.id);
  }

  @Get(':id/messages')
  @HttpCode(HttpStatus.OK)
  getMessages(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.messagesService.list(id, user.id, query.cursor, query.limit);
  }

  @Post('direct')
  @HttpCode(HttpStatus.CREATED)
  createDirect(@CurrentUser() user: UserPayload, @Body() dto: CreateDirectConversationDto) {
    return this.conversationsService.findOrCreateDirect(user.id, dto.participantEmail);
  }

  @Post('group')
  @HttpCode(HttpStatus.CREATED)
  createGroup(@CurrentUser() user: UserPayload, @Body() dto: CreateGroupConversationDto) {
    return this.conversationsService.createGroup(user.id, dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    const result = await this.conversationsService.update(id, user.id, dto);

    if (!('deleted' in result && result.deleted)) {
      this.chatGateway.emitConversationUpdated(id, result);
    }

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.conversationsService.delete(id, user.id);
  }
}
