/**
 * Mask an email for display on resumed sessions and in logs (plan §12, §14).
 * "guhanp09@gmail.com" -> "g*******@gmail.com". Never exposes the full local-part.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const first = local[0] ?? '';
  const stars = '*'.repeat(Math.max(local.length - 1, 1));
  return `${first}${stars}@${domain}`;
}
