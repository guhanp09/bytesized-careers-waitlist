import type { SendTransactionalEmailInput } from './types';

export interface RenderedEmail {
  html: string;
  text: string;
}

/** Stable public asset URL. Email clients cannot resolve local or relative asset paths. */
export const EMAIL_LOGO_URL =
  'https://bytesizedcareers.com/brand/bytesized-careers-mark-email.png';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Render the provider-independent transactional email body. */
export function renderTransactionalEmail(
  input: SendTransactionalEmailInput,
): RenderedEmail | null {
  if (input.template !== 'verification') return null;
  const code = input.templateData.code;
  const expiresMinutes = input.templateData.expiresMinutes;
  if (
    typeof code !== 'string' ||
    !/^\d{6}$/.test(code) ||
    typeof expiresMinutes !== 'number'
  ) {
    return null;
  }

  const safeCode = escapeHtml(code);
  const safeMinutes = escapeHtml(String(expiresMinutes));
  const name = typeof input.templateData.name === 'string' ? input.templateData.name.trim() : '';
  const safeName = name ? escapeHtml(name) : '';
  const greetingText = name ? `Hi ${name},\n\n` : '';
  const greetingHtml = safeName
    ? `<p style="margin:0 0 18px;color:#f2f0ec;font-size:15px;line-height:1.6">Hi ${safeName},</p>`
    : '';
  return {
    text: [
      'ByteSized Careers — confirm your email',
      '',
      greetingText.trimEnd(),
      `Your verification code is ${code}.`,
      `It expires in ${expiresMinutes} minutes.`,
      '',
      'If you did not request this code, you can ignore this email.',
    ].join('\n'),
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#0b0d12;color:#f2f0ec;font-family:Inter,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px">
        <div style="margin:0 0 28px">
          <img src="${EMAIL_LOGO_URL}" width="48" height="48" alt="ByteSized Careers logo" style="display:block;width:48px;height:48px;border:0;margin:0 0 12px" />
          <p style="margin:0;color:#f2f0ec;font-size:14px;font-weight:600">ByteSized Careers</p>
        </div>
      <div style="border:1px solid #2b2f39;border-radius:16px;background:#14161c;padding:28px">
        <p style="margin:0 0 8px;color:#5b8cff;font-size:13px;font-weight:600;letter-spacing:.04em">EMAIL CONFIRMATION</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">Confirm your email</h1>
        ${greetingHtml}
        <p style="margin:0 0 24px;color:#98999f;font-size:15px;line-height:1.6">Use this code to confirm your place on the ByteSized Careers waitlist.</p>
        <div style="border:1px solid #343946;border-radius:12px;background:#0f1117;padding:20px;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:30px;font-weight:700;letter-spacing:.24em;color:#6f9bff">${safeCode}</div>
        <p style="margin:20px 0 0;color:#6b6d75;font-size:13px;line-height:1.5">This code expires in ${safeMinutes} minutes. If you didn&apos;t request it, you can safely ignore this email.</p>
      </div>
    </div>
  </body>
</html>`,
  };
}
