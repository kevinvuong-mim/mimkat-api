import { Request } from 'express';

export interface DeviceInfo {
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  userAgent: string;
}

export class DeviceUtil {
  static extractDeviceInfo(req: Request): DeviceInfo {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = this.getIpAddress(req);
    const deviceType = this.getDeviceType(userAgent);
    const deviceName = this.getDeviceName(userAgent, deviceType);

    return {
      deviceName,
      deviceType,
      ipAddress,
      userAgent,
    };
  }

  private static getIpAddress(req: Request): string {
    // Check for IP in various headers (for proxied requests)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }

    return (
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'Unknown'
    );
  }

  private static getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    // Mobile detection
    const mobileKeywords = [
      'mobile',
      'android',
      'iphone',
      'ipad',
      'ipod',
      'blackberry',
      'windows phone',
      'webos',
    ];
    if (mobileKeywords.some((keyword) => ua.includes(keyword))) {
      return 'mobile';
    }

    // Desktop apps detection (Electron, etc.)
    if (ua.includes('electron') || ua.includes('desktop')) {
      return 'desktop';
    }

    // Default to web
    return 'web';
  }

  private static getDeviceName(userAgent: string, deviceType: string): string {
    const ua = userAgent.toLowerCase();

    // iOS devices
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('ipod')) return 'iPod';

    // Android
    if (ua.includes('android')) {
      // Try to extract device model
      const androidMatch = userAgent.match(/Android.*?;\s*([^)]+)/);
      if (androidMatch && androidMatch[1]) {
        return androidMatch[1].trim();
      }
      return 'Android Device';
    }

    // Desktop OS
    if (ua.includes('windows')) return 'Windows PC';
    if (ua.includes('macintosh') || ua.includes('mac os x')) return 'Mac';
    if (ua.includes('linux')) return 'Linux PC';

    // Browsers
    if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome Browser';
    if (ua.includes('safari') && !ua.includes('chrome'))
      return 'Safari Browser';
    if (ua.includes('firefox')) return 'Firefox Browser';
    if (ua.includes('edge')) return 'Edge Browser';

    // Fallback
    return deviceType === 'mobile'
      ? 'Mobile Device'
      : deviceType === 'desktop'
        ? 'Desktop App'
        : 'Web Browser';
  }
}
