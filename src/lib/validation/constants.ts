/**
 * Single source of truth for the preference vocabularies (plan §4, §9, §13).
 * Values are stable snake_case keys stored in the database; labels are display strings.
 * The server validates every selection against these, so the UI and DB never drift.
 *
 * Changes should be ADDITIVE — renaming/removing a value won't retroactively update
 * historic rows (documented trade-off, plan §22).
 */

// Shared category vocabulary — used for both job (seeker) and talent (recruiter) interests.
export const CATEGORY_VALUES = [
  'video_editing',
  'thumbnail_graphic_design',
  'scriptwriting_research',
  'social_media_management',
  'creator_channel_management',
  'content_strategy',
  'community_management',
  'influencer_brand_partnerships',
  'motion_design_animation',
  'production_shooting',
  'creator_operations',
  'growth_analytics',
  'other',
] as const;

export type Category = (typeof CATEGORY_VALUES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  video_editing: 'Video editing',
  thumbnail_graphic_design: 'Thumbnail & graphic design',
  scriptwriting_research: 'Scriptwriting & research',
  social_media_management: 'Social media management',
  creator_channel_management: 'Creator / channel management',
  content_strategy: 'Content strategy',
  community_management: 'Community management',
  influencer_brand_partnerships: 'Influencer & brand partnerships',
  motion_design_animation: 'Motion design & animation',
  production_shooting: 'Production & shooting',
  creator_operations: 'Creator operations',
  growth_analytics: 'Growth & analytics',
  other: 'Other',
};

export const WORK_FORMAT_VALUES = [
  'full_time',
  'part_time',
  'freelance',
  'contract',
  'internship',
  'remote',
  'hybrid',
  'on_site',
] as const;

export type WorkFormat = (typeof WORK_FORMAT_VALUES)[number];

export const WORK_FORMAT_LABELS: Record<WorkFormat, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  freelance: 'Freelance',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
  hybrid: 'Hybrid',
  on_site: 'On-site',
};

export const ORG_TYPE_VALUES = [
  'individual_creator',
  'creator_agency',
  'influencer_marketing_agency',
  'social_media_agency',
  'brand',
  'production_house',
  'other',
] as const;

export type OrgType = (typeof ORG_TYPE_VALUES)[number];

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  individual_creator: 'Individual creator',
  creator_agency: 'Creator agency',
  influencer_marketing_agency: 'Influencer-marketing agency',
  social_media_agency: 'Social media agency',
  brand: 'Brand',
  production_house: 'Production house',
  other: 'Other',
};
