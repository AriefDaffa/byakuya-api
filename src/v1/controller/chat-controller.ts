import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';

export const chatController = new Elysia()
  .get('/chat-list', async ({ query }) => {
    const { user_id } = query;

    const privateChats = await prisma.privateChat.findMany({
      where: { users: { some: { userId: user_id } } },
      include: {
        users: {
          select: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const formattedPrivateChats = await Promise.all(
      privateChats.map(async (chat) => {
        const unreadCount = await prisma.message.count({
          where: {
            privateChatId: chat.id,
            seenBy: { none: { userId: user_id } }, // Only count unread messages
          },
        });

        return {
          id: chat.id,
          type: 'private',
          users: chat.users
            .filter((u) => u.user.id !== user_id)
            .map((u) => ({
              id: u.user.id,
              name: u.user.name,
              image: u.user.image,
            })),
          latestMessage: chat.messages[0] || null,
          unreadCount,
        };
      })
    );

    return formattedPrivateChats;
  })
  .get(
    '/private-chat',
    async ({ query }) => {
      const { room_id, page = '1', limit = '15' } = query;

      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);

      if (
        isNaN(pageNumber) ||
        isNaN(pageSize) ||
        pageNumber < 1 ||
        pageSize < 1
      ) {
        return { success: false, error: 'Invalid page or limit' };
      }

      const receiver = await prisma.privateChatUser.findMany({
        include: {
          user: true,
        },
      });

      const messages = await prisma.message.findMany({
        where: { privateChatId: room_id },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
        include: {
          seenBy: {
            select: {
              userId: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      });

      const totalMessages = await prisma.message.count({
        where: { privateChatId: room_id },
      });

      return {
        success: true,
        receiver,
        messages,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalMessages / pageSize),
          totalMessages,
        },
      };
    },
    {
      query: t.Object({
        room_id: t.String(),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  .post('/private-chat', async () => {}, {
    body: t.Object({}),
  });
