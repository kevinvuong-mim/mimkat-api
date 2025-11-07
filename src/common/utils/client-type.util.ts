import { Request } from 'express';

export enum ClientType {
  WEB = 'web',
  MOBILE = 'mobile',
}

export class ClientTypeUtil {
  // Detect client type from request headers
  static detectClientType(req: Request): ClientType {
    // Check custom header first (recommended approach for explicit declaration)
    const clientTypeHeader = req.headers['x-client-type'];
    if (clientTypeHeader === 'mobile') {
      return ClientType.MOBILE;
    }
    if (clientTypeHeader === 'web') {
      return ClientType.WEB;
    }

    // Fallback to User-Agent detection
    const userAgent = req.headers['user-agent'] || '';

    // Check if request comes from native mobile app frameworks
    const isNativeApp =
      /MimkatMobile|ReactNative|Flutter|Ionic|Capacitor|Cordova/i.test(
        userAgent,
      );

    if (isNativeApp) {
      return ClientType.MOBILE;
    }

    // Check for mobile device user agents
    const isMobileDevice = /mobile|android|iphone|ipad|ipod/i.test(userAgent);

    // Mobile web browsers should still be treated as web clients (for cookie support)
    // Only native mobile apps should be treated as mobile clients
    if (isMobileDevice && isNativeApp) {
      return ClientType.MOBILE;
    }

    // Default to web client (supports cookies)
    return ClientType.WEB;
  }
}
