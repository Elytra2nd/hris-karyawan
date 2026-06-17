import { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

// Memperluas tipe session NextAuth agar mengenali properti 'role' dan 'username'
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
    } & DefaultSession["user"]
  }

  interface User {
    role: string;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    username: string;
  }
}

// ─── Rate limiter login (brute-force protection) ──────────────────────────────
// In-memory, single-instance. Untuk multi-instance/serverless ganti ke Redis.
// Dijalankan di authorize() - bukan di proxy - karena matcher meng-exclude api/auth.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 menit

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (entry.count >= LOGIN_LIMIT) return false;
  entry.count++;
  return true;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const ip =
          (req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
          'unknown';
        if (!checkLoginRateLimit(ip)) {
          logger.warn('Login blocked: rate limit exceeded', { ip });
          throw new Error('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.');
        }

        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          logger.warn('Login attempt: user not found', { username: credentials.username });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          logger.warn('Login attempt: wrong password', { username: credentials.username });
          return null;
        }

        logger.info('Login success', { username: user.username, role: user.role });
        return {
          id: user.id,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 jam - lebih aman untuk sistem HR
  },
  pages: { 
    signIn: '/login' 
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Secure cookies hanya di production (HTTPS). Di dev (http://localhost) harus false.
  useSecureCookies: process.env.NODE_ENV === 'production',
};