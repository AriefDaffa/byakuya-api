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
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.BYAKUYA_API_COOKIE_DOMAIN,
    },
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
      partitioned: true,
    },
  },
  trustedOrigins: [
    process.env.BYAKUYA_API_TRUSTED_ORIGIN_1 || '',
    process.env.BYAKUYA_API_TRUSTED_ORIGIN_2 || '',
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 1, // 1 days
  },
});
