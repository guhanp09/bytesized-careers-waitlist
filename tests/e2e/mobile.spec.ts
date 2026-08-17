import { test, expect, devices, type Locator, type Page } from '@playwright/test';

// Representative small-phone viewports (incl. the narrowest common width).
const VIEWPORTS = [
  { name: 'iPhone SE 320', width: 320, height: 568 },
  { name: 'Android short 360', width: 360, height: 640 },
  { name: 'Android 360', width: 360, height: 800 },
  { name: 'iPhone SE 375', width: 375, height: 667 },
  { name: 'iPhone 12/13 390', width: 390, height: 844 },
  { name: 'Android 393', width: 393, height: 852 },
  { name: 'Pixel 412', width: 412, height: 915 },
  { name: 'Large phone 430', width: 430, height: 932 },
];

test.use({ ...devices['Pixel 5'] });

const hasHorizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

async function expectInVisualViewport(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const viewport = window.visualViewport;
        const top = viewport?.offsetTop ?? 0;
        const bottom = top + (viewport?.height ?? window.innerHeight);
        return rect.top >= top && rect.bottom <= bottom;
      }),
    )
    .toBe(true);
}

async function reachPhoneStep(page: Page) {
  await page.goto('/early-access');
  await page.fill('#full-name', 'Phone Consent Audit');
  await page.fill('#email', `e2e.phone.consent.${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Get early access' }).click();
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.getByRole('button', { name: /continue for now/i }).click();
  await page.getByRole('heading', { name: /A little about how you work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: /Add a phone contact/ }).waitFor();
}

for (const vp of VIEWPORTS) {
  test(`mobile controls and flow stay composed @ ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/early-access');

    await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);

    const name = page.locator('#full-name');
    const email = page.locator('#email');
    const cta = page.getByRole('button', { name: 'Get early access' });
    const [nameMetrics, emailMetrics, ctaMetrics, rowDirection] = await Promise.all([
      name.evaluate((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          boxSizing: style.boxSizing,
          fontSize: Number.parseFloat(style.fontSize),
          lineHeight: style.lineHeight,
          paddingInline: `${style.paddingLeft}/${style.paddingRight}`,
          paddingBlock: `${style.paddingTop}/${style.paddingBottom}`,
          border: `${style.borderTopWidth}/${style.borderRightWidth}/${style.borderBottomWidth}/${style.borderLeftWidth}`,
          radius: style.borderRadius,
        };
      }),
      email.evaluate((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          boxSizing: style.boxSizing,
          fontSize: Number.parseFloat(style.fontSize),
          lineHeight: style.lineHeight,
          paddingInline: `${style.paddingLeft}/${style.paddingRight}`,
          paddingBlock: `${style.paddingTop}/${style.paddingBottom}`,
          border: `${style.borderTopWidth}/${style.borderRightWidth}/${style.borderBottomWidth}/${style.borderLeftWidth}`,
          radius: style.borderRadius,
        };
      }),
      cta.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
      email.evaluate((element) => getComputedStyle(element.parentElement!).flexDirection),
    ]);

    expect(nameMetrics.height).toBeGreaterThanOrEqual(48);
    expect(emailMetrics.height).toBeGreaterThanOrEqual(48);
    expect(Math.abs(nameMetrics.height - emailMetrics.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(nameMetrics.width - emailMetrics.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(emailMetrics.width - ctaMetrics.width)).toBeLessThanOrEqual(1);
    expect(ctaMetrics.height).toBeGreaterThanOrEqual(48);
    expect(emailMetrics.fontSize).toBeGreaterThanOrEqual(16);
    expect(emailMetrics).toMatchObject({
      boxSizing: nameMetrics.boxSizing,
      lineHeight: nameMetrics.lineHeight,
      paddingInline: nameMetrics.paddingInline,
      paddingBlock: nameMetrics.paddingBlock,
      border: nameMetrics.border,
      radius: nameMetrics.radius,
    });
    expect(rowDirection).toBe('column');

    const longName = 'Alexandria Morgan-Santamaría with a deliberately long creator name';
    const longEmail = `mobile.audit.${vp.width}.${Date.now()}+a-long-alias@example.com`;
    await name.fill(longName);
    await email.fill(longEmail);
    await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);

    await page.click('button[type="submit"]');
    await page.getByRole('button', { name: /looking for work/ }).click();
    await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
    // Expand a dense group and confirm still no horizontal overflow.
    await page.getByRole('button', { name: /Strategy & growth/ }).click();
    await page.waitForTimeout(300);
    await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);

    // The brief drawer: pill present, sheet opens and closes without overflow.
    const pill = page.locator('[data-brief-pill]');
    await expect(pill).toBeVisible();
    await pill.click();
    await page.waitForTimeout(350);
    await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
    await page
      .locator('[data-brief-sheet]')
      .getByRole('button', { name: /close/i })
      .click();
    await expect(page.locator('[data-brief-sheet]')).toHaveCount(0);

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
    await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
  });
}

test('validation, focus and keyboard-sized viewport never overlap the opening controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 430 });
  await page.goto('/early-access');
  await page.fill('#full-name', 'Taylor Morgan');
  await page.fill('#email', 'not-an-email');
  await page.getByRole('button', { name: 'Get early access' }).click();

  const email = page.locator('#email');
  const error = page.locator('#email-error');
  await expect(email).toBeFocused();
  await email.scrollIntoViewIfNeeded();
  await expectInVisualViewport(email);
  await expect(error).toBeVisible();
  const [fieldBox, errorBox] = await Promise.all([email.boundingBox(), error.boundingBox()]);
  expect(fieldBox && errorBox && errorBox.y >= fieldBox.y + fieldBox.height).toBe(true);
  await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
});

for (const role of ['recruiter', 'both'] as const) {
  test(`${role} mobile preference path reaches contextual questions`, async ({ page }) => {
    await page.setViewportSize({ width: role === 'recruiter' ? 360 : 393, height: 640 });
    await page.goto('/early-access');
    await page.fill('#full-name', 'Mobile Path Audit');
    await page.fill('#email', `e2e.mobile.${role}.${Date.now()}@example.com`);
    await page.getByRole('button', { name: 'Get early access' }).click();
    await page
      .getByRole('button', { name: role === 'recruiter' ? /looking to hire/ : /bit of both/ })
      .click();

    if (role === 'both') {
      await page.getByRole('heading', { name: /First — the work you love/ }).waitFor();
      await page.getByRole('checkbox', { name: 'Video editing', exact: true }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('heading', { name: /talent you want/ }).waitFor();
    } else {
      await page.getByRole('heading', { name: /What kind of talent/ }).waitFor();
    }

    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
    await page.getByRole('button', { name: /continue for now/i }).click();
    await expect(
      page.getByRole('heading', {
        name: role === 'recruiter' ? /A little about your hiring/ : /A little more context/,
      }),
    ).toBeVisible();
    await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
  });
}

test('mobile typing hides the brief and keeps the active custom field above a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/early-access');
  await page.fill('#full-name', 'Keyboard Audit');
  await page.fill('#email', `e2e.mobile.keyboard.${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Get early access' }).click();
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('checkbox', { name: 'Other', exact: true }).click();

  const other = page.locator('#other-job-creative_production');
  await other.focus();
  await page.setViewportSize({ width: 390, height: 430 });
  await other.scrollIntoViewIfNeeded();
  await expectInVisualViewport(other);
  await expect(page.locator('[data-brief-pill]')).toHaveCount(0);
  await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
});

test('landscape phone layout remains scrollable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/early-access');
  await page.locator('#email').focus();
  await expectInVisualViewport(page.locator('#email'));
  await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
  expect(
    await page.locator('html').evaluate((element) => getComputedStyle(element).webkitTextSizeAdjust),
  ).toBe('100%');
});

test('phone channel cards stay accessible and composed across release viewports', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await reachPhoneStep(page);
  await expect(page.getByRole('checkbox', { name: 'WhatsApp' })).toHaveCount(0);
  await page.selectOption('#country', 'IN');
  await page.fill('#phone', '9900000001');

  const whatsapp = page.getByRole('checkbox', { name: 'WhatsApp' });
  const sms = page.getByRole('checkbox', { name: 'SMS' });
  const calls = page.getByRole('checkbox', { name: 'Phone calls' });
  await expect(whatsapp).not.toBeChecked();
  await expect(sms).not.toBeChecked();
  await expect(calls).not.toBeChecked();

  await whatsapp.focus();
  await expect(whatsapp).toBeFocused();
  await page.keyboard.press('Space');
  await expect(whatsapp).toBeChecked();
  await expect(page.getByText('Selected')).toBeVisible();
  await sms.check();
  await calls.check();
  await expect(sms).toBeChecked();
  await expect(calls).toBeChecked();

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1728, height: 1117 },
  ]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
    for (const checkbox of [whatsapp, sms, calls]) {
      const box = await checkbox.locator('xpath=ancestor::label').boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByText(/withdraw any choice at any time/i)).toBeVisible();
  }

  // Simulate a short visual viewport while the phone keyboard is open: the primary
  // action remains reachable and fully visible after the browser's normal scroll.
  await page.setViewportSize({ width: 390, height: 430 });
  await page.locator('#phone').focus();
  const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
  await continueButton.scrollIntoViewIfNeeded();
  await expectInVisualViewport(continueButton);

  // Removing the phone immediately removes the controls and their selected state.
  await page.fill('#phone', '');
  await expect(whatsapp).toHaveCount(0);
  await page.fill('#phone', '9900000001');
  await expect(page.getByRole('checkbox', { name: 'WhatsApp' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'SMS' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Phone calls' })).not.toBeChecked();
});

test('safe-area metadata and a 200% type-scale stress test preserve the form', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/early-access');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /viewport-fit=cover/,
  );
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });
  await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
  await expect(page.locator('#full-name')).toBeVisible();
  expect((await page.locator('#full-name').boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);
  expect(
    (await page.getByRole('button', { name: 'Get early access' }).boundingBox())?.height ?? 0,
  ).toBeGreaterThanOrEqual(48);
});

test('a delayed progressive save keeps its honest state without scroll or layout jumps', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/early-access');
  await page.fill('#full-name', 'Slow Save Audit');
  await page.fill('#email', `e2e.mobile.slow-save.${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Get early access' }).click();
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  // Let the intentional step-positioning scroll finish before isolating autosave motion.
  await page.waitForTimeout(900);

  let delayed = false;
  await page.route('**/*', async (route) => {
    if (!delayed && route.request().method() === 'POST') {
      delayed = true;
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
    await route.continue();
  });

  // Selecting is now purely local — this step writes once on Continue rather than once per
  // chip, so a thorough visitor cannot exhaust the per-IP request budget. Picking must
  // therefore be silent, and must not move the page.
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.getByRole('checkbox', { name: 'Video editing', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Thumbnail design', exact: true }).click();
  await expect(page.getByText(/saved when you continue/i)).toBeVisible();
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThan(3);
  await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);

  // The one write is honest about being in flight while the (delayed) request resolves,
  // and the transition still lands without horizontal overflow.
  const submit = page.getByRole('button', { name: /Continue|Saving…/ });
  await submit.click();
  await expect(submit).toHaveText(/Saving…/);
  await expect(page.getByRole('heading', { name: 'Confirm your email' })).toBeVisible({
    timeout: 8000,
  });
  await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
});
