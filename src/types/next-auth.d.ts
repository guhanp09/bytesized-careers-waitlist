import type { DefaultSession } from 'next-auth';

// Carry the GitHub `login` (username) through the session + JWT so the admin allowlist
// can be re-checked server-side (plan §15).
declare module 'next-auth' {
  interface Session {
    user?: {
      login?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    login?: string;
  }
}
