import { Elysia } from 'elysia';
import { prisma } from '../../lib/prisma';
import { successResponse } from '../../utils/response';
import { authMid } from '../../middleware/auth-middleware';

export const getChatList = new Elysia().use(authMid).get(
  '/chat-list',

  async ({ user }) => {
    // const pc = await prisma.privateChat.findMany({
    //   include: {
    //     users: {
    //       where: {
    //         userId: user.id,
    //       },
    //       include: {
    //         user: true,
    //       },
    //     },
    //     messages: {
    //       orderBy: { createdAt: 'desc' },
    //       take: 1,
    //     },
    //   },
    // });

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
    // const privateChats = await prisma.privateChat.findMany({
    //   where: { users: { some: { userId: user.id } } },
    //   include: {
    //     users: {
    //       select: {
    //         user: {
    //           select: { id: true, name: true, image: true, email: true },
    //         },
    //       },
    //     },
    //     messages: {
    //       orderBy: { createdAt: 'desc' },
    //       take: 1,
    //     },
    //   },
    // });

    // const formattedPrivateChats = (
    //   await Promise.all(
    //     privateChats.map(async (chat) => {
    //       const unreadCount = await prisma.message.count({
    //         where: {
    //           privateChatId: chat.id,
    //           senderId: { not: user.id },
    //           seenBy: {
    //             none: {
    //               userId: user.id,
    //             },
    //           },
    //         },
    //       });

    //       const otherUser = chat.users.find((u) => u.user.id !== user.id);
    //       if (!otherUser) return null;

    //       return {
    //         id: chat.id,
    //         type: 'private',
    //         user: {
    //           id: otherUser.user.id,
    //           name: otherUser.user.name,
    //           image: otherUser.user.image,
    //           email: otherUser.user.email,
    //         },
    //         latestMessage: chat.messages[0] || null,
    //         unreadCount,
    //       };
    //     })
    //   )
    // ).filter(Boolean);

    // return successResponse(formattedPrivateChats, 'Successfully get chat List');
  },
  { auth: true }
);
