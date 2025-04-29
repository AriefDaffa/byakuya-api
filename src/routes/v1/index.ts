import { Elysia } from 'elysia';

import { createPrivateChat } from '../../modules/chat/create-private-chat';
import { getChatList } from '../../modules/chat/get-chat-list';
import { getPrivateChat } from '../../modules/chat/get-private-chat';
import { searchChat } from '../../modules/chat/search-chat';
import { socketGetPC } from '../../modules/socket/socket-get-PC';
import { socketGetChatList } from '../../modules/socket/socket-get-chat-list';
import { getUserByKeyword } from '../../modules/user/get-user-by-keyword';

export const ApiV1 = new Elysia({ prefix: '/api/v1' })
  .use(socketGetChatList)
  .use(socketGetPC)
  .use(getChatList)
  .use(getPrivateChat)
  .use(getUserByKeyword)
  .use(createPrivateChat)
  .use(searchChat);
