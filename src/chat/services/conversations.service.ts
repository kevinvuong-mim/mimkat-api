import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ConversationType } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { UpdateConversationDto } from '@/chat/dto/update-conversation.dto';
import { DEFAULT_CONVERSATIONS_PAGE_SIZE } from '@/chat/constants/chat.constants';
import { CreateGroupConversationDto } from '@/chat/dto/create-group-conversation.dto';

const conversationInclude = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          avatar: true,
          fullName: true,
          username: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' as const },
  },
  messages: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          avatar: true,
          fullName: true,
          username: true,
        },
      },
    },
  },
} satisfies Prisma.ConversationInclude;

type ConversationWithRelations = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}>;

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    return participant;
  }

  async assertGroupAdmin(conversationId: string, userId: string) {
    const participant = await this.assertParticipant(conversationId, userId);

    if (!participant.isAdmin) {
      throw new ForbiddenException('Only the group admin can perform this action');
    }

    return participant;
  }

  async listForUser(userId: string, cursor?: string, limit = DEFAULT_CONVERSATIONS_PAGE_SIZE) {
    const take = limit + 1;
    const cursorConversation = cursor
      ? await this.prisma.conversation.findFirst({
          where: {
            id: cursor,
            participants: { some: { userId } },
          },
          select: { id: true },
        })
      : null;

    if (cursor && !cursorConversation) {
      throw new BadRequestException('Invalid cursor');
    }

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: conversationInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take,
      ...(cursorConversation
        ? {
            cursor: { id: cursorConversation.id },
            skip: 1,
          }
        : {}),
    });

    const hasMore = conversations.length > limit;
    const items = hasMore ? conversations.slice(0, limit) : conversations;

    return {
      items: items.map((conversation) => this.formatConversation(conversation, userId)),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    };
  }

  async getById(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.formatConversation(conversation, userId);
  }

  private async resolveParticipantId(email: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        email: email.trim(),
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.id;
  }

  private directConversationWhere(
    userId: string,
    participantId: string,
  ): Prisma.ConversationWhereInput {
    return {
      type: ConversationType.DIRECT,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: participantId } } },
      ],
    };
  }

  private async findExistingDirectConversation(userId: string, participantId: string) {
    return this.prisma.conversation.findFirst({
      where: this.directConversationWhere(userId, participantId),
      include: conversationInclude,
    });
  }

  async findOrCreateDirect(userId: string, participantEmail: string) {
    const participantId = await this.resolveParticipantId(participantEmail);

    if (userId === participantId) {
      throw new BadRequestException('Cannot start a direct chat with yourself');
    }

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const existing = await this.findExistingDirectConversation(userId, participantId);

      if (existing && existing.participants.length === 2) {
        return this.formatConversation(existing, userId);
      }

      try {
        const conversation = await this.prisma.conversation.create({
          data: {
            type: ConversationType.DIRECT,
            participants: {
              create: [{ userId }, { userId: participantId }],
            },
          },
          include: conversationInclude,
        });

        return this.formatConversation(conversation, userId);
      } catch (error) {
        const raced = await this.findExistingDirectConversation(userId, participantId);
        if (raced && raced.participants.length === 2) {
          return this.formatConversation(raced, userId);
        }

        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Failed to create direct conversation');
  }

  async createGroup(userId: string, dto: CreateGroupConversationDto) {
    const resolvedMemberIds = await Promise.all(
      dto.memberEmails.map((email) => this.resolveParticipantId(email)),
    );
    const uniqueMemberIds = [...new Set(resolvedMemberIds.filter((id) => id !== userId))];

    if (uniqueMemberIds.length === 0) {
      throw new BadRequestException('Group must have at least one other member');
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.GROUP,
        name: dto.name,
        participants: {
          create: [
            { userId, isAdmin: true },
            ...uniqueMemberIds.map((id) => ({ userId: id, isAdmin: false })),
          ],
        },
      },
      include: conversationInclude,
    });

    return this.formatConversation(conversation, userId);
  }

  async update(conversationId: string, userId: string, dto: UpdateConversationDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Direct conversations cannot be updated');
    }

    await this.assertGroupAdmin(conversationId, userId);

    if (dto.transferAdminEmail) {
      return this.transferAdmin(conversationId, userId, dto.transferAdminEmail);
    }

    if (dto.addMemberEmail) {
      const memberId = await this.resolveParticipantId(dto.addMemberEmail);
      return this.addMember(conversationId, userId, memberId);
    }

    if (dto.removeMemberEmail) {
      const memberId = await this.resolveParticipantId(dto.removeMemberEmail);
      return this.removeMember(conversationId, userId, memberId);
    }

    if (dto.name !== undefined) {
      const updated = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { name: dto.name },
        include: conversationInclude,
      });

      return this.formatConversation(updated, userId);
    }

    throw new BadRequestException('No valid update fields provided');
  }

  private async addMember(conversationId: string, actorId: string, memberId: string) {
    const existing = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: memberId },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: memberId, isActive: true },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.conversationParticipant.create({
      data: { conversationId, userId: memberId, isAdmin: false },
    });

    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
      include: conversationInclude,
    });

    return this.formatConversation(conversation, actorId);
  }

  private async removeMember(conversationId: string, actorId: string, memberId: string) {
    const target = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: memberId },
      },
    });

    if (!target) {
      throw new NotFoundException('Member not found in this conversation');
    }

    if (target.isAdmin) {
      throw new BadRequestException('Transfer admin role before removing the admin');
    }

    await this.prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: { conversationId, userId: memberId },
      },
    });

    const remaining = await this.prisma.conversationParticipant.count({
      where: { conversationId },
    });

    if (remaining === 0) {
      await this.prisma.conversation.delete({ where: { id: conversationId } });
      return { deleted: true, conversationId };
    }

    const updated = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });

    return this.formatConversation(updated!, actorId);
  }

  private async transferAdmin(conversationId: string, actorId: string, transferAdminEmail: string) {
    const newAdminId = await this.resolveParticipantId(transferAdminEmail);

    if (newAdminId === actorId) {
      throw new BadRequestException('You are already the admin');
    }

    const newAdminParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: newAdminId },
      },
    });

    if (!newAdminParticipant) {
      throw new BadRequestException('Target user is not a member of this group');
    }

    await this.prisma.$transaction([
      this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
        data: { isAdmin: false },
      }),
      this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: { conversationId, userId: newAdminId },
        },
        data: { isAdmin: true },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });

    return this.formatConversation(conversation!, actorId);
  }

  async delete(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.assertParticipant(conversationId, userId);

    if (conversation.type === ConversationType.DIRECT) {
      await this.prisma.conversation.delete({ where: { id: conversationId } });
      return { deleted: true, conversationId };
    }

    await this.assertGroupAdmin(conversationId, userId);
    await this.prisma.conversation.delete({ where: { id: conversationId } });

    return { deleted: true, conversationId };
  }

  private formatConversation(conversation: ConversationWithRelations, currentUserId: string) {
    const lastMessage = conversation.messages[0] ?? null;
    const otherParticipants = conversation.participants.filter((p) => p.userId !== currentUserId);

    return {
      id: conversation.id,
      type: conversation.type,
      name:
        conversation.type === ConversationType.GROUP
          ? conversation.name
          : (otherParticipants[0]?.user.fullName ??
            otherParticipants[0]?.user.username ??
            otherParticipants[0]?.user.email),
      avatar:
        conversation.type === ConversationType.GROUP
          ? conversation.avatar
          : otherParticipants[0]?.user.avatar,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: conversation.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        isAdmin: p.isAdmin,
        joinedAt: p.joinedAt,
        user: p.user,
      })),
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            type: lastMessage.type,
            createdAt: lastMessage.createdAt,
            sender: lastMessage.sender,
          }
        : null,
    };
  }
}
