import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { env } from '@/lib/env';

/**
 * Admin authentication (plan §15) — Auth.js v5 with GitHub OAuth, restricted to an
 * allowlist of GitHub usernames (ADMIN_ALLOWED_GITHUB_LOGINS). JWT sessions (no DB
 * adapter) keep the middleware edge-compatible. The GitHub `login` is carried into the
 * session so the admin layout can independently re-check the allowlist (defense in depth).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [GitHub],
  pages: { signIn: '/admin/login' },
  callbacks: {
    signIn({ profile }) {
      const login =
        typeof profile?.login === 'string' ? profile.login.toLowerCase() : '';
      if (!login) return false;
      return env.adminAllowedGithubLogins.includes(login);
    },
    jwt({ token, profile }) {
      if (typeof profile?.login === 'string') {
        token.login = profile.login.toLowerCase();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.login === 'string') {
        (session.user as { login?: string }).login = token.login;
      }
      return session;
    },
  },
});

/** Whether a session belongs to an allowlisted admin. */
export function isAllowedAdmin(session: {
  user?: { login?: string } | null;
} | null): boolean {
  const login = session?.user?.login?.toLowerCase();
  return !!login && env.adminAllowedGithubLogins.includes(login);
}
