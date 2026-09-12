import React, { useEffect, useState } from 'react';

/**
 * SplashScreen
 * ────────────
 * Plays once on first page load.
 * Timeline (1.8 s total):
 *   0.0 – 0.8 s  : shield + wordmark fade-in + scale up + glow pulse begins
 *   0.8 – 1.4 s  : hold at full opacity with soft pulse
 *   1.4 – 1.8 s  : whole splash fades out → reveals the app
 *
 * When the fade-out finishes onDone() is called, removing this component.
 */
export function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    // After enter animation completes, hold briefly then fade out
    const holdTimer = setTimeout(() => setPhase('out'), 1100);
    return () => clearTimeout(holdTimer);
  }, []);

  // When the CSS fade-out transition ends, signal parent to unmount us
  const handleTransitionEnd = () => {
    if (phase === 'out') onDone();
  };

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060a12',
        /* Whole-screen fade-out over 0.7 s */
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.7s ease-in-out' : 'none',
        pointerEvents: 'none',
      }}
    >
      {/* ── Shield SVG + wordmark wrapper ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          /* Scale + fade in over 0.8 s */
          animation: 'sx-splash-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Shield logo */}
        <div style={{ position: 'relative' }}>
          {/* Outer glow ring (pulsing) */}
          <div
            style={{
              position: 'absolute',
              inset: '-18px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,255,157,0.18) 0%, transparent 70%)',
              animation: 'sx-glow-pulse 1.4s ease-in-out infinite alternate',
            }}
          />

          {/* Shield SVG */}
          <svg
            width="88"
            height="96"
            viewBox="0 0 88 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'relative', zIndex: 1 }}
          >
            {/* Shield body */}
            <path
              d="M44 4L8 18V46C8 66 24 82 44 92C64 82 80 66 80 46V18L44 4Z"
              fill="url(#shield-fill)"
              stroke="url(#shield-stroke)"
              strokeWidth="2"
            />
            {/* Inner shield highlight */}
            <path
              d="M44 14L16 25V47C16 63 28 76 44 84C60 76 72 63 72 47V25L44 14Z"
              fill="url(#shield-inner)"
              opacity="0.5"
            />
            {/* X mark */}
            <path
              d="M32 36L56 60M56 36L32 60"
              stroke="#00ff9d"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            <defs>
              <linearGradient id="shield-fill" x1="44" y1="4" x2="44" y2="92" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0d1f3c" />
                <stop offset="100%" stopColor="#060a12" />
              </linearGradient>
              <linearGradient id="shield-stroke" x1="8" y1="4" x2="80" y2="92" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00ff9d" />
                <stop offset="50%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#00ff9d" />
              </linearGradient>
              <linearGradient id="shield-inner" x1="44" y1="14" x2="44" y2="84" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00ff9d" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              fontSize: '2.25rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              background: 'linear-gradient(90deg, #00ff9d 0%, #00f0ff 50%, #00ff9d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
            }}
          >
            SHIELDX
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', 'Courier New', monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.28em',
              color: 'rgba(0,240,255,0.55)',
              marginTop: '6px',
              textTransform: 'uppercase',
            }}
          >
            Secure Command Center
          </div>
        </div>
      </div>

      {/* Scan-line progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          width: '180px',
          height: '1px',
          background: 'rgba(0,255,157,0.12)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, transparent, #00ff9d, #00f0ff, transparent)',
            animation: 'sx-scan 1.1s ease-in-out forwards',
          }}
        />
      </div>

      {/* Keyframe definitions */}
      <style>{`
        @keyframes sx-splash-enter {
          from {
            opacity: 0;
            transform: scale(0.72);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes sx-glow-pulse {
          from { opacity: 0.6; transform: scale(0.9); }
          to   { opacity: 1;   transform: scale(1.1); }
        }

        @keyframes sx-scan {
          0%   { transform: translateX(-100%); width: 60%; }
          100% { transform: translateX(250%);  width: 60%; }
        }
      `}</style>
    </div>
  );
}
