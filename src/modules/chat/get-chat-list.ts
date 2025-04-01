import { Elysia } from 'elysia';
import { prisma } from '../../lib/prisma';
import { successResponse } from '../../utils/response';

export const getChatList = new Elysia().get('/chat-list', async ({ query }) => {
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
          seenBy: { none: { userId: user_id } },
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

  return successResponse(formattedPrivateChats, 'Successfully get chat List');
});
