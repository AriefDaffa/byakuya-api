import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';

async function markMessagesAsRead(chatId: string, userId: string) {
  await prisma.seenMessage.createMany({
    data: await prisma.message
      .findMany({
        where: {
          privateChatId: chatId,
          seenBy: { none: { userId } }, // Find unread messages
        },
        select: { id: true },
      })
      .then((messages) =>
        messages.map((msg) => ({
          userId,
          messageId: msg.id,
        }))
      ),
    skipDuplicates: true,
  });
}

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

    if (!room) return;

    (ws.data as any).roomId = room.id;

    await markMessagesAsRead(room.id, sender_id);

    ws.subscribe(`byakuya-${room.id}`);
  },

  async message(ws, { message }) {
    const roomId = (ws.data as any).roomId;
    const { sender_id, receiver_id } = ws.data.query;

    if (!roomId) return;

    const newMessage = await prisma.message.create({
      data: {
        senderId: ws.data.query.sender_id,
        content: message,
        privateChatId: roomId,
        seenBy: { create: [] },
      },
    });

    await markMessagesAsRead(roomId, sender_id);

    ws.publish(`byakuya-${roomId}`, newMessage);
    // Notify the sender (sender_id)
    ws.publish(`chat-list-${sender_id}`, {
      updated: true,
      chat: {
        id: roomId,
        type: 'private',
        users: await prisma.privateChatUser.findMany({
          where: { privateChatId: roomId },
          select: { user: { select: { id: true, name: true, image: true } } },
        }),
        latestMessage: newMessage,
        unreadCount: await prisma.message.count({
          where: {
            privateChatId: roomId,
            seenBy: { none: { userId: sender_id } },
          },
        }),
      },
    });

    // Notify the receiver (receiver_id)
    ws.publish(`chat-list-${receiver_id}`, {
      updated: true,
      chat: {
        id: roomId,
        type: 'private',
        users: await prisma.privateChatUser.findMany({
          where: { privateChatId: roomId },
          select: { user: { select: { id: true, name: true, image: true } } },
        }),
        latestMessage: newMessage,
        unreadCount: await prisma.message.count({
          where: {
            privateChatId: roomId,
            seenBy: { none: { userId: receiver_id } },
          },
        }),
      },
    });
  },

  async close(ws) {
    const roomId = (ws.data as any).roomId;
    if (!roomId) return;

    ws.unsubscribe(`byakuya-${roomId}`);
  },
});
