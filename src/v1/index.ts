import { Elysia } from 'elysia';

import { personalChatSocket } from './socket/personal-chat-socket';
import { chatController } from './controller/chat-controller';
import { chatListSocket } from './socket/chat-list-socket';

export const v1Api = new Elysia({ prefix: 'api/v1' })
  .use(personalChatSocket)
  .use(chatListSocket)
  .use(chatController);
