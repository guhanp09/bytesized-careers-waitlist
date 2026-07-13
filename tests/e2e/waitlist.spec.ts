import { test, expect } from '@playwright/test';

function uniqueEmail(tag: string): string {
  return `e2e.${tag}.${Date.now()}@example.com`;
}

test('completes the full flow to the success screen (seeker, skip phone)', async ({
  page,
}) => {
  await page.goto('/');
  await page.fill('#email', uniqueEmail('happy'));
  await page.click('button[type="submit"]');

  await page.getByRole('button', { name: /looking for work/ }).click();
  await page
    .getByRole('heading', {
      name: 'What kind of opportunities would you like to hear about?',
    })
    .waitFor();
  await page.getByRole('checkbox', { name: 'Content strategy', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByRole('heading', { name: 'Want priority alerts on WhatsApp?' }).waitFor();
  await page.getByRole('button', { name: 'Skip for now' }).click();

  await expect(
    page.getByText("We'll let you know when relevant creator-economy roles open up."),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
});

test('invalid email shows an error and does not advance', async ({ page }) => {
  await page.goto('/');
  await page.fill('#email', 'not-an-email');
  await page.click('button[type="submit"]');
  await expect(page.locator('#email-error')).toBeVisible();
  await expect(page.locator('#email')).toBeVisible();
});

test('resumes after reload with a masked email', async ({ page }) => {
  await page.goto('/');
  await page.fill('#email', uniqueEmail('resume'));
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page
    .getByRole('heading', {
      name: 'What kind of opportunities would you like to hear about?',
    })
    .waitFor();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByText(/\*+@example\.com/)).toBeVisible();

  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'What kind of opportunities would you like to hear about?',
    }),
  ).toBeVisible();
});
