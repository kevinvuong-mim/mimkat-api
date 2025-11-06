import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface UserPayload {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  isActive: boolean;
}

declare module 'express' {
  interface Request {
    user?: UserPayload;
  }
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
