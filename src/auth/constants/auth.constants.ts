import { CookieOptions } from 'express';

export const AUTH_CONSTANTS = {
  // Maximum number of concurrent devices allowed per user
  MAX_DEVICES: 5,

  // Token expiration times
  ACCESS_TOKEN_EXPIRATION: '1h' as const,
  REFRESH_TOKEN_EXPIRATION: '7d' as const,

  // Cookie configuration
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  } as CookieOptions,

  // Cookie names
  ACCESS_TOKEN_COOKIE_NAME: 'access_token',
  REFRESH_TOKEN_COOKIE_NAME: 'refresh_token',
  CSRF_TOKEN_COOKIE_NAME: 'csrf_token',
};
