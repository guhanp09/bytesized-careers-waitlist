'use client';

import { useEffect, useRef, useState } from 'react';
import { useAmbient } from './ambient-context';

/**
 * "Creator tapestry" — an original, all-over creator-economy pattern.
 *
 * This deliberately replaces the former route/constellation background. Its inspiration is
 * the visual rhythm of dense messaging-app doodle art, not any of the reference artwork's
 * individual symbols or arrangement. A deterministic field of custom creator-work glyphs
 * covers the page: capture, edit, audio, publishing, audience, collaboration, portfolios,
 * ideas and growth. A varied mix of outlines and quiet solids keeps it illustrative rather
 * than diagrammatic, while lower contrast through the content corridor protects hierarchy.
 *
 * The field is painted once to a single canvas and moves only as a very slow GPU-composited
 * sheet. There is no continuous canvas redraw. It is decorative, pointer-transparent,
 * responsive to role/progress colour, and becomes completely still for reduced motion.
 */

type RGB = [number, number, number];
type GlyphKind =
  | 'analytics'
  | 'audience'
  | 'briefcase'
  | 'camera'
  | 'chat'
  | 'collaboration'
  | 'idea'
  | 'image'
  | 'link'
  | 'microphone'
  | 'newsletter'
  | 'pen'
  | 'play'
  | 'publish'
  | 'spark'
  | 'timeline'
  | 'waveform';

interface GlyphPlacement {
  kind: GlyphKind;
  x: number;
  y: number;
  size: number;
  rotation: number;
  weight: number;
  filled: boolean;
}

const GLYPHS: GlyphKind[] = [
  'play',
  'microphone',
  'image',
  'waveform',
  'timeline',
  'camera',
  'audience',
  'chat',
  'newsletter',
  'publish',
  'collaboration',
  'briefcase',
  'analytics',
  'idea',
  'pen',
  'link',
  'spark',
];

const ROLE_RGB: Record<'seeker' | 'recruiter' | 'both', RGB> = {
  seeker: [87, 132, 222],
  recruiter: [106, 115, 219],
  both: [82, 143, 215],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  placement: GlyphPlacement,
  rgb: RGB,
  alpha: number,
  progress: number,
) {
  const { kind, x, y, size, rotation, filled } = placement;
  const scale = size / 48;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.lineWidth = 1.35 / Math.max(0.8, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${alpha})`;
  ctx.fillStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${alpha * (filled ? 0.72 : 0.42)})`;
  const paint = (useFill = filled) => {
    if (useFill) ctx.fill();
    else ctx.stroke();
  };

  switch (kind) {
    case 'play': {
      traceRoundedRect(ctx, -21, -16, 42, 32, 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.lineTo(9, 0);
      ctx.lineTo(-5, 8);
      ctx.closePath();
      paint();
      ctx.beginPath();
      ctx.moveTo(-13, 11);
      ctx.lineTo(13, 11);
      ctx.stroke();
      ctx.fillRect(-13 + progress * 24, 9.5, 2.5, 3);
      break;
    }
    case 'microphone': {
      traceRoundedRect(ctx, -8, -19, 16, 27, 8);
      paint();
      ctx.beginPath();
      ctx.moveTo(-14, 1);
      ctx.arc(0, 1, 14, Math.PI, 0, true);
      ctx.moveTo(0, 15);
      ctx.lineTo(0, 21);
      ctx.moveTo(-8, 21);
      ctx.lineTo(8, 21);
      ctx.stroke();
      break;
    }
    case 'image': {
      traceRoundedRect(ctx, -22, -17, 44, 34, 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(10, -7, 3.5, 0, Math.PI * 2);
      paint();
      ctx.beginPath();
      ctx.moveTo(-17, 12);
      ctx.lineTo(-6, 0);
      ctx.lineTo(1, 7);
      ctx.lineTo(7, 1);
      ctx.lineTo(18, 12);
      paint();
      break;
    }
    case 'waveform': {
      const heights = [10, 20, 31, 17, 27, 13, 22];
      heights.forEach((height, index) => {
        const bx = -18 + index * 6;
        if (filled) {
          traceRoundedRect(ctx, bx - 1.5, -height / 2, 3, height, 1.5);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(bx, -height / 2);
          ctx.lineTo(bx, height / 2);
          ctx.stroke();
        }
      });
      break;
    }
    case 'timeline': {
      ctx.beginPath();
      ctx.moveTo(-23, 13);
      ctx.lineTo(23, 13);
      ctx.stroke();
      [-22, -5, 10].forEach((bx, index) => {
        traceRoundedRect(ctx, bx, -10, index === 1 ? 11 : 13, 15, 3);
        paint(filled && index !== 1);
      });
      const playhead = -20 + progress * 40;
      ctx.beginPath();
      ctx.moveTo(playhead, -15);
      ctx.lineTo(playhead, 17);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(playhead - 3.5, -15);
      ctx.lineTo(playhead + 3.5, -15);
      ctx.lineTo(playhead, -10);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'camera': {
      traceRoundedRect(ctx, -21, -13, 42, 29, 5);
      paint();
      traceRoundedRect(ctx, -12, -19, 15, 7, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'audience': {
      const nodes = [
        { x: 0, y: -11, r: 5.5 },
        { x: -14, y: -5, r: 4.5 },
        { x: 14, y: -5, r: 4.5 },
      ];
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        paint();
      });
      ctx.beginPath();
      ctx.arc(0, 18, 14, Math.PI, 0);
      ctx.moveTo(-23, 17);
      ctx.arc(-14, 17, 9, Math.PI, 0);
      ctx.moveTo(5, 17);
      ctx.arc(14, 17, 9, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case 'chat': {
      traceRoundedRect(ctx, -22, -15, 44, 28, 11);
      paint();
      ctx.beginPath();
      ctx.moveTo(10, 12);
      ctx.lineTo(17, 20);
      ctx.lineTo(17, 10);
      paint();
      [-9, 0, 9].forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot, -1, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case 'newsletter': {
      traceRoundedRect(ctx, -18, -22, 36, 44, 4);
      paint();
      ctx.beginPath();
      ctx.moveTo(-9, -13);
      ctx.lineTo(9, -13);
      ctx.moveTo(-9, -6);
      ctx.lineTo(9, -6);
      ctx.moveTo(-9, 4);
      ctx.lineTo(5, 4);
      ctx.moveTo(-9, 11);
      ctx.lineTo(9, 11);
      ctx.stroke();
      break;
    }
    case 'publish': {
      ctx.beginPath();
      ctx.moveTo(-19, 15);
      ctx.lineTo(19, 15);
      ctx.moveTo(0, 11);
      ctx.lineTo(0, -17);
      ctx.moveTo(-8, -9);
      ctx.lineTo(0, -17);
      ctx.lineTo(8, -9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-16, -13);
      ctx.lineTo(-21, -18);
      ctx.moveTo(16, -13);
      ctx.lineTo(21, -18);
      ctx.moveTo(-20, -4);
      ctx.lineTo(-25, -4);
      ctx.moveTo(20, -4);
      ctx.lineTo(25, -4);
      ctx.stroke();
      break;
    }
    case 'collaboration': {
      traceRoundedRect(ctx, -23, -14, 29, 28, 8);
      paint();
      traceRoundedRect(ctx, -6, -14, 29, 28, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3, -5);
      ctx.lineTo(3, 5);
      ctx.moveTo(3, -5);
      ctx.lineTo(-3, 5);
      ctx.stroke();
      break;
    }
    case 'briefcase': {
      traceRoundedRect(ctx, -22, -13, 44, 31, 5);
      paint();
      traceRoundedRect(ctx, -8, -20, 16, 8, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-21, -3);
      ctx.lineTo(-3, 4);
      ctx.lineTo(3, 4);
      ctx.lineTo(21, -3);
      ctx.stroke();
      ctx.fillRect(-3, 1.5, 6, 5);
      break;
    }
    case 'analytics': {
      [9, 17, 27, 38].forEach((height, index) => {
        const bx = -20 + index * 12;
        traceRoundedRect(ctx, bx, 18 - height, 7, height, 2);
        paint();
      });
      ctx.beginPath();
      ctx.moveTo(-21, 10);
      ctx.lineTo(-8, 2);
      ctx.lineTo(3, 5);
      ctx.lineTo(18, -13);
      ctx.moveTo(11, -12);
      ctx.lineTo(18, -13);
      ctx.lineTo(17, -6);
      ctx.stroke();
      break;
    }
    case 'idea': {
      ctx.beginPath();
      ctx.arc(0, -5, 14, Math.PI * 0.15, Math.PI * 0.85, true);
      ctx.quadraticCurveTo(-11, 5, -7, 11);
      ctx.lineTo(-5, 15);
      ctx.lineTo(5, 15);
      ctx.lineTo(7, 11);
      ctx.quadraticCurveTo(11, 5, 14, -1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, 20);
      ctx.lineTo(5, 20);
      ctx.stroke();
      [[0, -25], [-20, -17], [20, -17], [-25, 2], [25, 2]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(dx! * 0.8, dy! * 0.8);
        ctx.lineTo(dx!, dy!);
        ctx.stroke();
      });
      break;
    }
    case 'pen': {
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(16, 8);
      ctx.lineTo(0, 21);
      ctx.lineTo(-16, 8);
      ctx.closePath();
      paint();
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(0, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 8, 3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'link': {
      ctx.save();
      ctx.rotate(-0.55);
      traceRoundedRect(ctx, -22, -8, 27, 16, 8);
      ctx.stroke();
      traceRoundedRect(ctx, -5, -8, 27, 16, 8);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'spark': {
      const outer = filled ? 22 : 20;
      ctx.beginPath();
      ctx.moveTo(0, -outer);
      ctx.quadraticCurveTo(3, -4, 15, -2);
      ctx.quadraticCurveTo(4, 3, 0, outer);
      ctx.quadraticCurveTo(-3, 4, -15, 2);
      ctx.quadraticCurveTo(-4, -3, 0, -outer);
      paint();
      ctx.beginPath();
      ctx.moveTo(16, -16);
      ctx.lineTo(22, -22);
      ctx.moveTo(-16, 16);
      ctx.lineTo(-22, 22);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

function buildField(width: number, height: number): GlyphPlacement[] {
  const narrow = width < 640;
  const cell = narrow ? 68 : width < 1000 ? 72 : 76;
  const columns = Math.ceil(width / cell) + 2;
  const rows = Math.ceil(height / cell) + 2;
  const random = mulberry32(narrow ? 0xc4ea701 : 0xb1751ed);
  const field: GlyphPlacement[] = [];
  let glyphIndex = Math.floor(random() * GLYPHS.length);

  for (let row = -1; row < rows; row++) {
    for (let column = -1; column < columns; column++) {
      const skipChance = narrow ? 0.18 : 0.1;
      if (random() < skipChance) continue;

      const offset = row % 2 === 0 ? cell * 0.24 : -cell * 0.18;
      const x = column * cell + cell / 2 + offset + (random() - 0.5) * cell * 0.3;
      const y = row * cell + cell / 2 + (random() - 0.5) * cell * 0.26;
      const baseSize = narrow ? 26 : 30;

      field.push({
        kind: GLYPHS[glyphIndex % GLYPHS.length]!,
        x,
        y,
        size: baseSize + random() * (narrow ? 15 : 22),
        rotation: (random() - 0.5) * 0.32,
        weight: random(),
        filled: random() > 0.68,
      });
      glyphIndex += 1 + Math.floor(random() * 3);

      // Small editorial marks fill occasional negative pockets and break up the grid rhythm.
      if (!narrow && random() > 0.73) {
        field.push({
          kind: random() > 0.48 ? 'spark' : 'link',
          x: x + (random() - 0.5) * cell * 0.74,
          y: y + (random() - 0.5) * cell * 0.7,
          size: 12 + random() * 10,
          rotation: (random() - 0.5) * 0.5,
          weight: random() * 0.5,
          filled: random() > 0.82,
        });
      }
    }
  }

  return field;
}

export function AmbientBackground() {
  const ambient = useAmbient();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const redrawRef = useRef<(() => void) | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true);

  const progressRef = useRef(0);
  const roleRef = useRef<'seeker' | 'recruiter' | 'both' | null>(null);

  useEffect(() => {
    progressRef.current = ambient?.progress ?? 0;
    roleRef.current = ambient?.role ?? null;
    redrawRef.current?.();
  }, [ambient?.progress, ambient?.role]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let field: GlyphPlacement[] = [];

    const render = () => {
      const progress = Math.min(1, Math.max(0, progressRef.current));
      const roleRGB = roleRef.current ? ROLE_RGB[roleRef.current] : ROLE_RGB.seeker;
      const rgb: RGB = [
        lerp(104, roleRGB[0], 0.54),
        lerp(115, roleRGB[1], 0.54),
        lerp(132, roleRGB[2], 0.54),
      ];
      const narrow = width < 640;
      const focalHalfWidth = Math.min(width * 0.29, 455);

      ctx.clearRect(0, 0, width, height);
      for (const glyph of field) {
        const horizontalDistance = Math.abs(glyph.x - width / 2);
        const withinFocalCorridor = !narrow && horizontalDistance < focalHalfWidth;
        const corridorDepth = withinFocalCorridor
          ? horizontalDistance / Math.max(1, focalHalfWidth)
          : 1;
        const hierarchy = withinFocalCorridor ? lerp(0.28, 0.68, corridorDepth) : 1;
        const baseAlpha = narrow ? 0.052 : 0.062;
        const emphasis = 0.78 + glyph.weight * 0.54;
        const progressLift = 1 + progress * 0.08;
        drawGlyph(ctx, glyph, rgb, baseAlpha * emphasis * hierarchy * progressLift, progress);
      }
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, width < 640 ? 1.25 : 1.65);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      field = buildField(width, height);
      render();
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(motionQuery.matches);
    const resizeObserver = new ResizeObserver(resize);
    redrawRef.current = render;
    resizeObserver.observe(wrap);
    motionQuery.addEventListener('change', syncMotion);
    syncMotion();
    resize();

    return () => {
      redrawRef.current = null;
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', syncMotion);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      data-ambient-paused={reducedMotion}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="creator-tapestry absolute inset-0 size-full"
      />
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
