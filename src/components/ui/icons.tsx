import { cn } from '@/lib/utils/cn';

/**
 * Small, consistent stroke-icon set (v2 refinement). 24px grid, currentColor, 1.6 stroke,
 * round joins — tuned to the dark, minimal aesthetic. Decorative by default (aria-hidden).
 */
export interface IconProps {
  className?: string;
}

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('size-5 shrink-0', className)}
    >
      {children}
    </svg>
  );
}

export const BriefcaseIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
  </Svg>
);

export const UserPlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="7.5" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0M19 8v6M16 11h6" />
  </Svg>
);

export const SparklesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l1.7 4.6L18.3 9.3 13.7 11 12 15.6 10.3 11 5.7 9.3l4.6-1.7z" />
    <path d="M18.5 15l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
  </Svg>
);

export const FilmIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 4v16M16 4v16" />
  </Svg>
);

export const PenIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Svg>
);

export const UsersIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.4a3 3 0 0 1 0 5.2M21 20a6 6 0 0 0-4-5.6" />
  </Svg>
);

export const SlidersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 21v-6M4 11V3M12 21v-8M12 9V3M20 21v-4M20 13V3M2 15h4M10 9h4M18 17h4" />
  </Svg>
);

export const TrendingUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8M17 7h4v4" />
  </Svg>
);

export const CodeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />
  </Svg>
);

export const CompassIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </Svg>
);

export const ShieldCheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);

export const LayersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 13l9 5 9-5" />
  </Svg>
);

export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" />
  </Svg>
);

export const MessageIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
  </Svg>
);

export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </Svg>
);

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

/** Icon per taxonomy group id (shared by job-seeker + recruiter accordions). */
export const GROUP_ICON: Record<string, (p: IconProps) => React.ReactElement> = {
  creative_production: FilmIcon,
  writing_research: PenIcon,
  social_community: UsersIcon,
  creator_channel_ops: SlidersIcon,
  strategy_growth: TrendingUpIcon,
  business_technical: CodeIcon,
};
