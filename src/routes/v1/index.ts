import { Elysia } from 'elysia';

import { getChatList } from '../../modules/chat/get-chat-list';
import { getPrivateChat } from '../../modules/chat/get-private-chat';
import { socketGetPC } from '../../modules/socket/socket-get-PC';
import { socketGetChatList } from '../../modules/socket/socket-get-chat-list';

export const ApiV1 = new Elysia({ prefix: '/api/v1' })
  .use(socketGetChatList)
  .use(socketGetPC)
  .use(getChatList)
  .use(getPrivateChat);
