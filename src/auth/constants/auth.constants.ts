export const AUTH_CONSTANTS = {
  // Maximum number of concurrent devices allowed per user
  MAX_DEVICES: 5,

  // Token expiration times
  ACCESS_TOKEN_EXPIRATION: '1h' as const,
  REFRESH_TOKEN_EXPIRATION: '7d' as const,
};
