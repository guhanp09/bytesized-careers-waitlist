'use client';

import { useEffect, useState } from 'react';
import { useBrief } from '@/components/brief/brief-context';

/**
 * Act I's "noise" — the margins hold scraps of how creator hiring happens today: fragments
 * of DMs, replies and referral posts, barely legible, drifting very slowly. As the brief
 * fills (funnel progress), the whole layer quiets down: the noise literally recedes.
 *
 * Craft constraints: authored positions (deterministic markup, no hydration risk), a hard
 * DOM budget (10 desktop / 4 mobile), one shared compositor-only keyframe pair — no rAF
 * loops, no canvas. Hidden tabs aren't painted by the browser, and the global reduced-motion
 * rule freezes the drift into a still composition. Decorative: aria-hidden, pointer-through.
 * Keeps the `data-ambient-paused` contract from the previous background.
 */

interface Scrap {
  text: string;
  top: string;
  left?: string;
  right?: string;
  rot: string;
  anim: 'bsc-drift-a' | 'bsc-drift-b';
  dur: string;
  delay: string;
  /** Hidden below lg to keep small screens calm and cheap. */
  desktopOnly?: boolean;
}

const SCRAPS: Scrap[] = [
  { text: 'any editors free this wk?? dm me', top: '9%', left: '3%', rot: '-2.5deg', anim: 'bsc-drift-a', dur: '34s', delay: '0s' },
  { text: 'bump — still looking 🙏', top: '30%', left: '5%', rot: '1.8deg', anim: 'bsc-drift-b', dur: '41s', delay: '-8s', desktopOnly: true },
  { text: 'ref’d by a friend of a friend, no portfolio yet', top: '52%', left: '2%', rot: '-1.2deg', anim: 'bsc-drift-a', dur: '38s', delay: '-16s', desktopOnly: true },
  { text: 'pinned: hiring?? check bio', top: '74%', left: '6%', rot: '2.2deg', anim: 'bsc-drift-b', dur: '44s', delay: '-4s' },
  { text: 'who edits ur shorts? asking for a brand', top: '14%', right: '4%', rot: '2.6deg', anim: 'bsc-drift-b', dur: '36s', delay: '-12s' },
  { text: 'replied too late, role gone', top: '38%', right: '2%', rot: '-1.8deg', anim: 'bsc-drift-a', dur: '42s', delay: '-20s', desktopOnly: true },
  { text: 'dm’d 14 people. two replies.', top: '60%', right: '5%', rot: '1.4deg', anim: 'bsc-drift-b', dur: '39s', delay: '-6s', desktopOnly: true },
  { text: 'thread: how do you even find thumbnail ppl', top: '82%', right: '3%', rot: '-2.1deg', anim: 'bsc-drift-a', dur: '35s', delay: '-14s' },
  { text: 'comment “interested” below', top: '92%', left: '38%', rot: '1deg', anim: 'bsc-drift-b', dur: '43s', delay: '-10s', desktopOnly: true },
  { text: 'lost the guy’s handle, anyone know him?', top: '3%', left: '42%', rot: '-1.5deg', anim: 'bsc-drift-a', dur: '40s', delay: '-18s', desktopOnly: true },
];

export function ScrapsLayer() {
  const brief = useBrief();
  const progress = brief?.progress ?? 0;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // The noise recedes as the brief fills; a faint residue always remains.
  const layerOpacity = Math.max(0.15, 0.95 - progress * 1.05);

  return (
    <div
      aria-hidden="true"
      data-ambient-paused={reducedMotion}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{ opacity: layerOpacity, transition: 'opacity 800ms ease' }}
      >
        {SCRAPS.map((scrap, i) => (
          <span
            key={i}
            className={`scrap ${scrap.desktopOnly ? 'hidden lg:block' : ''}`}
            style={
              {
                top: scrap.top,
                left: scrap.left,
                right: scrap.right,
                '--scrap-rot': scrap.rot,
                '--scrap-anim': scrap.anim,
                '--scrap-dur': scrap.dur,
                '--scrap-delay': scrap.delay,
              } as React.CSSProperties
            }
          >
            {scrap.text}
          </span>
        ))}
      </div>

      {/* Whisper of film grain — texture without banding. */}
      <div
        className="absolute inset-0 opacity-[0.022] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '180px 180px',
        }}
      />
    </div>
  );
}
