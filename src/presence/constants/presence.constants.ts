export const PRESENCE_NAMESPACE = '/presence';

export const PRESENCE_EVENTS = {
  INITIAL: 'presence:initial',
  STATUS_CHANGED: 'presence:status-changed',
} as const;

export const PRESENCE_CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(', ').filter(Boolean)
  : '*';
