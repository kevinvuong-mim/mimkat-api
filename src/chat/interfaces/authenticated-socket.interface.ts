import { Socket } from 'socket.io';

import type { UserPayload } from '@/common/decorators';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  user: UserPayload;
}
