import { test, expect, type Page } from '@playwright/test';

/**
 * Two guarantees for the option-dense steps:
 *
 * 1. Selections are not autosaved per click. A thorough visitor picking many chips used to
 *    issue one request per selection, which exhausted the per-IP rate limit and surfaced
 *    "Too many attempts — please wait a few minutes and try again." mid-flow.
 * 2. Choosing "Other" requires saying what we missed — an unexplained "Other" teaches us
 *    nothing about the gap in the taxonomy.
 */

function uniqueEmail(tag: string): string {
  return `e2e.custom.${tag}.${Date.now()}@example.com`;
}

async function reachInterests(page: Page, tag: string, hire = false) {
  await page.goto('/early-access');
  await page.fill('#full-name', 'Taylor Morgan');
  await page.fill('#email', uniqueEmail(tag));
  await page.getByRole('button', { name: 'Get early access' }).click();
  await page
    .getByRole('button', { name: hire ? /looking to hire/ : /looking for work/ })
    .click();
  await page
    .getByRole('heading', { name: hire ? /What kind of talent/ : /What kind of work/ })
    .waitFor();
}

/** Server actions POST back to the same route, so POSTs are the save count. */
function countSaves(page: Page): () => number {
  let saves = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST') saves += 1;
  });
  return () => saves;
}

test('picking many options issues no per-click saves and never rate-limits', async ({ page }) => {
  // The "both" path is used deliberately: its Next stays inside the interests step, so the
  // save count is isolated from requests any following step would legitimately make.
  await page.goto('/early-access');
  await page.fill('#full-name', 'Taylor Morgan');
  await page.fill('#email', uniqueEmail('many'));
  await page.getByRole('button', { name: 'Get early access' }).click();
  await page.getByRole('button', { name: /bit of both/i }).click();
  await page.getByRole('heading', { name: /the work you love/i }).waitFor();

  const saves = countSaves(page);

  // Work through several groups the way a thorough visitor does, pausing between picks so
  // any per-click debounce would have fired.
  const groups = ['Creative & production', 'Writing & research', 'Strategy & growth'];
  let picked = 0;
  for (const group of groups) {
    if (group !== 'Creative & production') {
      await page.getByRole('button', { name: new RegExp(group) }).click();
      await page.waitForTimeout(150);
    }
    const chips = page.getByRole('checkbox');
    const total = await chips.count();
    for (let i = 0; i < total && picked < 24; i++) {
      const chip = chips.nth(i);
      if (!(await chip.isVisible())) continue;
      if ((await chip.textContent())?.trim() === 'Other') continue; // needs an answer
      await chip.click();
      picked += 1;
      await page.waitForTimeout(60);
    }
  }
  // Comfortably past the old 30-request budget once earlier steps are counted too.
  expect(picked).toBeGreaterThanOrEqual(20);

  // Nothing has been written yet, and no rate-limit copy is anywhere on screen.
  expect(saves()).toBe(0);
  await expect(page.getByText(/Too many attempts/i)).toHaveCount(0);
  await expect(page.getByText(/saved when you continue/i)).toBeVisible();

  // Advancing writes those two dozen selections in exactly one request.
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('heading', { name: /the talent you want/i }).waitFor();
  expect(saves()).toBe(1);
  await expect(page.getByText(/Too many attempts/i)).toHaveCount(0);
});

test('the single write captures every selection — proven after a reload', async ({ page }) => {
  await reachInterests(page, 'persist');

  const group = page.getByRole('group', { name: 'Creative & production' });
  const chosen = ['Video editing', 'Thumbnail design', 'Motion graphics', 'Sound design'];
  for (const name of chosen) {
    await group.getByRole('checkbox', { name, exact: true }).click();
    await page.waitForTimeout(40);
  }
  await group.getByRole('checkbox', { name: 'Other', exact: true }).click();
  await page.fill('#other-job-creative_production', 'Set design for creators');

  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();

  // Reload so the form can only be rebuilt from what was actually persisted, then step
  // back into the interests screen.
  await page.goto('/early-access');
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.getByRole('button', { name: /Back/ }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();

  const restored = page.getByRole('group', { name: 'Creative & production' });
  for (const name of chosen) {
    await expect(restored.getByRole('checkbox', { name, exact: true })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  }
  await expect(page.locator('#other-job-creative_production')).toHaveValue(
    'Set design for creators',
  );
});

test('an unanswered "Other" blocks Continue, then advances once answered', async ({ page }) => {
  await reachInterests(page, 'other');

  await page.getByRole('checkbox', { name: 'Other', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Still on the interests step, with the field flagged and focused.
  await expect(page.getByRole('heading', { name: /What kind of work/ })).toBeVisible();
  const field = page.locator('#other-job-creative_production');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(field).toBeFocused();
  await expect(page.getByText(/Tell us what we missed/).first()).toBeVisible();

  // Whitespace alone is not an answer.
  await field.fill('   ');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: /What kind of work/ })).toBeVisible();

  // A real answer clears the error and lets the step complete.
  await field.fill('Set design for creators');
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Confirm your email' })).toBeVisible();
});

test('deselecting "Other" clears the requirement and its answer', async ({ page }) => {
  await reachInterests(page, 'deselect');

  const other = page.getByRole('checkbox', { name: 'Other', exact: true });
  await other.click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText(/Tell us what we missed/).first()).toBeVisible();

  // Turning "Other" off removes the field and the blocker.
  await other.click();
  await expect(page.locator('#other-job-creative_production')).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Video editing', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Confirm your email' })).toBeVisible();
});

test('the recruiter side enforces the same rule on its own taxonomy', async ({ page }) => {
  await reachInterests(page, 'recruiter', true);

  await page.getByRole('checkbox', { name: 'Other', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: /What kind of talent/ })).toBeVisible();

  const field = page.locator('#other-talent-creative_production');
  await expect(field).toBeFocused();
  await field.fill('Virtual set builders');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Confirm your email' })).toBeVisible();
});

test('context step: platform "Other" is required and context saves once', async ({ page }) => {
  await reachInterests(page, 'context');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.getByRole('button', { name: /continue for now/i }).click();
  await page.getByRole('heading', { name: /A little about how you work/ }).waitFor();

  const saves = countSaves(page);

  // Several context selections, then an unanswered platform "Other".
  await page.getByRole('checkbox', { name: 'Remote', exact: true }).click();
  await page.getByRole('checkbox', { name: 'YouTube', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Tech', exact: true }).click();
  await page.waitForTimeout(400);
  expect(saves()).toBe(0);

  const platformOther = page.getByRole('checkbox', { name: 'Other', exact: true }).first();
  await platformOther.click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: /A little about how you work/ })).toBeVisible();
  await expect(page.locator('#platform-other')).toBeFocused();

  await page.locator('#platform-other').fill('Substack');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Add a phone contact/ })).toBeVisible();
  expect(saves()).toBe(1);
});
