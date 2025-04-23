import cors from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';
import { Elysia } from 'elysia';

import betterAuthView from './lib/auth-view';
import { ApiV1 } from './routes/v1';
import { auth } from './lib/auth';

console.log('test');
const app = new Elysia()
  .use(
    cors({
      origin: process.env.ORIGIN_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  .mount(auth.handler)
  .use(swagger())
  .all('/api/auth/*', betterAuthView)
  .use(ApiV1)
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
