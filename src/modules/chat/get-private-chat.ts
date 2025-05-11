import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';
import { errorResponse, successResponse } from '../../utils/response';
import { authMid } from '../../middleware/auth-middleware';

export const getPrivateChat = new Elysia().use(authMid).get(
  '/private-chat',
  async ({ query, user, set }) => {
    const { receiver, page = '1', limit = '15' } = query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    if (
      isNaN(pageNumber) ||
      isNaN(pageSize) ||
      pageNumber < 1 ||
      pageSize < 1
    ) {
      set.status = 400;
      return errorResponse('Invalid page or limit', 400);
    }

    if (user.id === receiver) {
      set.status = 400;
      return errorResponse('Cant query the same user', 400);
    }

    const room = await prisma.privateChat.findFirst({
      where: {
        users: {
          some: { userId: user.id },
        },
        AND: {
          users: {
            some: { userId: receiver },
          },
        },
      },
    });

    if (!room) {
      return successResponse({
        currentPage: 1,
        totalPages: 1,
        totalMessages: 0,
        messages: [],
      });
    }

    const msg = await prisma.message.findMany({
      where: {
        privateChatId: room?.id,
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (pageNumber - 1) * pageSize,
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

    return successResponse({
      currentPage: 1,
      totalPages: 1,
      totalMessages: 0,
      messages: msg.map((item) => {
        console.log(item);
        const senderData = item.privateChat?.users.find(
          (el) => el.user.id === item.senderId
        );
        const receiverData = item.privateChat?.users.find(
          (el) => el.user.id !== item.senderId
        );

        return {
          id: item.id,
          content: item.content,
          createdAt: item.createdAt,
          privateChatId: item.privateChatId,
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
        };
      }),
    });

    // const receiver = await prisma.privateChatUser.findMany({
    //   where: {
    //     privateChatId: room_id,
    //   },
    //   include: {
    //     user: true,
    //   },
    // });

    // const messages = await prisma.message.findMany({
    //   where: { privateChatId: room_id },
    //   orderBy: { createdAt: 'desc' },
    //   take: pageSize,
    //   skip: (pageNumber - 1) * pageSize,
    //   include: {
    //     seenBy: {
    //       select: {
    //         userId: true,
    //         user: { select: { id: true, name: true } },
    //       },
    //     },
    //   },
    // });

    // const totalMessages = await prisma.message.count({
    //   where: { privateChatId: room_id },
    // });

    // return successResponse(
    //   {
    //     receiver,
    //     messages,
    //     pagination: {
    //       currentPage: pageNumber,
    //       totalPages: Math.ceil(totalMessages / pageSize),
    //       totalMessages,
    //     },
    //   },
    //   'Get private chat success'
    // );
  },
  {
    query: t.Object({
      // room_id: t.String(),
      receiver: t.String(),
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    }),
    auth: true,
  }
);
