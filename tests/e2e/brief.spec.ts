import { test, expect, type Page } from '@playwright/test';
import { STAMP_TEXT } from '../../src/lib/copy/flow-copy';

/**
 * "The Brief" presentation layer: the living document artifact (desktop rail + mobile
 * drawer), its live typesetting of real answers, the filed stamp, reduced-motion stills,
 * and the performance invariants (no canvas, no rAF loop at idle).
 */

function uniqueEmail(tag: string): string {
  return `e2e.brief.${tag}.${Date.now()}@example.com`;
}

async function readDevCode(page: Page): Promise<string> {
  await page.getByText(/Your test code is/).waitFor({ timeout: 15000 });
  const txt = await page.getByText(/Your test code is/).innerText();
  const m = txt.match(/(\d{6})/);
  if (!m) throw new Error('dev code not found');
  return m[1]!;
}

test('desktop rail is sticky and typesets real answers as they are given', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/early-access');

  const rail = page.locator('[data-brief-rail]');
  await expect(rail).toBeVisible();
  const sticky = await rail
    .locator('> div')
    .evaluate((el) => getComputedStyle(el).position);
  expect(sticky).toBe('sticky');

  const panel = page.locator('[data-brief-rail] [data-brief-panel]');
  await expect(panel).toContainText('Your brief');

  // Step 1 → the name lands on the document.
  await page.fill('#full-name', 'Priya Sharma');
  await page.fill('#email', uniqueEmail('rail'));
  await page.click('button[type="submit"]');
  await expect(panel).toContainText('Priya Sharma');

  // Role → intent typesets and the title sharpens.
  await page.getByRole('button', { name: /looking for work/ }).click();
  await expect(panel).toContainText('Seeking work');
  await expect(panel).toContainText('Talent brief');

  // Categories + a section-specific Other, in their words.
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await page.getByRole('checkbox', { name: 'Video editing', exact: true }).click();
  await expect(panel).toContainText('Video editing');
  await page.getByRole('checkbox', { name: 'Other', exact: true }).click();
  await page.fill('#other-job-creative_production', 'Set design for creators');
  await expect(panel).toContainText('Creative & production — Set design for creators');
});

test('the brief stays in the viewport through later steps — including the phone step', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/early-access');
  await page.fill('#full-name', 'Meera Iyer');
  await page.fill('#email', uniqueEmail('sticky'));
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.getByRole('button', { name: /continue for now/i }).click();
  await page.getByRole('heading', { name: /A little about how you work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: /Add a phone contact/ }).waitFor();

  // The companion folio is still on screen next to the active question…
  const panel = page.locator('[data-brief-rail] [data-brief-panel]');
  await expect(panel).toBeVisible();
  const inViewport = await panel.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.top < window.innerHeight && rect.height > 120;
  });
  expect(inViewport).toBe(true);
  // …still typesetting saved answers, with its honest status footer.
  await expect(panel).toContainText('Meera Iyer');
  await expect(panel).toContainText('Saved as you go');

  // And it never overlaps the form card.
  const cardBox = await page
    .locator('#phone')
    .evaluate((el) => el.closest('[class*="rounded-md"]')?.getBoundingClientRect().right ?? 0);
  const panelBox = await panel.evaluate((el) => el.getBoundingClientRect().left);
  expect(panelBox).toBeGreaterThan(cardBox);
});

test('completing the flow files the brief with the stamp', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/early-access');
  await page.fill('#full-name', 'Dev Patel');
  await page.fill('#email', uniqueEmail('stamp'));
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking for work/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.fill('#verify-code', await readDevCode(page));
  await page.getByRole('heading', { name: /A little about how you work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: /Add a phone contact/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: /genuinely useful/ }).waitFor();
  await page.getByRole('button', { name: 'Finish' }).click();

  // The stamp lands in the success card and on the document itself.
  await expect(page.locator('.brief-stamp').first()).toBeVisible();
  const stamps = page.getByText(STAMP_TEXT, { exact: false });
  await expect(stamps.first()).toBeVisible();
});

test('mobile drawer: pill appears after answers, opens the document, returns focus on close', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/early-access');

  // No pill before the visitor has anything on paper.
  await expect(page.locator('[data-brief-pill]')).toHaveCount(0);

  await page.fill('#full-name', 'Rina Das');
  await page.fill('#email', uniqueEmail('drawer'));
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: /looking to hire/ }).click();
  await page.getByRole('heading', { name: /What kind of talent/ }).waitFor();

  const pill = page.locator('[data-brief-pill]');
  await expect(pill).toBeVisible();
  await expect(pill).toContainText(/Your brief/i);

  // Pill never overlaps the form's Continue button.
  const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
  await continueBtn.scrollIntoViewIfNeeded();
  const [pillBox, ctaBox] = await Promise.all([pill.boundingBox(), continueBtn.boundingBox()]);
  if (pillBox && ctaBox) {
    const overlap =
      pillBox.x < ctaBox.x + ctaBox.width &&
      pillBox.x + pillBox.width > ctaBox.x &&
      pillBox.y < ctaBox.y + ctaBox.height &&
      pillBox.y + pillBox.height > ctaBox.y;
    expect(overlap).toBe(false);
  }

  // Open → the document; close → focus returns to the pill.
  await pill.click();
  const sheet = page.locator('[data-brief-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('Rina Das');
  await expect(sheet).toContainText('Hiring brief');
  await sheet.getByRole('button', { name: /close/i }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('[data-brief-pill]')).toBeFocused();

  // The pill yields while typing in a text field.
  await page.getByRole('checkbox', { name: 'Other', exact: true }).click();
  await page.locator('#other-talent-creative_production').focus();
  await expect(page.locator('[data-brief-pill]')).toHaveCount(0);
});

test('reduced motion renders composed stills — hero words at identity transform', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/early-access');

  const transforms = await page.$$eval('.hero-word', (els) =>
    els.map((el) => getComputedStyle(el).transform),
  );
  expect(transforms.length).toBeGreaterThan(0);
  for (const t of transforms) expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(t);

  // Scraps hold still too.
  const anims = await page.$$eval('.scrap', (els) =>
    els.map((el) => getComputedStyle(el).animationName),
  );
  for (const a of anims) expect(a).toBe('none');
});

test('no canvas and no runaway rAF loop at idle', async ({ page }) => {
  await page.goto('/early-access');
  await expect(page.locator('canvas')).toHaveCount(0);

  // Count rAF callbacks over 2s of idle on step 1 — CSS animations don't use rAF, and the
  // flow's settle-loop only runs during navigation.
  const rafCount = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let count = 0;
        const original = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (cb) => {
          count += 1;
          return original(cb);
        };
        setTimeout(() => resolve(count), 2000);
      }),
  );
  expect(rafCount).toBeLessThan(30);
});
