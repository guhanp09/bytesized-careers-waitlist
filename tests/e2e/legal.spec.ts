import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const legalPages = [
  {
    path: '/early-access/privacy',
    name: 'privacy',
    heading: 'Early Access Privacy Notice',
    title: 'Early Access Privacy Notice | ByteSized Careers',
  },
  {
    path: '/early-access/terms',
    name: 'terms',
    heading: 'Early Access Terms of Use',
    title: 'Early Access Terms of Use | ByteSized Careers',
  },
  {
    path: '/early-access/cookies',
    name: 'cookies',
    heading: 'Early Access Storage Notice',
    title: 'Early Access Storage Notice | ByteSized Careers',
  },
] as const;

const viewports = [
  { label: 'phone-320x568', width: 320, height: 568 },
  { label: 'phone-360x800', width: 360, height: 800 },
  { label: 'phone-375x667', width: 375, height: 667 },
  { label: 'phone-390x844', width: 390, height: 844 },
  { label: 'phone-430x932', width: 430, height: 932 },
  { label: 'tablet-768x1024', width: 768, height: 1024 },
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

test('nested legal routes load directly with scoped titles and navigation', async ({ page }) => {
  for (const legal of legalPages) {
    await page.goto(legal.path);
    await expect(page.getByRole('heading', { name: legal.heading, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ByteSized Careers home' })).toHaveAttribute(
      'href',
      '/',
    );
    await expect(page.getByRole('navigation', { name: 'Legal pages' })).toBeVisible();
    await expect(page.getByText(/appl(?:y|ies) only to the current/i)).toBeVisible();

    const headingLevels = await page.locator('h1, h2, h3').evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1))),
    );
    expect(headingLevels[0]).toBe(1);
    for (let index = 1; index < headingLevels.length; index += 1) {
      expect(headingLevels[index]! - headingLevels[index - 1]!).toBeLessThanOrEqual(1);
    }
  }
});

test('early-access page exposes nested legal routes and the collection notice', async ({ page }) => {
  await page.goto('/early-access');
  await expect(page.getByRole('link', { name: 'Early-Access Terms' })).toHaveAttribute(
    'href',
    '/early-access/terms',
  );
  await expect(page.getByRole('link', { name: 'Privacy Notice' })).toHaveAttribute(
    'href',
    '/early-access/privacy',
  );
  await expect(page.getByText(/confirm you are 18 or older/i)).toBeVisible();
  await expect(
    page.getByText(/can be stopped separately from deleting your registration/i),
  ).toBeVisible();

  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
    'href',
    '/early-access/privacy',
  );
  await expect(footer.getByRole('link', { name: 'Terms' })).toHaveAttribute(
    'href',
    '/early-access/terms',
  );
  await expect(footer.getByRole('link', { name: 'Storage' })).toHaveAttribute(
    'href',
    '/early-access/cookies',
  );
});

test('legal content preserves approved facts without marketplace overreach or placeholders', async ({ page }) => {
  for (const legal of legalPages) {
    await page.goto(legal.path);
    const text = await page.locator('body').innerText();
    expect(text).toContain('ByteSized Careers');
    expect(text).toContain('legal@bytesizedcareers.com');
    expect(text).toMatch(/marketplace.*(?:has not launched|before.*launch)/is);
    for (const forbidden of forbiddenPublicDraftText) expect(text).not.toContain(forbidden);
  }

  await page.goto('/early-access/privacy');
  const privacy = await page.locator('body').innerText();
  expect(privacy).toContain('Guhan Purushothaman');
  expect(privacy).toMatch(/18 or older/);
  expect(privacy).toMatch(/fields pre-filled/i);
  expect(privacy).toMatch(/does not by itself\s+delete the waitlist record/i);
  expect(privacy).not.toMatch(/automatically deleted after|deleted within \d+ days/i);

  await page.goto('/early-access/terms');
  const terms = await page.locator('body').innerText();
  expect(terms).toContain('Guhan Purushothaman');
  expect(terms).toMatch(/laws of India/);
  expect(terms).toMatch(/competent courts in Chennai, Tamil Nadu/);
  expect(terms).toMatch(/Relevance notices and active matching are not available today/);
});

test('old legal URLs are temporary redirects to one canonical nested copy', async ({ request }) => {
  for (const [from, to] of [
    ['/privacy', '/early-access/privacy'],
    ['/terms', '/early-access/terms'],
    ['/cookies', '/early-access/cookies'],
  ] as const) {
    const response = await request.get(`${from}?utm_source=legacy&unsafe=drop`, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    const location = response.headers().location;
    expect(location).toBe(`${to}?utm_source=legacy`);

    const destination = await request.get(location!);
    expect(destination.status()).toBe(200);
  }
});

test('nested legal metadata identifies canonical early-access documents', async ({ page }) => {
  for (const legal of legalPages) {
    await page.goto(legal.path);
    await expect(page).toHaveTitle(legal.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://bytesizedcareers.com${legal.path}`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `https://bytesizedcareers.com${legal.path}`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      legal.title,
    );
  }
});

test('legal navigation is keyboard accessible', async ({ page }) => {
  await page.goto('/early-access/privacy');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'ByteSized Careers home' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Early Access Privacy Notice' })).toBeFocused();
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

test('captures review screenshots of all nested legal pages', async ({ page }) => {
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
