import { Elysia, t } from 'elysia';

export const socketGetChatList = new Elysia().ws('/chat-list', {
  query: t.Object({
    user_id: t.String(),
  }),
  async open(ws) {
    const { user_id } = ws.data.query;

    ws.subscribe(`chat-list-${user_id}`);
  },
  async close(ws) {
    const { user_id } = ws.data.query;
    ws.unsubscribe(`chat-list-${user_id}`);
  },
});
