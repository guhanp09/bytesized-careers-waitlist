import { ImageResponse } from 'next/og';

export const shareImageSize = { width: 1200, height: 630 };
export const shareImageContentType = 'image/png';

interface ShareImageCopy {
  kicker: string;
  headline: string;
  body: string;
}

export function createShareImage({ kicker, headline, body }: ShareImageCopy) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '76px 88px',
          color: '#f2f0ec',
          background:
            'radial-gradient(circle at 84% 14%, #151d31 0, #151d31 20%, transparent 20.2%), radial-gradient(circle at 3% 100%, #171116 0, #171116 25%, transparent 25.2%), #0b0d12',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid rgba(242,240,236,0.85)',
              borderRadius: 10,
              fontSize: 42,
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ color: '#6f9bff', fontFamily: 'monospace', fontSize: 20, letterSpacing: 5, textTransform: 'uppercase' }}>
            {kicker}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1010 }}>
          <div style={{ fontSize: 68, lineHeight: 1.02, letterSpacing: -2.2 }}>{headline}</div>
          <div style={{ color: '#98999f', fontFamily: 'Arial, sans-serif', fontSize: 30, lineHeight: 1.35 }}>
            {body}
          </div>
        </div>
      </div>
    ),
    shareImageSize,
  );
}
