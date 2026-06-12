import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ConversationType } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { UpdateConversationDto } from '@/chat/dto/update-conversation.dto';
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

  async listForUser(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: conversationInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conversation) => this.formatConversation(conversation, userId));
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

  async findOrCreateDirect(userId: string, participantEmail: string) {
    const participantId = await this.resolveParticipantId(participantEmail);

    if (userId === participantId) {
      throw new BadRequestException('Cannot start a direct chat with yourself');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.conversation.findFirst({
          where: {
            type: ConversationType.DIRECT,
            AND: [
              { participants: { some: { userId } } },
              { participants: { some: { userId: participantId } } },
            ],
          },
          include: conversationInclude,
        });

        if (existing && existing.participants.length === 2) {
          return this.formatConversation(existing, userId);
        }

        const conversation = await tx.conversation.create({
          data: {
            type: ConversationType.DIRECT,
            participants: {
              create: [{ userId }, { userId: participantId }],
            },
          },
          include: conversationInclude,
        });

        return this.formatConversation(conversation, userId);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
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
        avatar: dto.avatar,
        participants: {
          create: [{ userId }, ...uniqueMemberIds.map((id) => ({ userId: id }))],
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

    await this.assertParticipant(conversationId, userId);

    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Direct conversations cannot be updated');
    }

    if (dto.leave) {
      return this.removeMember(conversationId, userId, userId);
    }

    if (dto.addMemberEmail) {
      const memberId = await this.resolveParticipantId(dto.addMemberEmail);
      return this.addMember(conversationId, userId, memberId);
    }

    if (dto.removeMemberEmail) {
      const memberId = await this.resolveParticipantId(dto.removeMemberEmail);
      return this.removeMember(conversationId, userId, memberId);
    }

    if (dto.name !== undefined || dto.avatar !== undefined) {
      const updated = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          name: dto.name,
          avatar: dto.avatar,
        },
        include: conversationInclude,
      });

      return this.formatConversation(updated, userId);
    }

    throw new BadRequestException('No valid update fields provided');
  }

  private async addMember(conversationId: string, actorId: string, memberId: string) {
    await this.assertParticipant(conversationId, actorId);

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
      data: { conversationId, userId: memberId },
    });

    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
      include: conversationInclude,
    });

    return this.formatConversation(conversation, actorId);
  }

  private async removeMember(conversationId: string, actorId: string, memberId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { orderBy: { joinedAt: 'asc' } } },
    });

    if (!conversation || conversation.type !== ConversationType.GROUP) {
      throw new BadRequestException('Invalid group conversation');
    }

    const isSelfLeave = actorId === memberId;
    const isParticipant = conversation.participants.some((p) => p.userId === actorId);

    if (!isParticipant) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    if (!isSelfLeave && conversation.participants[0]?.userId !== actorId) {
      throw new ForbiddenException('Only the group creator can remove members');
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

  async delete(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { orderBy: { joinedAt: 'asc' } } },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.assertParticipant(conversationId, userId);

    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Direct conversations cannot be deleted');
    }

    if (conversation.participants[0]?.userId !== userId) {
      throw new ForbiddenException('Only the group creator can delete this conversation');
    }

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
