import { Elysia } from 'elysia';
import { auth } from '../lib/auth';

export const authMid = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ error, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session)
          return error(401, {
            success: false,
            message: 'Unauthorized',
            statusCode: 401,
          });

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
