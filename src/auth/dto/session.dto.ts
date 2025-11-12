export class SessionResponseDto {
  id: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isCurrent?: boolean;
}
