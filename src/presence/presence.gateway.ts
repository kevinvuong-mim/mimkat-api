import {
  WebSocketServer,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import {
  PRESENCE_EVENTS,
  PRESENCE_NAMESPACE,
  PRESENCE_CORS_ORIGIN,
} from '@/presence/constants/presence.constants';
import { PresenceService } from '@/presence/presence.service';
import { ChatWsAuthService } from '@/chat/services/chat-ws-auth.service';
import type { AuthenticatedSocket } from '@/chat/interfaces/authenticated-socket.interface';

@WebSocketGateway({
  namespace: PRESENCE_NAMESPACE,
  cors: {
    credentials: true,
    origin: PRESENCE_CORS_ORIGIN,
  },
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PresenceGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly presenceService: PresenceService,
    private readonly chatWsAuthService: ChatWsAuthService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.chatWsAuthService.validateHandshake(
        client.handshake.auth?.token as string | undefined,
        client.handshake.headers.cookie,
      );

      const socket = client as AuthenticatedSocket;
      socket.userId = user.id;
      socket.user = user;

      const isNewlyOnline = this.presenceService.addConnection(user.id, client.id);

      client.emit(PRESENCE_EVENTS.INITIAL, {
        onlineUserIds: this.presenceService.getOnlineUserIds(),
      });

      if (isNewlyOnline) {
        this.server.emit(PRESENCE_EVENTS.STATUS_CHANGED, {
          userId: user.id,
          isOnline: true,
          lastSeenAt: null,
        });
      }

      this.logger.debug(`Presence connected: ${client.id} (user: ${user.id})`);
    } catch (error) {
      this.logger.warn(`Rejected presence connection: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const socket = client as AuthenticatedSocket;
    if (!socket.userId) return;

    const { wentOffline, lastSeenAt } = await this.presenceService.removeConnection(
      socket.userId,
      client.id,
    );

    if (wentOffline) {
      this.server.emit(PRESENCE_EVENTS.STATUS_CHANGED, {
        userId: socket.userId,
        isOnline: false,
        lastSeenAt: lastSeenAt?.toISOString() ?? null,
      });
    }

    this.logger.debug(`Presence disconnected: ${client.id}`);
  }
}
