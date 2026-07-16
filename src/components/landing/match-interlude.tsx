import { Reveal } from './reveal';
import { INTERLUDE } from '@/lib/copy/flow-copy';

/**
 * "How a match happens" — the product shown, not explained. Two specimen briefs (one from
 * each side of the marketplace) meet across a ruled connector, the way real matches will:
 * structured intent lining up with structured need. Static, server-rendered.
 *
 * The minis share the real brief's anatomy — masthead, serif title, rules, aligned
 * label/value rows — at miniature scale, marked as SPECIMENs so they read as illustrative
 * artifacts from the same filing system, never as real records.
 */

interface MiniBrief {
  title: string;
  specimen: string;
  lines: { label: string; value: string }[];
}

const PAIRS: { left: MiniBrief; right: MiniBrief; verdict: string }[] = [
  {
    left: {
      title: 'Talent brief',
      specimen: 'Specimen A',
      lines: [
        { label: 'Work', value: 'Long-form video editing' },
        { label: 'Niche', value: 'Tech, education' },
        { label: 'Available', value: 'Within 2 weeks' },
      ],
    },
    right: {
      title: 'Hiring brief',
      specimen: 'Specimen B',
      lines: [
        { label: 'Needs', value: 'Long-form editor' },
        { label: 'Channel', value: 'YouTube · 800k subs' },
        { label: 'Timeline', value: 'This month' },
      ],
    },
    verdict: 'Matched on craft, niche and timing — an introduction, not a cold DM.',
  },
  {
    left: {
      title: 'Hiring brief',
      specimen: 'Specimen C',
      lines: [
        { label: 'Needs', value: 'Newsletter writer' },
        { label: 'Org', value: 'Creator-led brand' },
        { label: 'Voice', value: 'Warm, editorial' },
      ],
    },
    right: {
      title: 'Talent brief',
      specimen: 'Specimen D',
      lines: [
        { label: 'Work', value: 'Newsletter writing' },
        { label: 'In their words', value: 'Grant writing for creators' },
        { label: 'Experience', value: 'Senior, 5+ yrs' },
      ],
    },
    verdict: 'A need written in one brief, answered word-for-word in another.',
  },
];

function Mini({ brief }: { brief: MiniBrief }) {
  return (
    <div className="brief-paper w-full max-w-[16.5rem] p-4">
      {/* Masthead — same anatomy as the visitor's own brief. */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[8px] tracking-[0.18em] uppercase text-[color:var(--color-paper-faint)]">
          ByteSized Careers
        </p>
        <p className="font-mono text-[8px] tracking-[0.14em] uppercase text-[color:var(--color-paper-faint)]">
          {brief.specimen}
        </p>
      </div>
      <p className="mt-1.5 font-serif text-[16px] leading-tight tracking-tight text-[color:var(--color-paper-ink)]">
        {brief.title}
      </p>

      <div className="brief-rule mt-2.5 divide-y divide-[color:var(--color-paper-line)]">
        {brief.lines.map((line) => (
          <div
            key={line.label}
            className="grid grid-cols-[4.8rem_1fr] items-baseline gap-2.5 py-[7px]"
          >
            <span className="font-mono text-[8.5px] leading-[1.4] tracking-[0.12em] uppercase text-[color:var(--color-paper-faint)]">
              {line.label}
            </span>
            <span className="text-[11.5px] leading-snug text-[color:var(--color-paper-ink)] [overflow-wrap:anywhere]">
              {line.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchInterlude() {
  return (
    <section className="mt-24 border-t border-[color:var(--color-line)] pt-14 sm:mt-28">
      <Reveal>
        <p className="font-mono text-[11px] font-medium tracking-[0.18em] uppercase text-accent">
          {INTERLUDE.eyebrow}
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          {INTERLUDE.heading}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted text-pretty">
          {INTERLUDE.subcopy}
        </p>
      </Reveal>

      <div className="mt-12 flex flex-col gap-14">
        {PAIRS.map((pair, i) => (
          <Reveal key={i}>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-stretch sm:justify-center sm:gap-0">
              <div className="flex justify-center sm:rotate-[-1.5deg]">
                <Mini brief={pair.left} />
              </div>
              {/* The ruled connector — where two briefs meet. */}
              <div
                aria-hidden="true"
                className="flex items-center justify-center self-stretch py-1 sm:px-2 sm:py-0"
              >
                <span className="block h-10 w-px bg-[color:var(--color-line-strong)] sm:h-px sm:w-14" />
                <span className="absolute font-mono text-[9px] tracking-[0.2em] uppercase text-faint bg-canvas px-1.5">
                  meets
                </span>
              </div>
              <div className="flex justify-center sm:rotate-[1.5deg]">
                <Mini brief={pair.right} />
              </div>
            </div>
            <p className="mx-auto mt-5 max-w-md text-center font-mono text-[11px] leading-relaxed text-faint">
              {pair.verdict}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
