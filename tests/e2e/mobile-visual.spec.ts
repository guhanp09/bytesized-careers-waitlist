import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { test, expect, devices, type Page } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

const outputRoot = 'artifacts/mobile-audit/after';

async function shot(page: Page, name: string, fullPage = false) {
  const path = `${outputRoot}/${name}.png`;
  mkdirSync(dirname(path), { recursive: true });
  await page.waitForTimeout(500);
  // The local Next.js development badge is test chrome, not part of the application.
  await page.locator('nextjs-portal').evaluateAll((portals) => {
    for (const portal of portals) (portal as HTMLElement).style.display = 'none';
  });
  await page.screenshot({ path, fullPage });
}

async function readDevCode(page: Page): Promise<string> {
  const text = await page.getByText(/Your test code is/).innerText();
  const code = text.match(/(\d{6})/)?.[1];
  if (!code) throw new Error('Local verification code was not rendered.');
  return code;
}

test('capture the mobile release-review evidence set', async ({ page, context }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/early-access');
    await page.locator('[data-waitlist-card]').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        window.scrollTo({ top: window.scrollY + rect.top - 16, behavior: 'auto' });
      }
    });
    await shot(page, `opening-${viewport.width}x${viewport.height}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/early-access');
  await page.fill('#full-name', 'Mobile Visual Audit');
  await page.fill('#email', `e2e.mobile.visual.${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Get early access' }).click();
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await page.getByRole('button', { name: /Strategy & growth/ }).click();
  await shot(page, 'long-preference-390x844', true);

  const pill = page.locator('[data-brief-pill]');
  await pill.click();
  await expect(page.locator('[data-brief-sheet]')).toBeVisible();
  await shot(page, 'brief-open-390x844');
  await page.locator('[data-brief-sheet]').getByRole('button', { name: /close/i }).click();

  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.getByText(/Your test code is/).waitFor();
  await shot(page, 'email-verification-390x844');
  await page.fill('#verify-code', await readDevCode(page));

  await page.getByRole('heading', { name: /A little about how you work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: /Add a phone contact/ }).waitFor();
  await shot(page, 'phone-390x844');
  await page.fill('#phone', '123');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#phone-error')).toBeVisible();
  await page.selectOption('#country', 'IN');
  await page.fill('#phone', '9900000001');
  await expect(page.getByRole('checkbox', { name: 'WhatsApp' })).toBeVisible();
  await shot(page, 'phone-consent-390x844');
  await page.fill('#phone', '');
  await expect(page.getByRole('checkbox', { name: 'WhatsApp' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByRole('heading', { name: /genuinely useful/ }).waitFor();
  await page.fill('#note', 'A mobile-friendly brief that stays useful without getting in the way.');
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.getByRole('heading', { name: /You’re in/ }).waitFor();
  await shot(page, 'success-390x844');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('button', { name: /Link copied/ })).toBeVisible();

  const interlude = page.getByRole('heading', { name: 'Two briefs, one table.' });
  await interlude.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top - 64, behavior: 'auto' });
  });
  await shot(page, 'two-briefs-one-table-390x844');
  await expect(page.getByRole('link', { name: 'Privacy' }).last()).toHaveAttribute('href', '/early-access/privacy');
  await expect(page.getByRole('link', { name: 'Terms' }).last()).toHaveAttribute('href', '/early-access/terms');
});
