import { JwtService } from '@nestjs/jwt';
import { Injectable, ForbiddenException } from '@nestjs/common';

import type { UserPayload } from '@/common/decorators';
import { PrismaService } from '@/prisma/prisma.service';
import { AUTH_CONSTANTS } from '@/auth/constants/auth.constants';
import { parseCookieHeader } from '@/chat/utils/parse-cookie.util';

interface JwtPayload {
  sub: string;
  sessionId: string;
}

@Injectable()
export class ChatWsAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateHandshake(authToken?: string, cookieHeader?: string): Promise<UserPayload> {
    const cookies = parseCookieHeader(cookieHeader);
    const token = authToken || cookies[AUTH_CONSTANTS.ACCESS_TOKEN_KEY];

    if (!token) {
      throw new ForbiddenException('Missing authentication token');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new ForbiddenException('Invalid authentication token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });

    if (!user?.isActive) {
      throw new ForbiddenException('User does not exist or is disabled');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      throw new ForbiddenException('Session is invalid');
    }

    const now = new Date();

    if (session.expiresAt < now || session.absoluteExpiresAt < now) {
      throw new ForbiddenException('Session has expired');
    }

    return { id: user.id, sessionId: session.id };
  }
}
