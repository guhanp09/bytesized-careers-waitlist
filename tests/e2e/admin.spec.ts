import { test, expect } from '@playwright/test';

test('unauthenticated admin dashboard redirects to login', async ({ page, request }) => {
  // Next 16's development launcher briefly rebinds its port after Playwright's initial
  // readiness probe. Wait for the child server rather than making the first page visit flaky.
  await expect.poll(async () => {
    try {
      return (await request.get('/admin/login')).status();
    } catch {
      return 0;
    }
  }, { timeout: 15_000 }).toBe(200);
  await page.goto('/admin/waitlist');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(
    page.getByRole('button', { name: 'Sign in with GitHub' }),
  ).toBeVisible();
});

test('CSV export endpoint requires authentication', async ({ request }) => {
  const response = await request.get('/api/admin/waitlist/export');
  expect(response.status()).toBe(401);
});
