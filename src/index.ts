import cors from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';
import { Elysia } from 'elysia';

import betterAuthView from './lib/auth-view';
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
