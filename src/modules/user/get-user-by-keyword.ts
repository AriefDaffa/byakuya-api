import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';
import { errorResponse, successResponse } from '../../utils/response';

export const getUserByKeyword = new Elysia().post(
  '/user/search',
  async ({ body, set }) => {
    const { keyword } = body;

    if (!keyword || keyword.trim().length < 3) {
      set.status = 400;
      return errorResponse('Keyword must be at least 3 characters long', 400);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { startsWith: keyword, mode: 'insensitive' } },
          { email: { startsWith: keyword, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        privateChats: true,
      },
    });

    if (users.length === 0) {
      set.status = 404;
      return errorResponse('No users found', 404);
    }

    return successResponse(users, 'Success!');
  },
  {
    body: t.Object({
      keyword: t.String(),
    }),
  }
);
