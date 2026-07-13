import { auth } from '@/lib/auth/config';

/**
 * Protect /admin/* (plan §15). Unauthenticated requests are redirected to the login page.
 * The admin layout independently re-checks the session + allowlist as defense in depth.
 */
export default auth((req) => {
  const { pathname, origin } = req.nextUrl;
  const isLogin = pathname === '/admin/login';
  if (pathname.startsWith('/admin') && !isLogin && !req.auth) {
    return Response.redirect(new URL('/admin/login', origin));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
