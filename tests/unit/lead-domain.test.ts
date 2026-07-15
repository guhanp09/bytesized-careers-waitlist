import { describe, expect, it } from 'vitest';
import {
  buildNeedProfile,
  buildNeedSummary,
  displayNeedGroups,
  needProfileToFormState,
  normalizeNeedProfile,
} from '@/lib/leads/needs';

describe('versioned lead needs', () => {
  it('preserves group, option order, and the matching custom response', () => {
    const profile = buildNeedProfile(
      'seeker',
      ['research', 'video_editing', 'writing_research_other'],
      { writing_research: 'Documentary archival research' },
    );
    expect(profile).toEqual({
      version: 1,
      groups: [
        { id: 'creative_production', selections: ['video_editing'], otherSelected: false, customResponse: null },
        { id: 'writing_research', selections: ['research'], otherSelected: true, customResponse: 'Documentary archival research' },
      ],
    });
    expect(displayNeedGroups(profile, 'seeker')[1]?.customResponse).toBe('Documentary archival research');
  });

  it('round-trips into the existing form/resume state without flattening sides', () => {
    const seeker = buildNeedProfile('seeker', ['content_strategy'], {});
    const recruiter = buildNeedProfile('recruiter', ['video_editors'], {});
    expect(needProfileToFormState(seeker).selections).toEqual(['content_strategy']);
    expect(needProfileToFormState(recruiter).selections).toEqual(['video_editors']);
    const summary = buildNeedSummary({ role: 'both', seekerNeeds: seeker, recruiterNeeds: recruiter });
    expect(summary.seeker).toEqual(['Content strategy']);
    expect(summary.recruiter).toEqual(['Video editors']);
  });

  it('falls back to compatibility arrays when a profile is empty or malformed', () => {
    const profile = normalizeNeedProfile(null, 'seeker', ['video_editing'], {});
    expect(profile.groups[0]?.selections).toEqual(['video_editing']);
  });
});
