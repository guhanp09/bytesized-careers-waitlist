import { expect, test, type Page } from '@playwright/test';
import { Pool } from 'pg';
import { SUCCESS_HEADLINES } from '../../src/lib/copy/flow-copy';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/bytesized_test';

function uniqueEmail() {
  return `e2e.attribution.${Date.now()}@example.com`;
}

async function readLead(email: string) {
  const pool = new Pool({ connectionString });
  try {
    const result = await pool.query<{
      first_touch_attribution: Record<string, unknown> | null;
      last_touch_attribution: Record<string, unknown> | null;
      email_verification_status: string;
      completion_status: string;
      role: string | null;
      count: string;
    }>(`
      select first_touch_attribution, last_touch_attribution,
             email_verification_status, completion_status, role,
             count(*) over ()::text as count
      from waitlist_leads where normalized_email = $1
    `, [email]);
    return result.rows[0] ?? null;
  } finally {
    await pool.end();
  }
}

async function readDevCode(page: Page) {
  const text = await page.getByText(/Your test code is/).innerText({ timeout: 15_000 });
  const code = text.match(/\d{6}/)?.[0];
  if (!code) throw new Error('dev code unavailable');
  return code;
}

test('first and last touch survive save, verification, completion, resume, and storage loss', async ({ page, context }) => {
  const email = uniqueEmail();
  await page.goto(
    '/?utm_source=Reddit&utm_medium=community&utm_campaign=editor-feedback&utm_content=community-post-a&utm_term=video-editing&utm_geo=IN&utm_placement=post&unsafe=discard',
  );
  const cta = page.getByRole('link', { name: 'Join early access' });
  await expect(cta).toHaveAttribute(
    'href',
    '/early-access?utm_source=reddit&utm_medium=community&utm_campaign=editor-feedback&utm_content=community-post-a&utm_term=video-editing&utm_geo=in&utm_placement=post',
  );
  await cta.click();
  await expect(page.getByText('editor-feedback', { exact: true })).toHaveCount(0);

  await page.fill('#full-name', 'Controlled Attribution QA');
  await page.fill('#email', email);
  await page.click('button[type="submit"]');

  await expect.poll(async () => (await readLead(email))?.first_touch_attribution).toMatchObject({
    kind: 'campaign',
    source: 'reddit',
    medium: 'community',
    campaign: 'editor-feedback',
    content: 'community-post-a',
    term: 'video-editing',
    geo: 'in',
    placement: 'post',
    landingPath: '/',
    version: 1,
  });
  expect((await readLead(email))?.last_touch_attribution).toMatchObject({ source: 'reddit' });

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  const reopened = await context.newPage();
  await reopened.goto('/early-access');
  await expect(reopened.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await reopened.close();

  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /looking for work/i }).click();
  await page.getByRole('heading', { name: /What kind of work/ }).waitFor();
  await page.getByRole('checkbox', { name: 'Video editing', exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm your email' }).waitFor();
  await page.fill('#verify-code', await readDevCode(page));
  await page.getByRole('heading', { name: /A little about how you work/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: /Add a phone contact/ }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: /genuinely useful/ }).waitFor();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('heading', { name: SUCCESS_HEADLINES.seeker })).toBeVisible();

  let lead = await readLead(email);
  expect(lead).toMatchObject({
    email_verification_status: 'verified',
    completion_status: 'completed',
    role: 'seeker',
    count: '1',
  });
  expect(lead?.first_touch_attribution).toMatchObject({ source: 'reddit' });
  expect(lead?.last_touch_attribution).toMatchObject({ source: 'reddit' });

  await page.goto(
    '/early-access?utm_source=Meta&utm_medium=paid-social&utm_campaign=talent-india&utm_content=static-b&utm_geo=IN&utm_placement=ig-reels',
  );
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect.poll(async () => (await readLead(email))?.last_touch_attribution).toMatchObject({
    source: 'meta',
    medium: 'paid-social',
    campaign: 'talent-india',
    content: 'static-b',
    geo: 'in',
    placement: 'ig-reels',
  });
  lead = await readLead(email);
  expect(lead?.first_touch_attribution).toMatchObject({ source: 'reddit' });

  await page.goto('/early-access');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect((await readLead(email))?.last_touch_attribution).toMatchObject({ source: 'meta' });

  await page.evaluate(() => localStorage.clear());
  await page.goto('/early-access');
  await page.fill('#full-name', 'Controlled Attribution QA');
  await page.fill('#email', email);
  await page.click('button[type="submit"]');
  await expect(page.getByRole('button', { name: /looking for work/i })).toBeVisible();
  lead = await readLead(email);
  expect(lead?.count).toBe('1');
  expect(lead?.first_touch_attribution).toMatchObject({ source: 'reddit' });
  expect(lead?.last_touch_attribution).toMatchObject({ source: 'meta' });
});
