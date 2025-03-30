import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';

export const personalChatSocket = new Elysia().ws('/personal-chat', {
  body: t.Object({
    message: t.String(),
  }),
  query: t.Object({
    sender_id: t.String(),
    receiver_id: t.String(),
  }),

  async open(ws) {
    const { sender_id, receiver_id } = ws.data.query;

    let room = await prisma.privateChat.findFirst({
      where: {
        users: { every: { userId: { in: [sender_id, receiver_id] } } },
      },
    });

    if (!room) {
      room = await prisma.privateChat.create({
        data: {
          users: {
            create: [{ userId: sender_id }, { userId: receiver_id }],
          },
        },
      });
    }

    (ws.data as any).roomId = room.id;

    ws.subscribe(`byakuya-${room.id}`);
  },

  async message(ws, { message }) {
    const roomId = (ws.data as any).roomId;
    if (!roomId) return;

    const newMessage = await prisma.message.create({
      data: {
        senderId: ws.data.query.sender_id,
        content: message,
        privateChatId: roomId,
      },
    });

    ws.publish(`byakuya-${roomId}`, newMessage);
  },

  async close(ws) {
    const roomId = (ws.data as any).roomId;
    if (!roomId) return;

    ws.unsubscribe(`byakuya-${roomId}`);
  },
});
