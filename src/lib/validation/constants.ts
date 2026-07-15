/**
 * Single source of truth for all preference vocabularies (v2).
 * Values are stable snake_case keys stored in the DB; labels are display strings.
 * The server validates every selection against these lists. Changes should be ADDITIVE.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Job-seeker opportunity categories — grouped for progressive disclosure.
// ─────────────────────────────────────────────────────────────────────────────
export const JOB_CATEGORY_LABELS = {
  // Creative & production
  video_editing: 'Video editing',
  short_form_editing: 'Short-form video editing',
  long_form_editing: 'Long-form video editing',
  thumbnail_design: 'Thumbnail design',
  graphic_design: 'Graphic design',
  motion_graphics: 'Motion graphics',
  animation: 'Animation',
  photography: 'Photography',
  videography: 'Videography',
  production_assistance: 'Production assistance',
  podcast_editing: 'Podcast editing',
  audio_editing: 'Audio editing',
  sound_design: 'Sound design',
  // Writing & research
  scriptwriting: 'Scriptwriting',
  copywriting: 'Copywriting',
  content_writing: 'Content writing',
  research: 'Research',
  newsletter_writing: 'Newsletter writing',
  seo_writing: 'SEO writing',
  podcast_research: 'Podcast research',
  fact_checking: 'Fact-checking',
  // Social & community
  social_media_management: 'Social media management',
  community_management: 'Community management',
  content_scheduling: 'Content scheduling',
  audience_engagement: 'Audience engagement',
  moderation: 'Moderation',
  community_operations: 'Discord / community operations',
  // Creator & channel operations
  creator_management: 'Creator management',
  channel_management: 'Channel management',
  content_operations: 'Content operations',
  project_coordination: 'Project coordination',
  executive_assistance: 'Executive assistance',
  sponsorship_operations: 'Sponsorship operations',
  publishing_operations: 'Publishing operations',
  // Strategy & growth
  content_strategy: 'Content strategy',
  youtube_strategy: 'YouTube strategy',
  instagram_strategy: 'Instagram strategy',
  growth_marketing: 'Growth marketing',
  performance_marketing: 'Performance marketing',
  seo: 'SEO',
  analytics: 'Analytics',
  audience_insights: 'Audience insights',
  creator_partnerships: 'Creator partnerships',
  influencer_marketing: 'Influencer marketing',
  brand_partnerships: 'Brand partnerships',
  // Business & technical
  sales: 'Sales',
  account_management: 'Account management',
  talent_management: 'Talent management',
  product_management: 'Product management',
  web_development: 'Web development',
  no_code_automation: 'No-code automation',
  ai_workflow_automation: 'AI workflow automation',
  data_analysis: 'Data analysis',
  // Section-specific "Other" (one per group).
  creative_production_other: 'Other',
  writing_research_other: 'Other',
  social_community_other: 'Other',
  creator_channel_ops_other: 'Other',
  strategy_growth_other: 'Other',
  business_technical_other: 'Other',
} as const;

export type JobCategory = keyof typeof JOB_CATEGORY_LABELS;
export const JOB_CATEGORY_VALUES = Object.keys(JOB_CATEGORY_LABELS) as JobCategory[];

export interface CategoryGroup<T extends string> {
  id: string;
  label: string;
  values: T[];
}

export const JOB_CATEGORY_GROUPS: CategoryGroup<JobCategory>[] = [
  {
    id: 'creative_production',
    label: 'Creative & production',
    values: [
      'video_editing', 'short_form_editing', 'long_form_editing', 'thumbnail_design',
      'graphic_design', 'motion_graphics', 'animation', 'photography', 'videography',
      'production_assistance', 'podcast_editing', 'audio_editing', 'sound_design',
    ],
  },
  {
    id: 'writing_research',
    label: 'Writing & research',
    values: [
      'scriptwriting', 'copywriting', 'content_writing', 'research',
      'newsletter_writing', 'seo_writing', 'podcast_research', 'fact_checking',
    ],
  },
  {
    id: 'social_community',
    label: 'Social & community',
    values: [
      'social_media_management', 'community_management', 'content_scheduling',
      'audience_engagement', 'moderation', 'community_operations',
    ],
  },
  {
    id: 'creator_channel_ops',
    label: 'Creator & channel operations',
    values: [
      'creator_management', 'channel_management', 'content_operations',
      'project_coordination', 'executive_assistance', 'sponsorship_operations',
      'publishing_operations',
    ],
  },
  {
    id: 'strategy_growth',
    label: 'Strategy & growth',
    values: [
      'content_strategy', 'youtube_strategy', 'instagram_strategy', 'growth_marketing',
      'performance_marketing', 'seo', 'analytics', 'audience_insights',
      'creator_partnerships', 'influencer_marketing', 'brand_partnerships',
    ],
  },
  {
    id: 'business_technical',
    label: 'Business & technical',
    values: [
      'sales', 'account_management', 'talent_management', 'product_management',
      'web_development', 'no_code_automation', 'ai_workflow_automation',
      'data_analysis',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Recruiter talent categories — hiring language, grouped to match the seeker richness.
// Group ids mirror the job-seeker groups so accordions + icons stay consistent.
// ─────────────────────────────────────────────────────────────────────────────
export const TALENT_CATEGORY_LABELS = {
  // Creative & production talent
  video_editors: 'Video editors',
  short_form_editors: 'Short-form video editors',
  long_form_editors: 'Long-form video editors',
  thumbnail_designers: 'Thumbnail designers',
  graphic_designers: 'Graphic designers',
  motion_designers: 'Motion designers',
  animators: 'Animators',
  photographers: 'Photographers',
  videographers: 'Videographers',
  production_assistants: 'Production assistants',
  podcast_editors: 'Podcast editors',
  audio_editors: 'Audio editors',
  sound_designers: 'Sound designers',
  // Writing & research talent
  scriptwriters: 'Scriptwriters',
  copywriters: 'Copywriters',
  content_writers: 'Content writers',
  researchers: 'Researchers',
  newsletter_writers: 'Newsletter writers',
  seo_writers: 'SEO writers',
  fact_checkers: 'Fact-checkers',
  // Social & community talent
  social_media_managers: 'Social media managers',
  community_managers: 'Community managers',
  moderators: 'Moderators',
  content_schedulers: 'Content schedulers',
  engagement_specialists: 'Engagement specialists',
  // Creator & channel operations talent
  creator_managers: 'Creator managers',
  channel_managers: 'Channel managers',
  operations_specialists: 'Operations specialists',
  project_coordinators: 'Project coordinators',
  executive_assistants: 'Executive assistants',
  sponsorship_coordinators: 'Sponsorship coordinators',
  // Strategy & growth talent
  content_strategists: 'Content strategists',
  growth_marketers: 'Growth marketers',
  performance_marketers: 'Performance marketers',
  seo_specialists: 'SEO specialists',
  analysts: 'Analysts',
  partnership_specialists: 'Partnership specialists',
  influencer_marketing_specialists: 'Influencer-marketing specialists',
  // Business & technical talent
  sales_specialists: 'Sales specialists',
  account_managers: 'Account managers',
  talent_managers: 'Talent managers',
  web_developers: 'Web developers',
  automation_specialists: 'No-code / automation specialists',
  ai_workflow_builders: 'AI workflow builders',
  // Section-specific "Other" (one per group).
  creative_production_other: 'Other',
  writing_research_other: 'Other',
  social_community_other: 'Other',
  creator_channel_ops_other: 'Other',
  strategy_growth_other: 'Other',
  business_technical_other: 'Other',
} as const;

export type TalentCategory = keyof typeof TALENT_CATEGORY_LABELS;
export const TALENT_CATEGORY_VALUES = Object.keys(
  TALENT_CATEGORY_LABELS,
) as TalentCategory[];

export const TALENT_CATEGORY_GROUPS: CategoryGroup<TalentCategory>[] = [
  {
    id: 'creative_production',
    label: 'Creative & production talent',
    values: [
      'video_editors', 'short_form_editors', 'long_form_editors', 'thumbnail_designers',
      'graphic_designers', 'motion_designers', 'animators', 'photographers', 'videographers',
      'production_assistants', 'podcast_editors', 'audio_editors', 'sound_designers',
    ],
  },
  {
    id: 'writing_research',
    label: 'Writing & research talent',
    values: [
      'scriptwriters', 'copywriters', 'content_writers', 'researchers',
      'newsletter_writers', 'seo_writers', 'fact_checkers',
    ],
  },
  {
    id: 'social_community',
    label: 'Social & community talent',
    values: [
      'social_media_managers', 'community_managers', 'moderators',
      'content_schedulers', 'engagement_specialists',
    ],
  },
  {
    id: 'creator_channel_ops',
    label: 'Creator & channel operations talent',
    values: [
      'creator_managers', 'channel_managers', 'operations_specialists',
      'project_coordinators', 'executive_assistants', 'sponsorship_coordinators',
    ],
  },
  {
    id: 'strategy_growth',
    label: 'Strategy & growth talent',
    values: [
      'content_strategists', 'growth_marketers', 'performance_marketers',
      'seo_specialists', 'analysts', 'partnership_specialists',
      'influencer_marketing_specialists',
    ],
  },
  {
    id: 'business_technical',
    label: 'Business & technical talent',
    values: [
      'sales_specialists', 'account_managers', 'talent_managers', 'web_developers',
      'automation_specialists', 'ai_workflow_builders',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Work arrangement (employment type + location) — kept in one multi-select.
// ─────────────────────────────────────────────────────────────────────────────
export const WORK_FORMAT_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  freelance: 'Freelance',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
  hybrid: 'Hybrid',
  on_site: 'On-site',
} as const;
export type WorkFormat = keyof typeof WORK_FORMAT_LABELS;
export const WORK_FORMAT_VALUES = Object.keys(WORK_FORMAT_LABELS) as WorkFormat[];

export const ORG_TYPE_LABELS = {
  individual_creator: 'Individual creator',
  creator_agency: 'Creator agency',
  influencer_marketing_agency: 'Influencer-marketing agency',
  social_media_agency: 'Social media agency',
  brand: 'Brand',
  production_house: 'Production house',
  other: 'Other',
} as const;
export type OrgType = keyof typeof ORG_TYPE_LABELS;
export const ORG_TYPE_VALUES = Object.keys(ORG_TYPE_LABELS) as OrgType[];

// ─────────────────────────────────────────────────────────────────────────────
// Shared richer context — platforms & niches (multi-select).
// ─────────────────────────────────────────────────────────────────────────────
export const PLATFORM_LABELS = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitch: 'Twitch',
  x_twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  podcast: 'Podcast',
  facebook: 'Facebook',
  snapchat: 'Snapchat',
  other: 'Other',
} as const;
export type Platform = keyof typeof PLATFORM_LABELS;
export const PLATFORM_VALUES = Object.keys(PLATFORM_LABELS) as Platform[];

export const NICHE_LABELS = {
  gaming: 'Gaming',
  beauty_fashion: 'Beauty & fashion',
  tech: 'Tech',
  finance: 'Finance',
  fitness_health: 'Fitness & health',
  education: 'Education',
  lifestyle: 'Lifestyle',
  food: 'Food & cooking',
  entertainment: 'Comedy & entertainment',
  music: 'Music',
  business: 'Business',
  travel: 'Travel',
  other: 'Other',
} as const;
export type Niche = keyof typeof NICHE_LABELS;
export const NICHE_VALUES = Object.keys(NICHE_LABELS) as Niche[];

// ─────────────────────────────────────────────────────────────────────────────
// Section-specific "Other" — one per category group (job + talent share group ids).
// ─────────────────────────────────────────────────────────────────────────────
export const CATEGORY_GROUP_IDS = [
  'creative_production',
  'writing_research',
  'social_community',
  'creator_channel_ops',
  'strategy_growth',
  'business_technical',
] as const;
export type CategoryGroupId = (typeof CATEGORY_GROUP_IDS)[number];

/** The chip value for a group's "Other" option. */
export function groupOtherValue(groupId: string): string {
  return `${groupId}_other`;
}
/** Map an "Other" chip value back to its group id (or null). */
export function otherGroupIdOf(value: string): string | null {
  return value.endsWith('_other') ? value.slice(0, -'_other'.length) : null;
}

/** Short human labels per group id (admin / CSV display). */
export const CATEGORY_GROUP_LABELS: Record<CategoryGroupId, string> = {
  creative_production: 'Creative & production',
  writing_research: 'Writing & research',
  social_community: 'Social & community',
  creator_channel_ops: 'Creator & channel ops',
  strategy_growth: 'Strategy & growth',
  business_technical: 'Business & technical',
};

/** Serialize section-specific "Other" answers into a readable "Group: text | …" string. */
export function formatCategoryOthers(map: Record<string, string> | null | undefined): string {
  if (!map) return '';
  return Object.entries(map)
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([gid, v]) => `${CATEGORY_GROUP_LABELS[gid as CategoryGroupId] ?? gid}: ${v}`)
    .join(' | ');
}

/** Contextual "Other" prompts per group + side — matches the flow's warm tone. */
export const OTHER_PROMPTS: Record<CategoryGroupId, { seeker: string; recruiter: string }> = {
  creative_production: {
    seeker: 'What kind of creative or production work did we miss?',
    recruiter: 'What kind of creative or production talent do you need?',
  },
  writing_research: {
    seeker: 'What kind of writing or research work do you have in mind?',
    recruiter: 'What kind of writing or research talent do you need?',
  },
  social_community: {
    seeker: 'What kind of social or community role are you after?',
    recruiter: 'What kind of social or community talent do you need?',
  },
  creator_channel_ops: {
    seeker: 'What kind of creator or channel-ops role did we miss?',
    recruiter: 'What kind of ops or channel talent do you need?',
  },
  strategy_growth: {
    seeker: 'What kind of strategy or growth work are you looking for?',
    recruiter: 'What kind of strategy or growth talent do you need?',
  },
  business_technical: {
    seeker: 'What kind of business or technical work did we miss?',
    recruiter: 'What kind of business or technical talent do you need?',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Single-select context fields.
// ─────────────────────────────────────────────────────────────────────────────
export const EXPERIENCE_LEVEL_LABELS = {
  entry: 'Entry level',
  junior: 'Junior (1–2 yrs)',
  mid: 'Mid (3–5 yrs)',
  senior: 'Senior (5+ yrs)',
  expert: 'Lead / expert',
} as const;
export type ExperienceLevel = keyof typeof EXPERIENCE_LEVEL_LABELS;
export const EXPERIENCE_LEVEL_VALUES = Object.keys(
  EXPERIENCE_LEVEL_LABELS,
) as ExperienceLevel[];

export const AVAILABILITY_LABELS = {
  immediately: 'Immediately',
  within_2_weeks: 'Within 2 weeks',
  within_a_month: 'Within a month',
  exploring: 'Just exploring',
} as const;
export type Availability = keyof typeof AVAILABILITY_LABELS;
export const AVAILABILITY_VALUES = Object.keys(AVAILABILITY_LABELS) as Availability[];

export const HIRING_FREQUENCY_LABELS = {
  one_off: 'One-off project',
  occasionally: 'Occasionally',
  ongoing: 'Ongoing',
  building_team: 'Building a team',
} as const;
export type HiringFrequency = keyof typeof HIRING_FREQUENCY_LABELS;
export const HIRING_FREQUENCY_VALUES = Object.keys(
  HIRING_FREQUENCY_LABELS,
) as HiringFrequency[];

export const SENIORITY_LABELS = {
  junior: 'Junior',
  mid: 'Mid-level',
  senior: 'Senior',
  mixed: 'Mixed / any',
} as const;
export type Seniority = keyof typeof SENIORITY_LABELS;
export const SENIORITY_VALUES = Object.keys(SENIORITY_LABELS) as Seniority[];

export const HIRING_TIMELINE_LABELS = {
  asap: 'ASAP',
  this_month: 'This month',
  this_quarter: 'This quarter',
  exploring: 'Just exploring',
} as const;
export type HiringTimeline = keyof typeof HIRING_TIMELINE_LABELS;
export const HIRING_TIMELINE_VALUES = Object.keys(
  HIRING_TIMELINE_LABELS,
) as HiringTimeline[];

export const TEAM_SIZE_LABELS = {
  solo: 'Solo creator',
  small: '2–5',
  medium: '6–20',
  large: '21–50',
  xlarge: '50+',
} as const;
export type TeamSize = keyof typeof TEAM_SIZE_LABELS;
export const TEAM_SIZE_VALUES = Object.keys(TEAM_SIZE_LABELS) as TeamSize[];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers.
// ─────────────────────────────────────────────────────────────────────────────
const ALL_LABELS: Record<string, string> = {
  ...JOB_CATEGORY_LABELS,
  ...TALENT_CATEGORY_LABELS,
  ...WORK_FORMAT_LABELS,
  ...ORG_TYPE_LABELS,
  ...PLATFORM_LABELS,
  ...NICHE_LABELS,
  ...EXPERIENCE_LEVEL_LABELS,
  ...AVAILABILITY_LABELS,
  ...HIRING_FREQUENCY_LABELS,
  ...SENIORITY_LABELS,
  ...HIRING_TIMELINE_LABELS,
  ...TEAM_SIZE_LABELS,
};

/** Best-effort human label for any stored preference value (admin/CSV display). */
export function labelFor(value: string): string {
  return ALL_LABELS[value] ?? value;
}

/** Max length for any custom "Other" free-text response. */
export const OTHER_TEXT_MAX = 120;
