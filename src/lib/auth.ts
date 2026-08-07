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
    refreshAt?: number;
  }
}

// ─── Rate limiter login (brute-force protection) ──────────────────────────────
// In-memory, single-instance. Untuk multi-instance/serverless ganti ke Redis.
// Dijalankan di authorize() - bukan di proxy - karena matcher meng-exclude api/auth.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 menit

// Hash dummy untuk menyamakan waktu respons saat user tidak ditemukan
// (mencegah username enumeration lewat timing). Cost harus sama dengan hash asli (10).
const DUMMY_HASH = '$2b$10$BnSdWgUm7hhVo8/iQOgXHeZPyd61By8e0Bi2KPGpNhSqVkHQRqdw2';

// Interval refresh role dari DB pada JWT (agar perubahan/penghapusan role
// oleh admin berlaku tanpa menunggu sesi 8 jam habis).
const ROLE_REFRESH_MS = 5 * 60 * 1000; // 5 menit

function checkLoginRateLimit(key: string): boolean {
  const now = Date.now();

  // Key `user:<username>` berasal dari input penyerang: tanpa pembersihan, username
  // acak tanpa batas = entry tanpa batas. Sapu yang kedaluwarsa saat map membesar.
  // ponytail: sapuan O(n) saat ambang terlampaui; ganti timer/LRU kalau instance
  // ini nanti melayani trafik login jauh lebih besar.
  if (loginAttempts.size > 1000) {
    for (const [k, v] of loginAttempts) {
      if (now > v.resetAt) loginAttempts.delete(k);
    }
  }

  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (entry.count >= LOGIN_LIMIT) return false;
  entry.count++;
  return true;
}

// Tanpa secret, NextAuth diam-diam jatuh ke fallback dan seluruh JWT jadi tak
// tepercaya. Lebih baik app menolak start daripada jalan dengan sesi rapuh —
// gampang kelewat saat mengisi environment di cPanel.
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET wajib diisi di produksi - set di environment cPanel');
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

        if (!credentials?.username || !credentials?.password) return null;

        // Rate limit per-IP DAN per-username. Per-username menutup celah
        // spoofing x-forwarded-for (attacker ganti IP tiap request).
        const ipOk = checkLoginRateLimit(`ip:${ip}`);
        const userOk = checkLoginRateLimit(`user:${credentials.username.toLowerCase()}`);
        if (!ipOk || !userOk) {
          logger.warn('Login blocked: rate limit exceeded', { ip });
          throw new Error('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.');
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        // Selalu jalankan bcrypt.compare (pakai dummy hash bila user tak ada)
        // agar waktu respons seragam - mencegah username enumeration via timing.
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user?.password ?? DUMMY_HASH
        );

        if (!user) {
          logger.warn('Login attempt: user not found', { username: credentials.username });
          return null;
        }

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
      // Saat login pertama: isi token dari user + set jadwal refresh.
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.refreshAt = Date.now() + ROLE_REFRESH_MS;
        return token;
      }

      // Refresh berkala: ambil ulang role dari DB agar perubahan admin
      // (promosi/demosi/hapus akun) berlaku tanpa menunggu sesi habis.
      const refreshAt = (token.refreshAt as number | undefined) ?? 0;
      if (Date.now() > refreshAt && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, username: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.username = dbUser.username;
          } else {
            // Akun sudah dihapus - lucuti role sehingga semua guard menolak.
            token.role = '__deleted__';
          }
        } catch {
          // DB error saat refresh - pertahankan token lama, coba lagi nanti.
        }
        token.refreshAt = Date.now() + ROLE_REFRESH_MS;
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