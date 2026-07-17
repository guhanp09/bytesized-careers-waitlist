import { test, expect, type Locator, type Page } from '@playwright/test';
import { SUCCESS_HEADLINES } from '../../src/lib/copy/flow-copy';

function uniqueEmail(tag: string): string {
  return `e2e.${tag}.${Date.now()}@example.com`;
}

async function fillFirstStep(page: Page, email: string, name = 'Taylor Morgan') {
  await page.fill('#full-name', name);
  await page.fill('#email', email);
}

async function readDevCode(page: Page): Promise<string> {
  await page.getByText(/Your test code is/).waitFor({ timeout: 15000 });
  const txt = await page.getByText(/Your test code is/).innerText();
  const m = txt.match(/(\d{6})/);
  if (!m) throw new Error('dev code not found');
  return m[1]!;
}

async function expectInViewport(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect
    .poll(async () =>
      locator.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      }),
    )
    .toBe(true);
}

test('completes the full v2 flow with mock email and validated phone capture', async ({ page }) => {
  await page.goto('/early-access');
  await fillFirstStep(page, uniqueEmail('full'), 'Asha Kapoor');
  await page.click('button[type="submit"]');

  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work are you looking for/ }).waitFor();
  await page.getByRole('checkbox', { name: 'Video editing', exact: true }).click();
  // Section-specific "Other" (only the expanded first group's Other is in the DOM).
  await page.getByRole('checkbox', { name: 'Other', exact: true }).click();
  await page.fill('#other-job-creative_production', 'Set design');
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Email verification (dev code).
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.fill('#verify-code', await readDevCode(page));

  // Context — just continue.
  await page.getByRole('heading', { name: /A little about how you work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Phone — channel choices stay hidden until the number is valid and start unchecked.
  await page.getByRole('heading', { name: /Add a phone contact/ }).waitFor();
  await expect(page.getByRole('checkbox', { name: 'WhatsApp' })).toHaveCount(0);
  await page.selectOption('#country', 'GB');
  // A malformed number is rejected with a clear validation error…
  await page.fill('#phone', '123');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#phone-error')).toBeVisible();
  // …then a plausible one is normalized and saved — validate + save, never verify.
  await page.fill('#phone', '7400123456');
  await expect(page.getByRole('group', { name: 'How may we reach you?' })).toBeVisible();
  const whatsapp = page.getByRole('checkbox', { name: 'WhatsApp' });
  const sms = page.getByRole('checkbox', { name: 'SMS' });
  const calls = page.getByRole('checkbox', { name: 'Phone calls' });
  await expect(whatsapp).not.toBeChecked();
  await expect(sms).not.toBeChecked();
  await expect(calls).not.toBeChecked();
  await whatsapp.check();
  await calls.check();
  await expect(sms).not.toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // No OTP challenge exists: the flow moves straight to the final note.
  await expect(page.getByRole('heading', { name: 'Verify your number' })).toHaveCount(0);
  await expect(page.getByText(/We sent a code|code sent/i)).toHaveCount(0);

  // Final note — leave empty, finish.
  await page.getByRole('heading', { name: /genuinely useful to you/ }).waitFor();
  await page.getByRole('button', { name: 'Finish' }).click();

  await expect(
    page.getByRole('heading', { name: SUCCESS_HEADLINES.seeker }),
  ).toBeVisible();
});

test('invalid email shows an error and does not advance', async ({ page }) => {
  await page.goto('/early-access');
  await fillFirstStep(page, 'not-an-email');
  await page.click('button[type="submit"]');
  await expect(page.locator('#email-error')).toBeVisible();
  await expect(page.locator('#email')).toBeVisible();
});

test('skipping email verification keeps the flow moving (lead already saved)', async ({ page }) => {
  await page.goto('/early-access');
  await fillFirstStep(page, uniqueEmail('skip'));
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.getByRole('button', { name: /continue for now/i }).click();
  // Advances to context — the saved lead is untouched.
  await expect(page.getByRole('heading', { name: /A little about how you work/ })).toBeVisible();
});

test('resumes after reload with a masked email', async ({ page }) => {
  await page.goto('/early-access');
  await fillFirstStep(page, uniqueEmail('resume'), 'Rina Das');
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();

  await page.goto('/early-access');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: /What kind of work/ })).toBeVisible();
});

test('root never auto-resumes but its CTA restores existing early-access progress', async ({ page }) => {
  await page.goto('/early-access');
  await fillFirstStep(page, uniqueEmail('root-resume'), 'Rina Das');
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toHaveCount(0);
  await expect(page.locator('[data-waitlist-card]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Join early access' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: /What kind of work/ })).toBeVisible();
});

test('resume restores the saved phone and independent channel choices for editing', async ({ page }) => {
  await page.goto('/early-access');
  await fillFirstStep(page, uniqueEmail('phone-resume'), 'Rina Das');
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.getByRole('button', { name: /continue for now/i }).click();
  await page.getByRole('heading', { name: /A little about how you work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.selectOption('#country', 'IN');
  await page.fill('#phone', '9900000001');
  await page.getByRole('checkbox', { name: 'SMS' }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: /genuinely useful/ }).waitFor();

  await page.goto('/early-access');
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: /genuinely useful/ }).waitFor();
  await page.getByRole('button', { name: /Back/ }).click();
  await page.getByRole('heading', { name: /Add a phone contact/ }).waitFor();
  await expect(page.locator('#phone')).toHaveValue('+919900000001');
  await expect(page.getByRole('checkbox', { name: 'WhatsApp' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'SMS' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Phone calls' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'WhatsApp' }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: /genuinely useful/ })).toBeVisible();
});

test('ambient background is decorative and never blocks the form', async ({ page }) => {
  await page.goto('/early-access');
  const bg = page.locator('[data-ambient-paused]');
  await expect(bg).toHaveCount(1);
  await expect(bg).toHaveAttribute('aria-hidden', 'true');
  const pointerEvents = await bg.evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(pointerEvents).toBe('none');
  // The noise layer is DOM/CSS only — the old canvas is gone for good.
  await expect(page.locator('canvas')).toHaveCount(0);
  // Form still fully usable over the background.
  await fillFirstStep(page, `e2e.bg.${Date.now()}@example.com`);
  await page.click('button[type="submit"]');
  await expect(page.getByRole('button', { name: /looking for work/ })).toBeVisible();
});

test('progress is qualitative — no numeric "X of Y" count anywhere in the flow', async ({
  page,
}) => {
  const noCount = async () => {
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/\b\d+\s+of\s+\d+\b/i);
  };
  await page.goto('/early-access');
  await noCount();
  await fillFirstStep(page, uniqueEmail('nocount'));
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).waitFor();
  await noCount();
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await noCount();
  // Qualitative progression is present instead.
  await expect(page.getByText('Your brief is taking shape').first()).toBeVisible();
});

test('reduced motion still renders and advances the flow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/early-access');
  await fillFirstStep(page, `e2e.rm.${Date.now()}@example.com`);
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const heading = page.getByRole('heading', { name: 'Confirm your email' });
  await expectInViewport(heading);
  await expect(heading).toBeFocused();
});

test('long-step navigation focuses and positions the new step without autosave scroll jumps', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto('/early-access');
  await fillFirstStep(page, uniqueEmail('position'));
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).click();
  const preferencesHeading = page.getByRole('heading', { name: /What kind of work/ });
  await preferencesHeading.waitFor();

  await page.getByRole('checkbox', { name: 'Video editing', exact: true }).click();
  const scrollBeforeSave = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(700);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBeforeSave)).toBeLessThan(3);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const verifyHeading = page.getByRole('heading', { name: 'Confirm your email' });
  await expectInViewport(verifyHeading);
  await expect(verifyHeading).toBeFocused();
  await expectInViewport(page.locator('#verify-code'));
  const disabledVerify = page.getByRole('button', { name: 'Verify', exact: true });
  await expect(disabledVerify).toBeDisabled();
  expect(await disabledVerify.evaluate((element) => getComputedStyle(element).cursor)).toBe(
    'not-allowed',
  );

  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expectInViewport(preferencesHeading);
  await expect(preferencesHeading).toBeFocused();
});

test('semantic controls expose coherent desktop cursor affordances', async ({ page }) => {
  await page.goto('/early-access');
  const email = page.locator('#email');
  const fullName = page.locator('#full-name');
  const submit = page.getByRole('button', { name: 'Get early access' });
  const privacy = page.getByRole('link', { name: 'Privacy' }).first();
  const emailLabel = page.locator('label[for="email"]');
  expect(await email.evaluate((element) => getComputedStyle(element).cursor)).toBe('text');
  expect(await fullName.evaluate((element) => getComputedStyle(element).cursor)).toBe('text');
  expect(await submit.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
  expect(await privacy.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
  expect(await emailLabel.evaluate((element) => getComputedStyle(element).cursor)).toBe(
    'default',
  );

  await fullName.fill('Taylor Morgan');
  await email.fill(uniqueEmail('cursor'));
  await submit.click();
  const role = page.getByRole('button', { name: /looking for work/ });
  expect(await role.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
  await role.click();
  const chip = page.getByRole('checkbox', { name: 'Video editing', exact: true });
  await chip.waitFor();
  expect(await chip.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
  const accordion = page.getByRole('button', { name: /Strategy & growth/ });
  expect(await accordion.evaluate((element) => getComputedStyle(element).cursor)).toBe(
    'pointer',
  );
});
