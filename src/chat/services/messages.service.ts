import { Prisma, MessageType } from '@prisma/client';
import { Injectable, BadRequestException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { ConversationsService } from '@/chat/services/conversations.service';
import { DEFAULT_MESSAGES_PAGE_SIZE } from '@/chat/constants/chat.constants';

const messageInclude = {
  sender: {
    select: {
      id: true,
      email: true,
      avatar: true,
      fullName: true,
      username: true,
    },
  },
} satisfies Prisma.MessageInclude;

type MessageWithSender = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
  ) {}

  formatMessage(message: MessageWithSender) {
    return {
      id: message.id,
      type: message.type,
      sender: message.sender,
      content: message.content,
      senderId: message.senderId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      conversationId: message.conversationId,
    };
  }

  async list(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = DEFAULT_MESSAGES_PAGE_SIZE,
  ) {
    await this.conversationsService.assertParticipant(conversationId, userId);

    const take = limit + 1;
    const cursorMessage = cursor
      ? await this.prisma.message.findUnique({
          where: { id: cursor },
          select: { id: true, conversationId: true, createdAt: true },
        })
      : null;

    if (cursor && (!cursorMessage || cursorMessage.conversationId !== conversationId)) {
      throw new BadRequestException('Invalid cursor');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: messageInclude,
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursorMessage
        ? {
            cursor: { id: cursorMessage.id },
            skip: 1,
          }
        : {}),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return {
      items: items.map((m) => this.formatMessage(m)),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    };
  }

  async findRecentDuplicate(
    conversationId: string,
    senderId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
  ) {
    const recent = await this.prisma.message.findFirst({
      where: {
        content,
        senderId,
        conversationId,
        type,
        createdAt: { gte: new Date(Date.now() - 3000) },
      },
      include: messageInclude,
      orderBy: { createdAt: 'desc' },
    });

    return recent ? this.formatMessage(recent) : null;
  }

  async send(
    conversationId: string,
    senderId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
  ) {
    await this.conversationsService.assertParticipant(conversationId, senderId);

    const duplicate = await this.findRecentDuplicate(conversationId, senderId, content, type);
    if (duplicate) return duplicate;

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content,
          type,
        },
        include: messageInclude,
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    return this.formatMessage(message);
  }
}
