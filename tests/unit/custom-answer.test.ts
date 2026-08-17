import { describe, expect, it } from 'vitest';
import { missingCustomAnswers, sanitizeNeedSelection } from '@/lib/leads/needs';
import {
  contextStepSchema,
  preferencesStepSchema,
  MISSING_CUSTOM_ANSWER_MESSAGE,
} from '@/lib/validation/preferences';

const SESSION = {
  leadId: '11111111-2222-4333-8444-555555555555',
  resumeToken: 'token-value',
};

describe('missingCustomAnswers', () => {
  it('flags an "Other" chip with no answer, blank answer, or whitespace-only answer', () => {
    expect(missingCustomAnswers(['writing_research_other'], {})).toEqual(['writing_research']);
    expect(missingCustomAnswers(['writing_research_other'], { writing_research: '' })).toEqual([
      'writing_research',
    ]);
    expect(missingCustomAnswers(['writing_research_other'], { writing_research: '   ' })).toEqual([
      'writing_research',
    ]);
  });

  it('accepts an answered "Other" and ignores ordinary selections', () => {
    expect(
      missingCustomAnswers(['video_editing', 'writing_research_other'], {
        writing_research: 'Grant writing',
      }),
    ).toEqual([]);
    expect(missingCustomAnswers(['video_editing', 'research'], {})).toEqual([]);
  });

  it('reports every unanswered group so the form can reveal them all', () => {
    expect(
      missingCustomAnswers(['writing_research_other', 'strategy_growth_other'], {
        writing_research: 'Grant writing',
      }),
    ).toEqual(['strategy_growth']);
  });
});

describe('sanitizeNeedSelection', () => {
  it('drops an unanswered "Other" marker rather than storing a meaningless one', () => {
    const result = sanitizeNeedSelection(['video_editing', 'writing_research_other'], {
      writing_research: '  ',
    });
    expect(result.selections).toEqual(['video_editing']);
    expect(result.customResponses).toEqual({});
  });

  it('keeps answered "Other" selections and trims their text', () => {
    const result = sanitizeNeedSelection(['writing_research_other'], {
      writing_research: '  Grant writing  ',
    });
    expect(result.selections).toEqual(['writing_research_other']);
    expect(result.customResponses).toEqual({ writing_research: 'Grant writing' });
  });

  it('leaves a selection set with no "Other" untouched', () => {
    const result = sanitizeNeedSelection(['video_editing', 'research'], {});
    expect(result.selections).toEqual(['video_editing', 'research']);
  });
});

describe('preferencesStepSchema requires the custom answer', () => {
  it('rejects a seeker "Other" with no answer', () => {
    const result = preferencesStepSchema.safeParse({
      ...SESSION,
      jobCategories: ['writing_research_other'],
      jobCategoryOthers: {},
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toBe(
      MISSING_CUSTOM_ANSWER_MESSAGE,
    );
  });

  it('rejects a recruiter "Other" whose answer is whitespace only', () => {
    const result = preferencesStepSchema.safeParse({
      ...SESSION,
      talentCategories: ['writing_research_other'],
      talentCategoryOthers: { writing_research: '   ' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts an answered "Other" on either side', () => {
    expect(
      preferencesStepSchema.safeParse({
        ...SESSION,
        jobCategories: ['video_editing', 'writing_research_other'],
        jobCategoryOthers: { writing_research: 'Grant writing' },
      }).success,
    ).toBe(true);
    expect(
      preferencesStepSchema.safeParse({
        ...SESSION,
        talentCategories: ['writing_research_other'],
        talentCategoryOthers: { writing_research: 'Fact-checkers' },
      }).success,
    ).toBe(true);
  });

  it('still accepts selections that never involve "Other"', () => {
    expect(
      preferencesStepSchema.safeParse({
        ...SESSION,
        jobCategories: ['video_editing', 'research'],
        jobCategoryOthers: {},
      }).success,
    ).toBe(true);
  });
});

describe('contextStepSchema requires the custom answer', () => {
  it('rejects a platform "Other" with no answer', () => {
    const result = contextStepSchema.safeParse({
      ...SESSION,
      platforms: ['youtube', 'other'],
      platformOther: null,
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toBe(
      MISSING_CUSTOM_ANSWER_MESSAGE,
    );
  });

  it('rejects a niche "Other" with a whitespace-only answer', () => {
    expect(
      contextStepSchema.safeParse({
        ...SESSION,
        niches: ['other'],
        nicheOther: '  ',
      }).success,
    ).toBe(false);
  });

  it('accepts answered platform and niche "Other" values', () => {
    expect(
      contextStepSchema.safeParse({
        ...SESSION,
        platforms: ['other'],
        platformOther: 'Substack',
        niches: ['other'],
        nicheOther: 'Local news',
      }).success,
    ).toBe(true);
  });

  it('leaves context updates that do not touch "Other" alone', () => {
    expect(
      contextStepSchema.safeParse({
        ...SESSION,
        platforms: ['youtube'],
        niches: ['tech'],
      }).success,
    ).toBe(true);
  });
});
