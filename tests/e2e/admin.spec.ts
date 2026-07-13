import { test, expect } from '@playwright/test';

test('unauthenticated admin dashboard redirects to login', async ({ page }) => {
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
