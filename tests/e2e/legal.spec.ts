import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const legalPages = [
  { path: '/privacy', name: 'privacy', heading: /Your brief is personal/i },
  { path: '/terms', name: 'terms', heading: /waiting room/i },
  { path: '/cookies', name: 'cookies', heading: /browser keeps/i },
] as const;

const viewports = [
  { label: 'phone-320x568', width: 320, height: 568 },
  { label: 'phone-375x667', width: 375, height: 667 },
  { label: 'phone-390x844', width: 390, height: 844 },
  { label: 'phone-430x932', width: 430, height: 932 },
  { label: 'laptop-1366x768', width: 1366, height: 768 },
  { label: 'desktop-1728x1117', width: 1728, height: 1117 },
] as const;

const forbiddenPublicDraftText = [
  'TBD',
  'TO BE DECIDED',
  'REQUIRED',
  'PLACEHOLDER',
  'INSERT',
  'LEGAL OPERATOR',
  'BUSINESS ADDRESS REQUIRED',
  'GOVERNING LAW DECISION',
  'PRIVACY EMAIL REQUIRED',
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
}

test('legal routes load directly with logical headings and descriptive links', async ({ page }) => {
  for (const legal of legalPages) {
    await page.goto(legal.path);
    await expect(page.getByRole('heading', { name: legal.heading, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ByteSized Careers home' })).toHaveAttribute(
      'href',
      '/',
    );
    await expect(page.getByRole('navigation', { name: 'Legal pages' })).toBeVisible();

    const headingLevels = await page.locator('h1, h2, h3').evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1))),
    );
    expect(headingLevels[0]).toBe(1);
    for (let index = 1; index < headingLevels.length; index += 1) {
      expect(headingLevels[index]! - headingLevels[index - 1]!).toBeLessThanOrEqual(1);
    }
  }
});

test('homepage exposes every legal route and the collection notice', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Early-Access Terms' })).toHaveAttribute('href', '/terms');
  await expect(page.getByRole('link', { name: 'Privacy Notice' })).toHaveAttribute('href', '/privacy');
  await expect(page.getByText(/confirm you are 18 or older/i)).toBeVisible();
  await expect(page.getByText(/can be stopped separately from deleting your registration/i)).toBeVisible();

  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  await expect(footer.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  await expect(footer.getByRole('link', { name: 'Storage' })).toHaveAttribute('href', '/cookies');
});

test('public legal content consistently uses final operator decisions without drafting placeholders', async ({ page }) => {
  for (const legal of legalPages) {
    await page.goto(legal.path);
    const text = await page.locator('body').innerText();
    expect(text).toContain('ByteSized Careers');
    expect(text).toContain('legal@bytesizedcareers.com');
    for (const forbidden of forbiddenPublicDraftText) {
      expect(text).not.toContain(forbidden);
    }
  }

  await page.goto('/privacy');
  const privacy = await page.locator('body').innerText();
  expect(privacy).toContain('Guhan Purushothaman');
  expect(privacy).toMatch(/18 or older/);
  expect(privacy).toMatch(/fields pre-filled/i);
  expect(privacy).toMatch(/does not by itself\s+delete the waitlist record/i);
  expect(privacy).not.toMatch(/automatically deleted after|deleted within \d+ days/i);

  await page.goto('/terms');
  const terms = await page.locator('body').innerText();
  expect(terms).toContain('Guhan Purushothaman');
  expect(terms).toMatch(/laws of India/);
  expect(terms).toMatch(/competent courts in Chennai, Tamil Nadu/);
  expect(terms).toMatch(/Relevance notices and active matching are not available today/);
});

test('legal navigation is keyboard accessible', async ({ page }) => {
  await page.goto('/privacy');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'ByteSized Careers home' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Privacy notice' })).toBeFocused();
});

test('legal pages remain readable without horizontal overflow at required viewports', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const legal of legalPages) {
      await page.goto(legal.path);
      await expect(page.getByRole('heading', { name: legal.heading, level: 1 })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  }
});

test('captures review screenshots of all legal pages', async ({ page }) => {
  await mkdir('artifacts/legal', { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const legal of legalPages) {
    await page.goto(legal.path);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    await page.screenshot({ path: `artifacts/legal/${legal.name}-390x844.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const legal of legalPages) {
    await page.goto(legal.path);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    await page.screenshot({ path: `artifacts/legal/${legal.name}-1440x1000.png`, fullPage: true });
  }
});
