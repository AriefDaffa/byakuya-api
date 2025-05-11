import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';
import { authMid } from '../../middleware/auth-middleware';
import { app } from '../..';

// async function markMessagesAsRead(chatId: string, userId: string) {
//   await prisma.seenMessage.createMany({
//     data: await prisma.message
//       .findMany({
//         where: {
//           privateChatId: chatId,
//           seenBy: { none: { userId } },
//         },
//         select: { id: true },
//       })
//       .then((messages) =>
//         messages.map((msg) => ({
//           userId,
//           messageId: msg.id,
//         }))
//       ),
//     skipDuplicates: true,
//   });
// }

export const socketGetPC = new Elysia()
  .use(authMid)
  .state('room_id', '')
  .ws('/personal-chat', {
    body: t.Object({
      message: t.String(),
    }),
    query: t.Object({
      receiver: t.String(),
    }),
    auth: true,

    async beforeHandle({ query, status, user }) {
      const { receiver } = query;

      const findUserID = await prisma.privateChatUser.findFirst({
        where: {
          userId: receiver,
        },
      });

      if (!findUserID || user.id === receiver) {
        return status(400);
      }
    },

    async open(ws) {
      const { receiver } = ws.data.query;
      const { id, name } = ws.data.user;

      const findRoom = await prisma.privateChat.findFirst({
        where: {
          users: {
            some: { userId: id },
          },
          AND: {
            users: {
              some: { userId: receiver },
            },
          },
        },
      });

      if (findRoom) {
        ws.data.store = {
          room_id: findRoom.id,
        };
      } else {
        const room = await prisma.privateChat.create({
          data: {},
        });

        await prisma.privateChatUser.createMany({
          data: [
            { userId: id, privateChatId: room.id },
            { userId: receiver, privateChatId: room.id },
          ],
          skipDuplicates: true,
        });

        ws.data.store = {
          room_id: room.id,
        };
      }

      ws.send(`Subscibed to ${ws.data.store.room_id}`);
      ws.send(`Joined as ${name}`);
      ws.subscribe(`byakuya-${ws.data.store.room_id}`);
    },

    async message(ws, { message }) {
      const { receiver } = ws.data.query;
      const { room_id } = ws.data.store;
      const { id } = ws.data.user;

      const msg = await prisma.message.create({
        data: {
          senderId: id,
          content: message,
          privateChatId: room_id,
          seenBy: { create: [] },
        },
        include: {
          privateChat: {
            include: {
              users: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      const senderData = msg.privateChat?.users.find(
        (item) => item.userId === id
      );

      const receiverData = msg.privateChat?.users.find(
        (item) => item.userId === receiver
      );

      app.server?.publish(
        `byakuya-${room_id}`,
        JSON.stringify({
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          privateChatId: msg.privateChatId,
          sender: {
            id: senderData?.user.id,
            name: senderData?.user.name,
            email: senderData?.user.email,
            image: senderData?.user.image,
          },
          receiver: {
            id: receiverData?.user.id,
            name: receiverData?.user.name,
            email: receiverData?.user.email,
            image: receiverData?.user.image,
          },
        })
      );

      app.server?.publish(
        `byakuya-list-${receiverData?.user.id}`,
        JSON.stringify({
          id: senderData?.user.id,
          name: senderData?.user.name,
          email: senderData?.user.email,
          image: senderData?.user.image,
          latestMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
          },
        })
      );
    },

    async close(ws) {
      const { room_id } = ws.data.store;
      ws.unsubscribe(`byakuya-${room_id}`);
    },
  });
