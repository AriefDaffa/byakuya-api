import { Elysia, t } from 'elysia';
import { authMid } from '../../middleware/auth-middleware';

export const socketGetChatList = new Elysia().use(authMid).ws('/chat-list', {
  auth: true,

  async open(ws) {
    const { id } = ws.data.user;

    ws.subscribe(`byakuya-list-${id}`);
  },
  async close(ws) {
    const { id } = ws.data.user;
    ws.unsubscribe(`byakuya-list-${id}`);
  },
});
