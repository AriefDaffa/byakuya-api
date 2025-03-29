import { Elysia } from 'elysia';

import { chatSocket } from './socket/chat-socket';

export const v1Api = new Elysia({ prefix: 'api/v1' }).use(chatSocket);
