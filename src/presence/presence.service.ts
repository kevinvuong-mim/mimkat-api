import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeenAt: Date | null;
}

@Injectable()
export class PresenceService {
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private readonly prisma: PrismaService) {}

  addConnection(userId: string, socketId: string): boolean {
    const wasOnline = this.isOnline(userId);

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }

    this.userSockets.get(userId)!.add(socketId);

    return !wasOnline;
  }

  async removeConnection(
    userId: string,
    socketId: string,
  ): Promise<{ wentOffline: boolean; lastSeenAt: Date | null }> {
    const sockets = this.userSockets.get(userId);

    if (!sockets) {
      return { wentOffline: false, lastSeenAt: null };
    }

    sockets.delete(socketId);

    if (sockets.size > 0) {
      return { wentOffline: false, lastSeenAt: null };
    }

    this.userSockets.delete(userId);

    const lastSeenAt = new Date();

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt },
    });

    return { wentOffline: true, lastSeenAt };
  }

  isOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  async getPresenceForUsers(userIds: string[]): Promise<UserPresence[]> {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];

    if (!uniqueIds.length) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
      select: { id: true, lastSeenAt: true },
    });

    return users.map((user) => ({
      userId: user.id,
      isOnline: this.isOnline(user.id),
      lastSeenAt: this.isOnline(user.id) ? null : user.lastSeenAt,
    }));
  }

  getPresence(userId: string, lastSeenAt: Date | null): UserPresence {
    return {
      userId,
      isOnline: this.isOnline(userId),
      lastSeenAt: this.isOnline(userId) ? null : lastSeenAt,
    };
  }
}
