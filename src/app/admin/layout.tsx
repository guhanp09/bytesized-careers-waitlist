import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin · ByteSized Careers',
  robots: { index: false, follow: false },
};

// Shell only. The auth + allowlist gate lives on each protected page (waitlist), so the
// public /admin/login page can still render for unauthenticated visitors without a loop.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-canvas">{children}</div>;
}
