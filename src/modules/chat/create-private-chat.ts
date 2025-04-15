import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';
import { errorResponse, successResponse } from '../../utils/response';

export const createPrivateChat = new Elysia().post(
  '/private-chat',
  async ({ body, set }) => {
    const { sender_id, receiver_id } = body;

    const findRoom = await prisma.privateChat.findFirst({
      where: {
        users: {
          some: { userId: sender_id },
        },
        AND: {
          users: {
            some: { userId: receiver_id },
          },
        },
      },
    });

    if (findRoom) {
      set.status = 409;
      // return errorResponse('Room already created', 409);
      return {
        success: true,
        statusCode: 409,
        message: 'Room already created',
        data: {
          id: findRoom.id,
        },
      };
    }

    // Step 1: Create the chat room without users
    const room = await prisma.privateChat.create({
      data: {},
    });

    // Step 2: Add users to the room one by one
    await prisma.privateChatUser.createMany({
      data: [
        { userId: sender_id, privateChatId: room.id },
        { userId: receiver_id, privateChatId: room.id },
      ],
      skipDuplicates: true, // avoids crash if somehow already exists
    });

    return successResponse(room, 'Success create room');
  },
  {
    body: t.Object({
      sender_id: t.String(),
      receiver_id: t.String(),
    }),
  }
);
