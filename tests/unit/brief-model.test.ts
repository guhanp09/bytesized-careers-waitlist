import { describe, it, expect } from 'vitest';
import {
  buildBriefEntries,
  briefTitle,
  pendingSlots,
  type BriefSnapshot,
} from '@/components/brief/brief-model';
import { progressFraction, progressPhase, ACT_NAMES } from '@/lib/copy/flow-copy';

function snapshot(partial: Partial<BriefSnapshot> = {}): BriefSnapshot {
  return {
    refNo: null,
    fullName: '',
    emailMasked: null,
    role: null,
    jobCategories: [],
    talentCategories: [],
    jobCategoryOthers: {},
    talentCategoryOthers: {},
    workFormats: [],
    organisationTypes: [],
    platforms: [],
    niches: [],
    experienceLevel: null,
    availabilityToStart: null,
    hiringTimeline: null,
    teamSize: null,
    additionalNotes: '',
    phoneProvided: false,
    ...partial,
  };
}

describe('buildBriefEntries', () => {
  it('returns nothing for a null snapshot and an empty snapshot', () => {
    expect(buildBriefEntries(null)).toEqual([]);
    expect(buildBriefEntries(snapshot())).toEqual([]);
  });

  it('typesets name and intent — never the email address', () => {
    const entries = buildBriefEntries(
      snapshot({ fullName: 'Priya Sharma', emailMasked: 'p***@gmail.com', role: 'seeker' }),
    );
    expect(entries.map((e) => e.id)).toEqual(['name', 'role']);
    expect(entries[1]!.value).toBe('Seeking work');
    expect(JSON.stringify(entries)).not.toContain('gmail');
  });

  it('maps category values through human labels and elides long lists', () => {
    const entries = buildBriefEntries(
      snapshot({
        jobCategories: [
          'video_editing',
          'copywriting',
          'seo',
          'community_management',
          'thumbnail_design',
          'sound_design',
        ],
      }),
    );
    const work = entries.find((e) => e.id === 'work')!;
    expect(work.value).toContain('Video editing');
    expect(work.value).toContain('+2 more');
  });

  it('renders section-specific Other answers with their group label, excluding the chip value', () => {
    const entries = buildBriefEntries(
      snapshot({
        jobCategories: ['writing_research_other'],
        jobCategoryOthers: { writing_research: 'Grant writing for creators' },
      }),
    );
    expect(entries.find((e) => e.id === 'work')).toBeUndefined(); // chip value alone isn't listed
    const other = entries.find((e) => e.id === 'work-other-0')!;
    expect(other.label).toBe('In their words');
    expect(other.value).toBe('Writing & research — Grant writing for creators');
  });

  it('includes recruiter-side context and phone reachability', () => {
    const entries = buildBriefEntries(
      snapshot({
        role: 'recruiter',
        talentCategories: ['video_editors'],
        hiringTimeline: 'this_month',
        teamSize: 'solo',
        phoneProvided: true,
      }),
    );
    const ids = entries.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['role', 'talent', 'timeline', 'team', 'phone']));
  });

  it('truncates long notes for the document', () => {
    const long = 'a'.repeat(200);
    const entries = buildBriefEntries(snapshot({ additionalNotes: long }));
    expect(entries.find((e) => e.id === 'note')!.value.length).toBeLessThanOrEqual(140);
  });

  it('never exposes tokens — the snapshot shape has no leadId or resumeToken', () => {
    const s = snapshot({ refNo: 'AB12CD' });
    expect('leadId' in s).toBe(false);
    expect('resumeToken' in s).toBe(false);
    expect(s.refNo).toBe('AB12CD');
  });
});

describe('briefTitle', () => {
  it('is role-aware with a neutral fallback', () => {
    expect(briefTitle('seeker')).toBe('Talent brief');
    expect(briefTitle('recruiter')).toBe('Hiring brief');
    expect(briefTitle('both')).toBe('Dual brief');
    expect(briefTitle(null)).toBe('Your brief');
  });
});

describe('entries carry their section for honest save styling', () => {
  it('tags name/intent/work/phone/note with the step that edits them', () => {
    const entries = buildBriefEntries(
      snapshot({
        fullName: 'Priya',
        role: 'seeker',
        jobCategories: ['video_editing'],
        phoneProvided: true,
        additionalNotes: 'hello',
      }),
    );
    const byId = Object.fromEntries(entries.map((e) => [e.id, e.sectionStep]));
    expect(byId).toMatchObject({ name: 1, role: 2, work: 3, phone: 6, note: 8 });
  });
});

describe('qualitative progression (no numeric counts)', () => {
  it('monotonically fills across the visible flow and completes at filed', () => {
    const steps = [1, 2, 3, 4, 5, 6, 8, 9];
    const fractions = steps.map(progressFraction);
    for (let i = 1; i < fractions.length; i++) {
      expect(fractions[i]!).toBeGreaterThan(fractions[i - 1]!);
    }
    expect(fractions[0]).toBe(0);
    expect(fractions.at(-1)).toBe(1);
  });

  it('phases and act names never contain an "X of Y" count', () => {
    for (const step of [1, 2, 3, 4, 5, 6, 8, 9]) {
      expect(progressPhase(step)).not.toMatch(/\d+\s+of\s+\d+/);
      expect(ACT_NAMES[step] ?? '').not.toMatch(/\d/);
    }
  });
});

describe('pendingSlots', () => {
  it('always implies a future until filed', () => {
    expect(pendingSlots(1, null)).toEqual(['Name', 'Intent']);
    expect(pendingSlots(3, 'recruiter')).toEqual(['The talent']);
    expect(pendingSlots(3, 'seeker')).toEqual(['The work']);
    expect(pendingSlots(6, 'seeker')).toEqual(['Reachability']);
    expect(pendingSlots(8, 'seeker')).toEqual(['Note']);
    expect(pendingSlots(9, 'seeker')).toEqual([]);
  });

  it('retires a slot once its section has ink — no blank rule under a written entry', () => {
    const entries = buildBriefEntries(
      snapshot({ fullName: 'Priya', jobCategories: ['video_editing'] }),
    );
    expect(pendingSlots(3, 'seeker', entries)).toEqual([]);
    expect(pendingSlots(1, null, entries)).toEqual(['Intent']); // name written, intent not
  });
});
