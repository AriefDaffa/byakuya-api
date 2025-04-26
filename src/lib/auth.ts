import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  advanced: {
    cookiePrefix: 'byakuya-cookies',
    defaultCookieAttributes: {
      domain: process.env.BYAKUYA_API_COOKIE_DOMAIN,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 1, // 1 days
  },
});
