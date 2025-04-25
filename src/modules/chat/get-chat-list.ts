import { Elysia } from 'elysia';
import { prisma } from '../../lib/prisma';
import { successResponse } from '../../utils/response';
import { authMid } from '../../middleware/auth-middleware';

export const getChatList = new Elysia().use(authMid).get(
  '/chat-list',
  async ({ query }) => {
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

    const formattedPrivateChats = (
      await Promise.all(
        privateChats.map(async (chat) => {
          const unreadCount = await prisma.message.count({
            where: {
              privateChatId: chat.id,
              senderId: { not: user_id },
              seenBy: {
                none: {
                  userId: user_id,
                },
              },
            },
          });

          const otherUser = chat.users.find((u) => u.user.id !== user_id);
          if (!otherUser) return null;

          return {
            id: chat.id,
            type: 'private',
            user: {
              id: otherUser.user.id,
              name: otherUser.user.name,
              image: otherUser.user.image,
            },
            latestMessage: chat.messages[0] || null,
            unreadCount,
          };
        })
      )
    ).filter(Boolean);

    return successResponse(formattedPrivateChats, 'Successfully get chat List');
  },
  { auth: true }
);
