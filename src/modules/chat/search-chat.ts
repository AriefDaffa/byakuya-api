import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';
import { errorResponse, successResponse } from '../../utils/response';
import { authMid } from '../../middleware/auth-middleware';

export const searchChat = new Elysia().use(authMid).post(
  '/chat/search',
  async ({ body, set, user }) => {
    const { keyword } = body;

    console.log(user);

    if (!keyword || keyword.trim().length < 3) {
      set.status = 400;
      return errorResponse('Keyword must be at least 3 characters long', 400);
    }

    const chat = await prisma.user.findMany({
      where: {
        NOT: {
          id: user.id,
        },
        privateChats: {
          some: {
            privateChat: {
              messages: {
                some: {
                  content: { startsWith: keyword, mode: 'insensitive' },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        privateChats: {
          select: {
            privateChat: {
              select: {
                id: true,
                messages: {
                  where: {
                    content: { startsWith: keyword, mode: 'insensitive' },
                    // NOT: {
                    //   senderId: user.id,
                    // },
                  },
                  select: {
                    id: true,
                    content: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (chat.length === 0) {
      set.status = 404;
      return errorResponse('No messages found', 404);
    }

    return successResponse(
      chat.flatMap((user) =>
        user.privateChats.flatMap((chat) =>
          chat.privateChat.messages.map((message) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            messageId: message.id,
            content: message.content,
            createdAt: message.createdAt,
            roomId: chat.privateChat.id,
          }))
        )
      ),
      'Success!'
    );
  },
  {
    body: t.Object({
      keyword: t.String(),
    }),
    auth: true,
  }
);
