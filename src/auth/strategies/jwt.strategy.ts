import { Injectable, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@prisma/prisma.service';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

interface JwtPayload {
  sub: string;
  sessionId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request) => {
          return request?.cookies?.accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret',
      passReqToCallback: true,
    });
  }

  private clearAuthCookies(res: any) {
    if (res) {
      res.clearCookie(AUTH_CONSTANTS.ACCESS_TOKEN_KEY);
      res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
    }
  }

  async validate(req: any, payload: JwtPayload) {
    const { res } = req;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        isActive: true,
      },
    });

    if (!user) {
      this.clearAuthCookies(res);
      throw new ForbiddenException('User does not exist');
    }

    if (!user.isActive) {
      this.clearAuthCookies(res);
      throw new ForbiddenException('Account has been disabled');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      this.clearAuthCookies(res);
      throw new ForbiddenException('Session is invalid or has been logged out');
    }

    return {
      ...user,
      sessionId: payload.sessionId,
    };
  }
}
