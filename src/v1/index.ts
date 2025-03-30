import { Elysia } from 'elysia';

import { personalChatSocket } from './socket/personal-chat-socket';
import { chatController } from './controller/chat-controller';

export const v1Api = new Elysia({ prefix: 'api/v1' })
  .use(personalChatSocket)
  .use(chatController);
