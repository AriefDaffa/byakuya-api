import { Elysia, t } from 'elysia';
import { prisma } from '../../lib/prisma';

export const chatController = new Elysia().get(
  '/chat-list',
  async ({ query }) => {
    const { user_id } = query;

    const [privateChats, groupChats] = await Promise.all([
      prisma.privateChat.findMany({
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
            select: { id: true, content: true, createdAt: true },
          },
        },
      }),
      prisma.groupChat.findMany({
        where: { users: { some: { userId: user_id } } },
        select: {
          id: true,
          name: true,
          users: {
            select: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, content: true, createdAt: true },
          },
        },
      }),
    ]);

    const formattedPrivateChats = privateChats.map((chat) => ({
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
    }));

    const formattedGroupChats = groupChats.map((chat) => ({
      id: chat.id,
      type: 'group',
      name: chat.name,
      users: chat.users.map((u) => ({
        id: u.user.id,
        name: u.user.name,
        image: u.user.image,
      })),
      latestMessage: chat.messages[0] || null,
    }));

    return [...formattedPrivateChats, ...formattedGroupChats];
  },
  {
    query: t.Object({
      user_id: t.String(),
    }),
  }
);
