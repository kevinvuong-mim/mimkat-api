import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Get redirect URL from query parameter or Referer header
    const redirectUrl =
      request.query.redirect_url ||
      request.headers.referer ||
      request.headers.origin ||
      process.env.CLIENT_URL ||
      'http://localhost:3001';

    // Pass redirect URL as state parameter to Google OAuth
    return {
      state: redirectUrl,
    };
  }
}
