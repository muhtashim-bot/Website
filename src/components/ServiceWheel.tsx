'use client';

/*
 * The opening statement of the homepage: the farmer at the centre, every iFarmer service around
 * them, from finance to payout and round again to the next season. A soft light sweeps the ring and
 * each service glows as it passes, while rings resonate out from the farmer at the centre.
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
const PERIOD = 28; // seconds for the light to sweep round once
const N = wheelStops.length;
const STEP = 360 / N;
// rounded so the server and the browser print identical coordinates
const f = (n: number) => Math.round(n * 1000) / 1000;

export function ServiceWheel({ onPick, compact = false, dark = false, children }: { onPick?: (scene: string) => void; compact?: boolean; dark?: boolean; children?: ReactNode }) {
  const sweep = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = sweep.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // the sweep turns on the compositor; the timer only reads where it is to light the right service
    const spin = el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: PERIOD * 1000, iterations: Infinity });
    const id = window.setInterval(() => {
      const deg = ((Number(spin.currentTime ?? 0) / 1000 / PERIOD) * 360) % 360;
      setActive(Math.floor((deg + 12) / STEP) % N);
    }, 150);
    return () => {
      window.clearInterval(id);
      spin.cancel();
    };
  }, []);

  const v = dark ? 'd' : 'l'; // separate ids, so a hidden copy of the wheel never owns the visible one's gradients
  const head = dark ? '#DDFF80' : '#5E9F2A';
  const glow = dark ? '#DDFF80' : '#9BD14A';

  return (
    <div className="relative aspect-square w-full">
      {/* resonance: rings born at the farmer that widen and fade before they reach the services */}
      <div aria-hidden className="absolute inset-[12%] motion-reduce:hidden">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`wheel-ripple absolute inset-0 rounded-full border ${
              dark
                ? 'border-lime/50 bg-[radial-gradient(circle,rgba(221,255,128,0)_58%,rgba(221,255,128,0.16)_100%)]'
                : 'border-leaf/55 bg-[radial-gradient(circle,rgba(221,255,128,0)_58%,rgba(221,255,128,0.3)_100%)]'
            }`}
            style={{ animationDelay: `${i * 2.4}s` }}
          />
        ))}
      </div>
      <div
        aria-hidden
        className={`absolute inset-[24%] rounded-full ${dark ? 'bg-[radial-gradient(circle,rgba(221,255,128,0.18),rgba(221,255,128,0)_70%)]' : 'bg-[radial-gradient(circle,rgba(221,255,128,0.55),rgba(221,255,128,0)_70%)]'}`}
      />

      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
        <circle cx="50" cy="50" r={R + 7} fill="none" stroke={dark ? 'rgba(255,255,255,0.1)' : 'rgba(94,133,43,0.1)'} strokeWidth="0.3" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={dark ? 'rgba(221,255,128,0.3)' : 'rgba(136,187,65,0.38)'} strokeWidth="0.6" />
        {/* direction marks between the services */}
        {wheelStops.map((_, i) => {
          const deg = i * STEP + STEP / 2 - 90;
          const rad = (deg * Math.PI) / 180;
          return (
            <path
              key={i}
              d="M -0.7 -1 L 0.5 0 L -0.7 1"
              fill="none"
              stroke={dark ? 'rgba(221,255,128,0.6)' : 'rgba(94,133,43,0.6)'}
              strokeWidth="0.45"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`translate(${f(50 + R * Math.cos(rad))} ${f(50 + R * Math.sin(rad))}) rotate(${f(deg + 90)})`}
            />
          );
        })}
      </svg>

      {/* the sweep: a lit arc that fades to nothing behind its head, turning with the season */}
      <div ref={sweep} aria-hidden className="absolute inset-0">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id={`sweep-${v}`} gradientUnits="userSpaceOnUse" x1={50 - R} y1="50" x2="50" y2={50 - R}>
              <stop offset="0" stopColor={head} stopOpacity="0" />
              <stop offset="0.65" stopColor={head} stopOpacity="0.45" />
              <stop offset="1" stopColor={head} stopOpacity="1" />
            </linearGradient>
            <linearGradient id={`sweep-glow-${v}`} gradientUnits="userSpaceOnUse" x1={50 - R} y1="50" x2="50" y2={50 - R}>
              <stop offset="0" stopColor={glow} stopOpacity="0" />
              <stop offset="1" stopColor={glow} stopOpacity="0.9" />
            </linearGradient>
            <filter id={`sweep-blur-${v}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.1" />
            </filter>
          </defs>
          <path d={`M ${50 - R} 50 A ${R} ${R} 0 0 1 50 ${50 - R}`} fill="none" stroke={`url(#sweep-glow-${v})`} strokeWidth="3.2" strokeLinecap="round" filter={`url(#sweep-blur-${v})`} />
          <path d={`M ${50 - R} 50 A ${R} ${R} 0 0 1 50 ${50 - R}`} fill="none" stroke={`url(#sweep-${v})`} strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      </div>

      {wheelStops.map((s, i) => {
        const deg = i * STEP - 90;
        const rad = (deg * Math.PI) / 180;
        const on = i === active;
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick?.(s.scene)}
            style={{ left: `${f(50 + R * Math.cos(rad))}%`, top: `${f(50 + R * Math.sin(rad))}%`, ['--k' as string]: i }}
            className={`wheel-stop absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl text-center ring-1 transition-[background-color,box-shadow,transform] duration-700 ease-out ${
              compact ? 'w-[25%] px-1 py-1.5' : 'w-[27.5%] px-2 py-2.5'
            } ${
              on
                ? 'scale-[1.05] bg-[#F7FFE6] ring-leaf shadow-[0_0_0_3px_rgba(221,255,128,0.75),0_0_26px_6px_rgba(190,240,90,0.55),0_0_60px_10px_rgba(136,187,65,0.28)]'
                : 'bg-white ring-ink/[0.06] shadow-[0_10px_26px_-18px_rgba(2,43,54,0.55)] hover:ring-leaf'
            }`}
          >
            <span className={`font-bold leading-[1.15] transition-colors duration-700 ${on ? 'text-field' : 'text-ink'} ${compact ? 'text-[0.66rem]' : 'text-[clamp(0.76rem,0.98vw,0.95rem)]'}`}>{s.label}</span>
            {!compact && <span className="mt-0.5 text-[clamp(0.64rem,0.78vw,0.75rem)] font-semibold leading-tight text-ink-mute">{s.via}</span>}
          </button>
        );
      })}

      <div className="absolute inset-[21%] flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
