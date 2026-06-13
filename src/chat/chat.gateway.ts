import {
  MessageBody,
  WsException,
  ConnectedSocket,
  WebSocketServer,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';

import {
  CHAT_EVENTS,
  CHAT_NAMESPACE,
  CHAT_ROOM_PREFIX,
  CHAT_CORS_ORIGIN,
  CHAT_SEND_RATE_LIMIT,
  CHAT_SEND_RATE_WINDOW_MS,
} from '@/chat/constants/chat.constants';
import { WsChatJoinDto } from '@/chat/dto/ws-chat-join.dto';
import { WsChatSendDto } from '@/chat/dto/ws-chat-send.dto';
import { MessagesService } from '@/chat/services/messages.service';
import { ChatWsAuthService } from '@/chat/services/chat-ws-auth.service';
import { ConversationsService } from '@/chat/services/conversations.service';
import type { AuthenticatedSocket } from '@/chat/interfaces/authenticated-socket.interface';

@WebSocketGateway({
  namespace: CHAT_NAMESPACE,
  cors: {
    credentials: true,
    origin: CHAT_CORS_ORIGIN,
  },
})
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly sendLocks = new Set<string>();
  private readonly sendRateLimits = new Map<string, number[]>();
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly chatWsAuthService: ChatWsAuthService,
    private readonly conversationsService: ConversationsService,
  ) {}

  private validatePayload<T extends object>(cls: new () => T, payload: unknown): T {
    const instance = plainToInstance(cls, payload);
    const errors = validateSync(instance, { whitelist: true, forbidNonWhitelisted: true });

    if (errors.length > 0) {
      throw new WsException('Invalid payload');
    }

    return instance;
  }

  private checkSendRateLimit(userId: string): void {
    const now = Date.now();
    const timestamps = (this.sendRateLimits.get(userId) ?? []).filter(
      (t) => now - t < CHAT_SEND_RATE_WINDOW_MS,
    );

    if (timestamps.length >= CHAT_SEND_RATE_LIMIT) {
      throw new WsException('Rate limit exceeded');
    }

    timestamps.push(now);
    this.sendRateLimits.set(userId, timestamps);
  }

  async handleConnection(client: Socket) {
    try {
      const user = await this.chatWsAuthService.validateHandshake(
        client.handshake.auth?.token as string | undefined,
        client.handshake.headers.cookie,
      );

      const socket = client as AuthenticatedSocket;
      socket.userId = user.id;
      socket.user = user;

      this.logger.debug(`Client connected: ${client.id} (user: ${user.id})`);
    } catch (error) {
      this.logger.warn(`Rejected websocket connection: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const socket = client as AuthenticatedSocket;
    if (!socket.userId) return;

    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(CHAT_EVENTS.JOIN)
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: WsChatJoinDto,
  ) {
    const dto = this.validatePayload(WsChatJoinDto, body);
    await this.conversationsService.assertParticipant(dto.conversationId, client.userId);
    await client.join(`${CHAT_ROOM_PREFIX}${dto.conversationId}`);

    return { success: true, conversationId: dto.conversationId };
  }

  @SubscribeMessage(CHAT_EVENTS.LEAVE)
  async handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: WsChatJoinDto,
  ) {
    const dto = this.validatePayload(WsChatJoinDto, body);
    await client.leave(`${CHAT_ROOM_PREFIX}${dto.conversationId}`);
    return { success: true, conversationId: dto.conversationId };
  }

  @SubscribeMessage(CHAT_EVENTS.SEND)
  async handleSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: WsChatSendDto,
  ) {
    const dto = this.validatePayload(WsChatSendDto, body);
    this.checkSendRateLimit(client.userId);

    const lockKey = `${client.id}:${dto.conversationId}:${dto.content}`;

    if (this.sendLocks.has(lockKey)) {
      const existing = await this.messagesService.findRecentDuplicate(
        dto.conversationId,
        client.userId,
        dto.content,
        dto.type,
      );
      if (existing) {
        return { success: true, message: existing };
      }
    }

    this.sendLocks.add(lockKey);
    setTimeout(() => this.sendLocks.delete(lockKey), 2000);

    try {
      const message = await this.messagesService.send(
        dto.conversationId,
        client.userId,
        dto.content,
        dto.type,
      );

      const room = `${CHAT_ROOM_PREFIX}${dto.conversationId}`;
      this.server.to(room).emit(CHAT_EVENTS.NEW_MESSAGE, message);

      const conversation = await this.conversationsService.getById(
        dto.conversationId,
        client.userId,
      );
      this.server.to(room).emit(CHAT_EVENTS.CONVERSATION_UPDATED, conversation);

      return { success: true, message };
    } finally {
      this.sendLocks.delete(lockKey);
    }
  }

  emitConversationUpdated(conversationId: string, payload: unknown) {
    this.server
      .to(`${CHAT_ROOM_PREFIX}${conversationId}`)
      .emit(CHAT_EVENTS.CONVERSATION_UPDATED, payload);
  }

  emitConversationDeleted(conversationId: string) {
    this.server
      .to(`${CHAT_ROOM_PREFIX}${conversationId}`)
      .emit(CHAT_EVENTS.CONVERSATION_DELETED, { conversationId });
  }
}
