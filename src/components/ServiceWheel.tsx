'use client';

/*
 * The opening statement of the homepage: the farmer at the centre, every iFarmer service around
 * them, from finance to payout and round again to the next season. A light circles the ring and
 * lights each service as it passes.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

export type WheelStop = { label: string; via: string; scene: string };

export const wheelStops: WheelStop[] = [
  { label: 'Crop finance', via: 'Folon, iHarvst', scene: 'finance' },
  { label: 'Inputs & machinery', via: 'KriShop, Farmer Card', scene: 'inputs' },
  { label: 'Crop advice', via: 'Folon-AI', scene: 'grow' },
  { label: 'Insurance & climate', via: 'Sensors, insurers', scene: 'grow' },
  { label: 'Market & export', via: 'Supplier Connect', scene: 'market' },
  { label: 'iFarmer Center', via: '1,200+ villages', scene: 'center' },
  { label: 'Paid at harvest', via: 'Loan settled', scene: 'paid' },
  { label: 'Next season', via: 'Stronger record', scene: 'outro' },
];

const R = 38; // ring radius, in % of the wheel
const PERIOD = 14; // seconds for the light to go round once
const N = wheelStops.length;
const CIRC = 2 * Math.PI * R;

export function ServiceWheel({ onPick, compact = false, dark = false, children }: { onPick?: (scene: string) => void; compact?: boolean; dark?: boolean; children?: ReactNode }) {
  const dot = useRef<SVGCircleElement>(null);
  const trail = useRef<SVGCircleElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last = -1;
    const t0 = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const deg = (((now - t0) / 1000 / PERIOD) * 360) % 360; // 0 = top, clockwise
      const rad = ((deg - 90) * Math.PI) / 180;
      dot.current?.setAttribute('cx', String(50 + R * Math.cos(rad)));
      dot.current?.setAttribute('cy', String(50 + R * Math.sin(rad)));
      trail.current?.setAttribute('transform', `rotate(${deg - 90 - 70} 50 50)`);
      const k = Math.round(deg / (360 / N)) % N;
      if (k !== last) {
        last = k;
        setActive(k);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative aspect-square w-full">
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="wheel-trail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#DDFF80" stopOpacity="0" />
            <stop offset="1" stopColor="#DDFF80" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={R + 6.5} fill="none" stroke={dark ? 'rgba(255,255,255,0.1)' : 'rgba(94,133,43,0.12)'} strokeWidth="0.4" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={dark ? 'rgba(221,255,128,0.35)' : 'rgba(136,187,65,0.45)'} strokeWidth="0.9" />
        {/* the lit arc behind the travelling light */}
        <circle
          ref={trail}
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={dark ? '#DDFF80' : '#88BB41'}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray={`${(CIRC * 70) / 360} ${CIRC}`}
          opacity="0.9"
          transform="rotate(-160 50 50)"
        />
        {/* direction marks between the services */}
        {wheelStops.map((_, i) => {
          const deg = i * (360 / N) + 360 / N / 2 - 90;
          const rad = (deg * Math.PI) / 180;
          return (
            <path
              key={i}
              d="M -0.9 -1.3 L 0.6 0 L -0.9 1.3"
              fill="none"
              stroke={dark ? 'rgba(221,255,128,0.7)' : '#5E852B'}
              strokeWidth="0.55"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`translate(${50 + R * Math.cos(rad)} ${50 + R * Math.sin(rad)}) rotate(${deg + 90})`}
            />
          );
        })}
        <circle ref={dot} cx="50" cy={50 - R} r="1.9" fill="#DDFF80" stroke="#038F2F" strokeWidth="0.6" style={{ filter: 'drop-shadow(0 0 1.5px rgba(221,255,128,0.95))' }} />
      </svg>

      {wheelStops.map((s, i) => {
        const deg = i * (360 / N) - 90;
        const rad = (deg * Math.PI) / 180;
        const on = i === active;
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick?.(s.scene)}
            style={{ left: `${50 + R * Math.cos(rad)}%`, top: `${50 + R * Math.sin(rad)}%`, ['--k' as string]: i }}
            className={`wheel-stop absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl text-center ring-1 transition-[background-color,box-shadow,transform] duration-300 ${
              compact ? 'w-[24%] px-1 py-1.5' : 'w-[27%] px-2 py-2'
            } ${
              on
                ? 'scale-[1.06] bg-lime shadow-[0_10px_30px_-10px_rgba(3,143,47,0.55)] ring-field'
                : 'bg-white shadow-[0_8px_24px_-16px_rgba(2,43,54,0.5)] ring-ink/[0.07] hover:ring-field'
            }`}
          >
            <span className={`font-bold leading-[1.15] text-ink ${compact ? 'text-[0.66rem]' : 'text-[clamp(0.74rem,0.95vw,0.9rem)]'}`}>{s.label}</span>
            {!compact && <span className="mt-0.5 text-[clamp(0.62rem,0.75vw,0.72rem)] font-semibold leading-tight text-ink-mute">{s.via}</span>}
          </button>
        );
      })}

      <div className="absolute inset-[21%] flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
