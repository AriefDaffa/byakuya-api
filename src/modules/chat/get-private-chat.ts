import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';
import { errorResponse, successResponse } from '../../utils/response';
import { authMid } from '../../middleware/auth-middleware';

export const getPrivateChat = new Elysia().use(authMid).get(
  '/private-chat',
  async ({ query, user }) => {
    const { room_id, page = '1', limit = '15' } = query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    if (
      isNaN(pageNumber) ||
      isNaN(pageSize) ||
      pageNumber < 1 ||
      pageSize < 1
    ) {
      return errorResponse('Invalid page or limit');
    }

    const receiver = await prisma.privateChatUser.findMany({
      where: {
        privateChatId: room_id,
      },
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

    return successResponse(
      {
        receiver,
        messages,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalMessages / pageSize),
          totalMessages,
        },
      },
      'Get private chat success'
    );
  },
  {
    query: t.Object({
      room_id: t.String(),
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    }),
    auth: true,
  }
);
