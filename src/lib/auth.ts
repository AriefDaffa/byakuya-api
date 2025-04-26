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
      domain: '.ariefdaffa.dev',
    },
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
      partitioned: true,
    },
  },
  trustedOrigins: ['https://ariefdaffa.dev', 'https://byakuya.ariefdaffa.dev'],
  session: {
    expiresIn: 60 * 60 * 24 * 1, // 1 days
  },
});
