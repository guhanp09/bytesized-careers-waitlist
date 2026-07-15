import pg from 'pg';
import { buildNeedProfile } from '@/lib/leads/needs';
import type { NeedProfileV1 } from '@/types/lead-domain';
import type { CompletionStatus, Role } from '@/types/waitlist';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');
const target = new URL(connectionString);
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(target.hostname)) {
  throw new Error('Representative admin data may only be written to local PostgreSQL.');
}

type EmailStatus = 'unverified' | 'pending' | 'verified' | 'bounced';
type PhoneStatus = 'unverified' | 'pending' | 'verified';

interface DemoLead {
  email: string;
  fullName: string | null;
  role: Role | null;
  completion: CompletionStatus;
  meaningful: string;
  emailStatus: EmailStatus;
  phone?: string;
  phoneStatus?: PhoneStatus;
  seeker?: NeedProfileV1;
  recruiter?: NeedProfileV1;
  workFormats?: string[];
  organisations?: string[];
  platforms?: string[];
  niches?: string[];
  platformOther?: string;
  nicheOther?: string;
  experience?: string;
  availability?: string;
  portfolio?: string;
  hiringTimeline?: string;
  teamSize?: string;
  company?: string;
  note?: string;
  daysAgo: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

const examples: DemoLead[] = [
  {
    email: 'admin-demo.seeker@example.test', fullName: 'Aarav Menon', role: 'seeker', completion: 'completed', meaningful: 'completed', emailStatus: 'verified',
    phone: '+919900000101', phoneStatus: 'verified', daysAgo: 1, utmSource: 'linkedin', utmMedium: 'organic-social', utmCampaign: 'founding-talent', referrer: 'https://linkedin.example.test/post/launch',
    seeker: buildNeedProfile('seeker', ['video_editing', 'scriptwriting', 'writing_research_other'], { writing_research: 'Long-form documentary fact-checking' }),
    workFormats: ['remote', 'freelance'], platforms: ['youtube'], niches: ['tech'], experience: 'mid', availability: 'within_2_weeks', portfolio: 'https://portfolio.example.test/editor',
    note: 'Looking for ongoing long-form editing work with technology or finance creators.\n\nRemote is ideal, and I can start within two weeks.',
  },
  {
    email: 'admin-demo.recruiter@example.test', fullName: 'Priya Shah', role: 'recruiter', completion: 'completed', meaningful: 'completed', emailStatus: 'unverified',
    daysAgo: 3, utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'agency-preview',
    recruiter: buildNeedProfile('recruiter', ['video_editors', 'researchers', 'channel_managers']), organisations: ['creator_agency'], platforms: ['youtube', 'podcast'], niches: ['finance'], hiringTimeline: 'this_month', teamSize: 'small', company: 'https://agency.example.test',
    note: 'Hiring a research-led YouTube editor who can own weekly finance explainers and coordinate with a small scripting team.',
  },
  {
    email: 'admin-demo.both@example.test', fullName: 'Mira Iyer', role: 'both', completion: 'completed', meaningful: 'completed', emailStatus: 'verified',
    phone: '+919900000102', daysAgo: 5, utmSource: 'community', utmMedium: 'referral', utmCampaign: 'creator-circle', referrer: 'https://community.example.test/bytesized',
    seeker: buildNeedProfile('seeker', ['content_strategy', 'analytics']), recruiter: buildNeedProfile('recruiter', ['video_editors', 'researchers']),
    workFormats: ['remote', 'contract'], organisations: ['brand'], platforms: ['youtube'], niches: ['business'],
    note: 'I consult on channel strategy and am also building a flexible bench of editors and researchers for client launches this quarter.',
  },
  {
    email: 'admin-demo.partial@example.test', fullName: 'Noor Fernandes', role: 'seeker', completion: 'partial', meaningful: 'needs', emailStatus: 'pending',
    daysAgo: 0, utmSource: 'instagram', utmMedium: 'organic-social', utmCampaign: 'talent-teaser', seeker: buildNeedProfile('seeker', ['thumbnail_design']),
  },
  {
    email: 'admin-demo.email-only@example.test', fullName: 'Sana Rao', role: null, completion: 'email_only', meaningful: 'email', emailStatus: 'unverified',
    daysAgo: 2, utmSource: 'product-hunt', utmMedium: 'referral', utmCampaign: 'early-access', referrer: 'https://product.example.test/bytesized',
  },
  {
    email: 'admin-demo.custom-context@example.test', fullName: 'Lena Ortiz', role: 'both', completion: 'completed', meaningful: 'completed', emailStatus: 'verified',
    daysAgo: 8, utmSource: 'direct-demo',
    seeker: buildNeedProfile('seeker', ['creative_production_other', 'business_technical_other'], { creative_production: 'Virtual production pre-visualisation', business_technical: 'Creator CRM architecture' }),
    recruiter: buildNeedProfile('recruiter', ['writing_research_other', 'strategy_growth_other'], { writing_research: 'Investigative podcast researchers', strategy_growth: 'Subscription retention specialist' }),
    workFormats: ['contract'], organisations: ['production_house'], platforms: ['podcast', 'other'], platformOther: 'Private member audio feed', niches: ['education', 'other'], nicheOther: 'Media literacy',
    note: 'Testing a niche documentary-podcast studio model.\n\nI want project work designing the operational system while hiring researchers with source-verification experience and a specialist who understands paid subscription retention.',
  },
  {
    email: 'admin-demo.multi-seeker@example.test', fullName: 'Theo Williams', role: 'seeker', completion: 'completed', meaningful: 'completed', emailStatus: 'verified',
    daysAgo: 13, utmSource: 'linkedin', utmMedium: 'paid-social', utmCampaign: 'founding-talent',
    seeker: buildNeedProfile('seeker', ['short_form_video_editing', 'motion_graphics', 'copywriting', 'community_management', 'creator_operations', 'growth_marketing', 'ai_workflow_automation']),
    workFormats: ['full_time', 'remote'], platforms: ['instagram', 'youtube', 'linkedin'], niches: ['business', 'tech'], experience: 'senior', availability: 'within_a_month', portfolio: 'https://portfolio.example.test/multi',
    note: 'Most interested in a senior creator-operations role where motion, systems, and audience growth overlap.',
  },
  {
    email: 'admin-demo.research-hiring@example.test', fullName: 'Anika Bose', role: 'recruiter', completion: 'partial', meaningful: 'context', emailStatus: 'verified',
    phone: '+919900000103', daysAgo: 20, utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'agency-preview',
    recruiter: buildNeedProfile('recruiter', ['researchers', 'fact_checkers', 'scriptwriters']), organisations: ['production_house'], platforms: ['youtube'], niches: ['education'], hiringTimeline: 'this_quarter', teamSize: 'medium', company: 'https://studio.example.test',
  },
  {
    email: 'admin-demo.phone-pending@example.test', fullName: 'Camille Dubois', role: 'seeker', completion: 'completed', meaningful: 'completed', emailStatus: 'verified',
    phone: '+919900000104', phoneStatus: 'pending', daysAgo: 27, utmSource: 'instagram', utmMedium: 'organic-social', utmCampaign: 'talent-teaser',
    seeker: buildNeedProfile('seeker', ['social_media_management', 'community_management']), workFormats: ['freelance', 'hybrid'], platforms: ['instagram', 'tiktok'], niches: ['beauty_fashion'],
  },
  {
    email: 'admin-demo.bounced@example.test', fullName: 'Jordan Kim', role: 'recruiter', completion: 'email_only', meaningful: 'email', emailStatus: 'bounced',
    daysAgo: 34, utmSource: 'event', utmMedium: 'qr', utmCampaign: 'creator-meetup',
  },
  {
    email: 'admin-demo.creator-manager@example.test', fullName: 'Ravi Patel', role: 'both', completion: 'completed', meaningful: 'completed', emailStatus: 'unverified',
    phone: '+919900000105', daysAgo: 45, utmSource: 'community', utmMedium: 'referral', utmCampaign: 'creator-circle',
    seeker: buildNeedProfile('seeker', ['creator_management', 'brand_partnerships']), recruiter: buildNeedProfile('recruiter', ['thumbnail_designers', 'social_media_managers']),
    workFormats: ['contract'], organisations: ['individual_creator'], platforms: ['youtube', 'instagram'], niches: ['lifestyle', 'travel'],
    note: 'I manage one travel creator and want to take on another account while hiring specialist design and social support for the current channel.',
  },
  {
    email: 'admin-demo.direct@example.test', fullName: 'Devon Lee', role: 'seeker', completion: 'partial', meaningful: 'role', emailStatus: 'unverified',
    daysAgo: 62,
  },
  {
    email: 'admin-demo.legacy-no-name@example.test', fullName: null, role: null, completion: 'email_only', meaningful: 'email', emailStatus: 'unverified',
    daysAgo: 70,
  },
];

const emptySeeker = buildNeedProfile('seeker');
const emptyRecruiter = buildNeedProfile('recruiter');
const hours = 60 * 60 * 1000;
const days = 24 * hours;

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    for (const item of examples) {
      const createdAt = new Date(Date.now() - item.daysAgo * days - 2 * hours);
      const updatedAt = new Date(createdAt.getTime() + (item.completion === 'completed' ? 75 : 20) * 60 * 1000);
      const completedAt = item.completion === 'completed' ? updatedAt : null;
      const emailVerifiedAt = item.emailStatus === 'verified' ? new Date(createdAt.getTime() + 12 * 60 * 1000) : null;
      const emailRequestedAt = item.emailStatus !== 'unverified' ? new Date(createdAt.getTime() + 5 * 60 * 1000) : null;
      const phoneStatus = item.phoneStatus ?? 'unverified';
      const phoneRequestedAt = item.phone && phoneStatus !== 'unverified' ? new Date(createdAt.getTime() + 40 * 60 * 1000) : null;
      const phoneVerifiedAt = phoneStatus === 'verified' ? new Date(createdAt.getTime() + 45 * 60 * 1000) : null;
      const step = item.completion === 'completed' ? 8 : item.completion === 'email_only' ? 1 : item.meaningful === 'context' ? 5 : item.meaningful === 'needs' ? 3 : 2;

      await client.query(
        `insert into waitlist_leads (
          id, original_email, normalized_email, full_name, role, seeker_needs, recruiter_needs,
          lead_data_version, work_formats, organisation_types, platforms, niches,
          platform_other, niche_other, experience_level, availability_to_start,
          portfolio_url, hiring_timeline, team_size, company_url, additional_notes,
          phone_e164, phone_country_iso, phone_verification_status,
          phone_verification_requested_at, phone_verification_last_sent_at, phone_verified_at,
          email_verification_status, email_verification_requested_at,
          email_verification_sent_at, email_verified_at,
          completion_status, last_completed_step, last_meaningful_step,
          source, utm_source, utm_medium, utm_campaign, referrer,
          created_at, updated_at, completed_at
        ) values (
          $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,2,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$24,$25,$26,$27,$27,$28,$29,$30,$31,
          'admin-demo',$32,$33,$34,$35,$36,$37,$38
        ) on conflict (normalized_email) do update set
          full_name=coalesce(excluded.full_name, waitlist_leads.full_name),
          role=excluded.role, seeker_needs=excluded.seeker_needs, recruiter_needs=excluded.recruiter_needs,
          lead_data_version=2, work_formats=excluded.work_formats,
          organisation_types=excluded.organisation_types, platforms=excluded.platforms,
          niches=excluded.niches, platform_other=excluded.platform_other, niche_other=excluded.niche_other,
          experience_level=excluded.experience_level, availability_to_start=excluded.availability_to_start,
          portfolio_url=excluded.portfolio_url, hiring_timeline=excluded.hiring_timeline,
          team_size=excluded.team_size, company_url=excluded.company_url,
          additional_notes=excluded.additional_notes, phone_e164=excluded.phone_e164,
          phone_country_iso=excluded.phone_country_iso,
          phone_verification_status=excluded.phone_verification_status,
          phone_verification_requested_at=excluded.phone_verification_requested_at,
          phone_verification_last_sent_at=excluded.phone_verification_last_sent_at,
          phone_verified_at=excluded.phone_verified_at,
          email_verification_status=excluded.email_verification_status,
          email_verification_requested_at=excluded.email_verification_requested_at,
          email_verification_sent_at=excluded.email_verification_sent_at,
          email_verified_at=excluded.email_verified_at,
          completion_status=excluded.completion_status,
          last_completed_step=excluded.last_completed_step,
          last_meaningful_step=excluded.last_meaningful_step,
          utm_source=excluded.utm_source, utm_medium=excluded.utm_medium,
          utm_campaign=excluded.utm_campaign, referrer=excluded.referrer,
          created_at=excluded.created_at, updated_at=excluded.updated_at,
          completed_at=excluded.completed_at
        where waitlist_leads.source = 'admin-demo'`,
        [
          crypto.randomUUID(), item.email, item.email, item.fullName, item.role,
          JSON.stringify(item.seeker ?? emptySeeker), JSON.stringify(item.recruiter ?? emptyRecruiter),
          item.workFormats ?? [], item.organisations ?? [], item.platforms ?? [], item.niches ?? [],
          item.platformOther ?? null, item.nicheOther ?? null, item.experience ?? null,
          item.availability ?? null, item.portfolio ?? null, item.hiringTimeline ?? null,
          item.teamSize ?? null, item.company ?? null, item.note ?? null,
          item.phone ?? null, item.phone ? 'IN' : null, phoneStatus,
          phoneRequestedAt, phoneVerifiedAt, item.emailStatus, emailRequestedAt,
          emailVerifiedAt, item.completion, step, item.meaningful,
          item.utmSource ?? null, item.utmMedium ?? null, item.utmCampaign ?? null,
          item.referrer ?? null, createdAt, updatedAt, completedAt,
        ],
      );
    }
    console.log(`Representative admin leads upserted: ${examples.length}`);
    console.log(`Sanitized target: ${target.hostname}:${target.port || '5432'}/${target.pathname.slice(1)}`);
  } finally {
    await client.end();
  }
}

void main();
