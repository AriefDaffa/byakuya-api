import { Elysia } from 'elysia';
import { prisma } from '../../lib/prisma';
import { successResponse } from '../../utils/response';
import { authMid } from '../../middleware/auth-middleware';

export const getChatList = new Elysia().use(authMid).get(
  '/chat-list',

  async ({ user }) => {
    const pc = await prisma.privateChatUser.findMany({
      where: {
        userId: user.id,
      },
      include: {
        privateChat: {
          include: {
            users: {
              include: {
                user: true,
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const formatChatList = pc.map((item) => {
      const sender = item.privateChat.users.find((el) => el.userId !== user.id);

      return {
        id: sender?.user.id,
        name: sender?.user.name,
        email: sender?.user.email,
        image: sender?.user.image,
        latestMessage: {
          id: item.privateChat?.messages[0]?.id,
          content: item.privateChat.messages[0]?.content,
          createdAt: item.privateChat.messages[0]?.createdAt,
        },
      };
    });

    return successResponse(formatChatList, 'Successfully get chat List');
  },
  { auth: true }
);
