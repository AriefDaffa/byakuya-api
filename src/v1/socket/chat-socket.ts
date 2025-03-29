import { Elysia, t } from 'elysia';

export const chatSocket = new Elysia().ws('/chat', {
  body: t.Object({
    message: t.String(),
  }),
  query: t.Object({
    id: t.String(),
  }),
  open(ws) {
    const { id } = ws.data.query;

    ws.subscribe(`byakuya-${id}`);
  },
  message(ws, message) {
    const { id } = ws.data.query;

    ws.publish(`byakuya-${id}`, message);
  },
  close(ws) {
    const { id } = ws.data.query;

    ws.unsubscribe(`byakuya-${id}`);
  },
});
