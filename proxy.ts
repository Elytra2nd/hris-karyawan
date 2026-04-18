import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isLoginPage = path === '/login';

  if (isLoginPage) {
    return NextResponse.next();
  }

  const ADMIN_ONLY_PATHS = [
    '/karyawan/tambah',
    '/admin/audit-log',
    '/admin/users'
  ];

  const isAdminPath = ADMIN_ONLY_PATHS.some(p => path.startsWith(p)) || path.includes('/edit');

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAdminPath && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|api|_next/static|_next/image|favicon.ico).*)',
  ],
};