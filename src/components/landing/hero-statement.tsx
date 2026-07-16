import { HERO } from '@/lib/copy/flow-copy';

/**
 * Act I — the opening statement. The first line's words begin at authored scattered
 * offsets and typeset into place (CSS only, transform/opacity — zero layout shift, no JS).
 * Offsets are hand-authored constants cycled across the words: deterministic markup, no
 * hydration risk. Words are real text at word granularity, so screen readers hear the
 * sentence normally. The disorder deepens toward "scattered and unstructured", then the
 * italic second line arrives already set — the resolution.
 */

type WordOffset = { dx: string; dy: string; rot: string };

// Authored per word of HERO.lineOne, quietest first, most scattered at the line's end.
const OFFSETS: WordOffset[] = [
  { dx: '-0.5em', dy: '0.3em', rot: '-1.8deg' },
  { dx: '0.35em', dy: '-0.28em', rot: '1.4deg' },
  { dx: '-0.2em', dy: '-0.4em', rot: '-1deg' },
  { dx: '0.3em', dy: '0.35em', rot: '1.2deg' },
  { dx: '-0.4em', dy: '0.25em', rot: '-1.6deg' },
  { dx: '0.55em', dy: '-0.4em', rot: '2.2deg' },
  { dx: '-0.35em', dy: '0.45em', rot: '-2.4deg' },
  { dx: '0.7em', dy: '0.5em', rot: '2.8deg' },
];

const LINE_ONE_WORDS = HERO.lineOne.split(' ');

export function HeroStatement() {
  return (
    <div className="pt-2 sm:pt-6">
      <p className="animate-fade-up font-mono text-[11px] font-medium tracking-[0.18em] uppercase text-accent">
        {HERO.eyebrow}
      </p>

      <h1 className="mt-5 font-serif text-[2rem] leading-[1.1] tracking-tight text-ink min-[400px]:text-[2.2rem] sm:text-5xl lg:text-6xl">
        <span className="block text-balance">
          {LINE_ONE_WORDS.map((word, i) => {
            const offset = OFFSETS[i % OFFSETS.length]!;
            return (
              <span
                key={i}
                className="hero-word"
                style={
                  {
                    '--dx': offset.dx,
                    '--dy': offset.dy,
                    '--rot': offset.rot,
                    '--i': i,
                  } as React.CSSProperties
                }
              >
                {word}
                {i < LINE_ONE_WORDS.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </span>
        <span className="animate-fade-up fade-delay-3 mt-3 block text-balance text-[0.82em] leading-[1.15] text-muted italic">
          {HERO.lineTwo}
        </span>
      </h1>

      <p className="animate-fade-up fade-delay-3 mt-6 max-w-xl text-base leading-relaxed text-muted text-pretty sm:text-lg">
        {HERO.subcopy}
      </p>
    </div>
  );
}
