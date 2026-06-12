export const CHAT_NAMESPACE = '/chat';

export const CHAT_ROOM_PREFIX = 'conversation:';

export const CHAT_EVENTS = {
  JOIN: 'chat:join',
  SEND: 'chat:send',
  LEAVE: 'chat:leave',
  NEW_MESSAGE: 'chat:new-message',
  CONVERSATION_UPDATED: 'chat:conversation-updated',
} as const;

export const DEFAULT_MESSAGES_PAGE_SIZE = 30;

export const CHAT_SEND_RATE_LIMIT = 60;
export const CHAT_SEND_RATE_WINDOW_MS = 60_000;

export const CHAT_CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(', ').filter(Boolean)
  : '*';
