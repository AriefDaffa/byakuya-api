import swagger from '@elysiajs/swagger';
import cors from '@elysiajs/cors';
import { Elysia } from 'elysia';

import betterAuthView from './lib/auth-view';
import { chatSocket } from './v1/socket/chat-socket';
import { v1Api } from './v1';

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .all('/api/auth/*', betterAuthView)
  .use(v1Api)
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
