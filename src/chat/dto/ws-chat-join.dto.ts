import { IsUUID } from 'class-validator';

export class WsChatJoinDto {
  @IsUUID()
  conversationId: string;
}
