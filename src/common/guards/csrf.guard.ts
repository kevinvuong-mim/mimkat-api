import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ClientTypeUtil, ClientType } from '@common/utils/client-type.util';

const CSRF_EXEMPT_KEY = 'csrf_exempt';

/**
 * CSRF Guard - Protects against Cross-Site Request Forgery attacks
 * Only applies to web clients (mobile clients are exempt)
 * Only checks state-changing methods (POST, PUT, PATCH, DELETE)
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint is explicitly marked as CSRF exempt
    const isCsrfExempt = this.reflector.getAllAndOverride<boolean>(
      CSRF_EXEMPT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isCsrfExempt) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientType = ClientTypeUtil.detectClientType(request);

    // Only apply CSRF protection to web clients
    // Mobile clients use different authentication mechanisms
    if (clientType !== ClientType.WEB) {
      return true;
    }

    // Safe methods don't need CSRF protection (they shouldn't modify state)
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // For state-changing methods, verify CSRF token
    const csrfTokenFromCookie = request.cookies?.csrf_token;
    const csrfTokenFromHeader = request.headers['x-csrf-token'] as string;

    if (!csrfTokenFromCookie || !csrfTokenFromHeader) {
      throw new ForbiddenException('CSRF token missing');
    }

    // Simple constant-time comparison
    if (csrfTokenFromCookie !== csrfTokenFromHeader) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }
}

/**
 * Decorator to mark endpoints as CSRF exempt
 * Use this for public endpoints that don't require CSRF protection
 */
export const CsrfExempt = () =>
  Reflect.metadata(CSRF_EXEMPT_KEY, true) as MethodDecorator;
