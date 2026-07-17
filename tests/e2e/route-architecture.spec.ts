import { expect, test, type Page } from '@playwright/test';
import { Pool } from 'pg';

const releaseViewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1728, height: 1117 },
] as const;

const hasHorizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

async function localLeadCount() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/bytesized_test',
  });
  try {
    const result = await pool.query<{ count: string }>('select count(*)::text as count from waitlist_leads');
    return Number(result.rows[0]?.count ?? 0);
  } finally {
    await pool.end();
  }
}

test('root is a pre-launch brand holding page and never initializes registration', async ({ page }) => {
  const before = await localLeadCount();
  const postRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') postRequests.push(request.url());
  });

  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'Creator-economy hiring, brought into focus.',
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByText('The marketplace is currently being built.')).toBeVisible();
  await expect(page.locator('#full-name')).toHaveCount(0);
  await expect(page.locator('#email')).toHaveCount(0);
  await expect(page.locator('[data-waitlist-card]')).toHaveCount(0);
  expect(postRequests).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('bytesized_waitlist_resume'))).toBeNull();
  await expect.poll(() =>
    page.evaluate(() => localStorage.getItem('bytesized_waitlist_attribution')),
  ).not.toBeNull();
  expect(await localLeadCount()).toBe(before);
});

test('root CTA forwards only supported attribution into early access', async ({ page }) => {
  await page.goto(
    '/?utm_source=linkedin&utm_campaign=launch&utm_medium=outbound&utm_content=agency-dm-a&utm_term=creator-hiring&utm_geo=in&utm_placement=dm&ref=partner-a&source=discard&unsafe=discard',
  );
  const cta = page.getByRole('link', { name: 'Join early access' });
  await expect(cta).toHaveAttribute(
    'href',
    '/early-access?utm_source=linkedin&utm_medium=outbound&utm_campaign=launch&utm_content=agency-dm-a&utm_term=creator-hiring&utm_geo=in&utm_placement=dm&ref=partner-a',
  );
  await cta.click();
  await expect(page).toHaveURL(
    /\/early-access\?utm_source=linkedin&utm_medium=outbound&utm_campaign=launch&utm_content=agency-dm-a&utm_term=creator-hiring&utm_geo=in&utm_placement=dm&ref=partner-a$/,
  );
  await expect(page.locator('#email')).toBeVisible();
});

test('root footer and metadata distinguish the brand from early-access legal documents', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('ByteSized Careers — Creator-Economy Hiring Marketplace');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /^https:\/\/bytesizedcareers\.com\/?$/,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    /^https:\/\/bytesizedcareers\.com\/?$/,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    /is building a focused marketplace/i,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/opengraph-image(?:\?|$)/,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    /\/twitter-image(?:\?|$)/,
  );

  const footer = page.locator('footer');
  await expect(footer.getByText(/apply to the current early-access programme/i)).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Early Access Privacy' })).toHaveAttribute(
    'href',
    '/early-access/privacy',
  );
  await expect(footer.getByRole('link', { name: 'Early Access Terms' })).toHaveAttribute(
    'href',
    '/early-access/terms',
  );
  await expect(footer.getByRole('link', { name: 'Early Access Storage' })).toHaveAttribute(
    'href',
    '/early-access/cookies',
  );
});

test('root CTA is the first keyboard destination', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Join early access' })).toBeFocused();
});

test('root holding page remains composed at every release viewport', async ({ page }) => {
  for (const viewport of releaseViewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Join early access' })).toBeVisible();
    await expect.poll(() => hasHorizontalOverflow(page)).toBe(false);
  }
});

test('early access owns the complete existing form and route-specific metadata', async ({ page }) => {
  await page.goto('/early-access');
  await expect(page.locator('[data-waitlist-card]')).toBeVisible();
  await expect(page.locator('#full-name')).toBeVisible();
  await expect(page.locator('#email')).toBeVisible();
  await expect(page).toHaveTitle('Join Early Access | ByteSized Careers');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bytesizedcareers.com/early-access',
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://bytesizedcareers.com/early-access',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/early-access\/opengraph-image(?:\?|$)/,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    /\/early-access\/twitter-image(?:\?|$)/,
  );
});

test('sitemap lists canonical public routes only', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const sitemap = await response.text();
  for (const path of [
    '/',
    '/early-access',
    '/early-access/privacy',
    '/early-access/terms',
    '/early-access/cookies',
  ]) {
    expect(sitemap).toContain(`<loc>https://bytesizedcareers.com${path}</loc>`);
  }
  expect(sitemap).not.toContain('<loc>https://bytesizedcareers.com/privacy</loc>');
  expect(sitemap).not.toContain('<loc>https://bytesizedcareers.com/terms</loc>');
  expect(sitemap).not.toContain('<loc>https://bytesizedcareers.com/cookies</loc>');
  expect(sitemap).not.toContain('/admin');
});
