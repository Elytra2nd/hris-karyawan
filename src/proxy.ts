import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  // Tentukan rute mana saja yang ingin dilindungi. 
  // Rute login dan rute API akan diabaikan oleh middleware ini.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};