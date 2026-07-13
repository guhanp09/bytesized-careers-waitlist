/**
 * Client-side resume record (plan §12). Stored in localStorage so a returning visitor
 * can continue where they left off. Only the opaque leadId + resume token are stored —
 * never email, phone, or any other PII.
 */
const STORAGE_KEY = 'bytesized_waitlist_resume';

export interface ResumeRecord {
  leadId: string;
  resumeToken: string;
  savedAt: number;
}

export function saveResume(record: Omit<ResumeRecord, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: ResumeRecord = { ...record, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage may be unavailable (private mode / quota) — resume is best-effort.
  }
}

export function loadResume(): ResumeRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ResumeRecord>;
    if (
      typeof parsed.leadId === 'string' &&
      typeof parsed.resumeToken === 'string'
    ) {
      return {
        leadId: parsed.leadId,
        resumeToken: parsed.resumeToken,
        savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearResume(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
