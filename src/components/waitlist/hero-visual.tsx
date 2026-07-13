'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * "Signal Field" ambient hero visual (plan §7, §8). Small modular fragments — scattered
 * creator-economy "signals" — drift gently in the background. Purely decorative
 * (aria-hidden), low-opacity, never overlapping the form column, and static under
 * reduced-motion. Positions are fixed (deterministic) to avoid hydration mismatch.
 */
interface Fragment {
  left: string;
  top: string;
  size: number;
  drift: number;
  rotate: number;
  opacity: number;
  duration: number;
  delay: number;
}

// Kept toward the edges/top so the central form column stays clear.
const FRAGMENTS: Fragment[] = [
  { left: '6%', top: '12%', size: 34, drift: -12, rotate: -6, opacity: 0.18, duration: 11, delay: 0 },
  { left: '14%', top: '38%', size: 22, drift: 10, rotate: 4, opacity: 0.14, duration: 13, delay: 1.5 },
  { left: '9%', top: '62%', size: 28, drift: -8, rotate: 8, opacity: 0.12, duration: 12, delay: 0.8 },
  { left: '22%', top: '18%', size: 18, drift: 9, rotate: -3, opacity: 0.13, duration: 14, delay: 2.2 },
  { left: '82%', top: '10%', size: 30, drift: -10, rotate: 5, opacity: 0.17, duration: 12.5, delay: 0.4 },
  { left: '90%', top: '34%', size: 24, drift: 12, rotate: -7, opacity: 0.14, duration: 13.5, delay: 1.1 },
  { left: '86%', top: '58%', size: 20, drift: -9, rotate: 3, opacity: 0.12, duration: 11.5, delay: 2 },
  { left: '76%', top: '24%', size: 16, drift: 8, rotate: 6, opacity: 0.1, duration: 15, delay: 1.7 },
  { left: '50%', top: '6%', size: 22, drift: -8, rotate: -4, opacity: 0.1, duration: 14, delay: 0.6 },
  { left: '68%', top: '70%', size: 26, drift: 10, rotate: 5, opacity: 0.11, duration: 12, delay: 2.4 },
];

export function HeroVisual() {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(91,140,255,0.10) 0%, rgba(91,140,255,0) 70%)',
        }}
      />
      {FRAGMENTS.map((fragment, index) => (
        <motion.span
          key={index}
          className="absolute rounded-[5px] border border-accent/20 bg-accent/[0.04]"
          style={{
            left: fragment.left,
            top: fragment.top,
            width: fragment.size,
            height: Math.round(fragment.size * 0.66),
            opacity: fragment.opacity,
          }}
          animate={
            reduce
              ? undefined
              : {
                  y: [0, fragment.drift, 0],
                  rotate: [fragment.rotate, fragment.rotate + 3, fragment.rotate],
                  opacity: [
                    fragment.opacity,
                    fragment.opacity * 1.5,
                    fragment.opacity,
                  ],
                }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: fragment.duration,
                  delay: fragment.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        />
      ))}
    </div>
  );
}
