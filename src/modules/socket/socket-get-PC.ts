import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';

async function markMessagesAsRead(chatId: string, userId: string) {
  await prisma.seenMessage.createMany({
    data: await prisma.message
      .findMany({
        where: {
          privateChatId: chatId,
          seenBy: { none: { userId } },
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

export const socketGetPC = new Elysia().ws('/personal-chat', {
  body: t.Object({
    message: t.String(),
  }),
  query: t.Object({
    user_id: t.String(),
    room_id: t.String(),
  }),

  async open(ws) {
    const { user_id, room_id } = ws.data.query;

    const room = await prisma.privateChat.findUnique({
      where: { id: room_id },
    });

    if (!room) return;

    await markMessagesAsRead(room_id, user_id);

    ws.subscribe(`byakuya-${room_id}`);
  },

  async message(ws, { message }) {
    const { user_id, room_id } = ws.data.query;
    if (!room_id) return;

    const messageToSend = {
      id: `temp-${Date.now()}`, // temporary id until DB save returns actual id
      content: message,
      senderId: user_id,
      privateChatId: room_id,
      createdAt: new Date(),
      seenBy: [],
    };

    // Send message first
    ws.publish(`byakuya-${room_id}`, messageToSend);

    // Save to DB in the background
    (async () => {
      const newMessage = await prisma.message.create({
        data: {
          senderId: user_id,
          content: message,
          privateChatId: room_id,
          seenBy: { create: [] },
        },
      });

      await markMessagesAsRead(room_id, user_id);

      const users = await prisma.privateChatUser.findMany({
        where: { privateChatId: room_id },
        select: { userId: true },
      });

      for (const user of users) {
        ws.publish(`chat-list-${user.userId}`, {
          updated: true,
          chat: {
            id: room_id,
            type: 'private',
            users: await prisma.privateChatUser.findMany({
              where: { privateChatId: room_id },
              select: {
                user: { select: { id: true, name: true, image: true } },
              },
            }),
            user: (
              await prisma.privateChatUser.findFirst({
                where: {
                  privateChatId: room_id,
                  userId: { not: user.userId },
                },
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                    },
                  },
                },
              })
            )?.user,
            latestMessage: newMessage,
            unreadCount: await prisma.message.count({
              where: {
                privateChatId: room_id,
                senderId: { not: user.userId },
                seenBy: {
                  none: {
                    userId: user.userId,
                  },
                },
              },
            }),
          },
        });
      }
    })();
  },

  async close(ws) {
    const { room_id } = ws.data.query;
    if (!room_id) return;

    ws.unsubscribe(`byakuya-${room_id}`);
  },
});
