import { auth } from '@/lib/auth/config';
import { isLocalPreviewRequest } from '@/lib/auth/local-preview-shared';

/**
 * Protect /admin/* (plan §15). Unauthenticated requests are redirected to the login page.
 * The admin layout independently re-checks the session + allowlist as defense in depth.
 */
export default auth((req) => {
  const { pathname, origin } = req.nextUrl;
  const isLogin = pathname === '/admin/login';
  const preview = isLocalPreviewRequest({
    enabled: process.env.ADMIN_LOCAL_PREVIEW_ENABLED === 'true' || process.env.ADMIN_LOCAL_PREVIEW_ENABLED === '1',
    nodeEnv: process.env.NODE_ENV === 'production' ? 'production' : process.env.NODE_ENV === 'test' ? 'test' : 'development',
    host: req.headers.get('host'),
  });
  if (pathname.startsWith('/admin') && !isLogin && !req.auth && !preview) {
    return Response.redirect(new URL('/admin/login', origin));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
