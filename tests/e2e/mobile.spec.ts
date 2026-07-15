import { test, expect, devices } from '@playwright/test';

// Representative small-phone viewports (incl. the narrowest common width).
const VIEWPORTS = [
  { name: 'iPhone SE 320', width: 320, height: 568 },
  { name: 'Android 360', width: 360, height: 800 },
  { name: 'iPhone 12/13 390', width: 390, height: 844 },
  { name: 'Pixel 412', width: 412, height: 915 },
  { name: 'Large phone 430', width: 430, height: 932 },
];

test.use({ ...devices['Pixel 5'] });

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow through role + interests @ ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');

    const overflows = async () =>
      page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );

    await expect.poll(overflows).toBe(false);

    await page.fill('#full-name', 'Taylor Morgan');
    await page.fill('#email', `e2e.m.${vp.width}.${Date.now()}@example.com`);
    await page.click('button[type="submit"]');
    await page.getByRole('button', { name: /looking for work/ }).click();
    await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
    // Expand a dense group and confirm still no horizontal overflow.
    await page.getByRole('button', { name: /Strategy & growth/ }).click();
    await page.waitForTimeout(300);
    await expect.poll(overflows).toBe(false);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    const heading = page.getByRole('heading', { name: 'Confirm your email' });
    await expect(heading).toBeVisible();
    await expect
      .poll(() =>
        heading.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight;
        }),
      )
      .toBe(true);
    await expect(heading).toBeFocused();
    await expect
      .poll(() =>
        page.locator('#verify-code').evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.top < window.innerHeight;
        }),
      )
      .toBe(true);
    await expect.poll(overflows).toBe(false);
  });
}
