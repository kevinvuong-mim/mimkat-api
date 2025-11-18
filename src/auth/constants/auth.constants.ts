export const AUTH_CONSTANTS = {
  // Maximum number of concurrent sessions allowed per user
  MAX_CONCURRENT_SESSIONS: 5,

  // Token storage keys
  ACCESS_TOKEN_KEY: 'accessToken',
  REFRESH_TOKEN_KEY: 'refreshToken',

  // Token expiration times
  ACCESS_TOKEN_EXPIRATION: '1h' as const,
  REFRESH_TOKEN_EXPIRATION: '7d' as const,
};
