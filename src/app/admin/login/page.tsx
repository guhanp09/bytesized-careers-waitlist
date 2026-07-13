import { auth, isAllowedAdmin, signIn } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function AdminLoginPage() {
  const session = await auth();
  if (isAllowedAdmin(session)) {
    redirect('/admin/waitlist');
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium tracking-widest text-muted uppercase">
        ByteSized Careers
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
        Admin access
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sign in with an authorised GitHub account to view the waitlist.
      </p>

      <form
        className="mt-8 w-full"
        action={async () => {
          'use server';
          await signIn('github', { redirectTo: '/admin/waitlist' });
        }}
      >
        <Button type="submit" size="lg" className="w-full">
          Sign in with GitHub
        </Button>
      </form>
    </main>
  );
}
