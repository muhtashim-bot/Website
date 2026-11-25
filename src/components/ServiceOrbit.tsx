'use client';

/*
 * The opening statement: the farmer at the centre and every iFarmer service on a tilted orbit
 * around them, from finance to payout and on to the next season. The orbit is flattened as if
 * seen at an angle: services at the back sit smaller and softer, those at the front larger.
 * A light runs round the orbit and lights each service as it passes.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type OrbitStop = { label: string; via: string; scene: string };

export const orbitStops: OrbitStop[] = [
  { label: 'Crop finance', via: 'Folon, iHarvst', scene: 'finance' },
  { label: 'Inputs & machinery', via: 'KriShop, Farmer Card', scene: 'inputs' },
  { label: 'Crop advice', via: 'Folon-AI', scene: 'grow' },
  { label: 'Insurance & climate', via: 'Sensors, insurers', scene: 'grow' },
  { label: 'Market & export', via: 'Supplier Connect', scene: 'market' },
  { label: 'iFarmer Center', via: '1,200+ villages', scene: 'center' },
  { label: 'Paid at harvest', via: 'Loan settled', scene: 'paid' },
  { label: 'Next season', via: 'Stronger record', scene: 'outro' },
];

const W = 100;
const H = 60;
const CX = 50;
const CY = 30;
const RX = 43;
const RY = 21; // flattened: about half as tall as wide
const N = orbitStops.length;
const PERIOD = 16;

// arc-length fraction for each angle, so the comet on the stroke and the light stay together
function arcTable() {
  const steps = 720;
  const len: number[] = [0];
  let prev = { x: CX, y: CY - RY };
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const p = { x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a) };
    len.push(len[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
    prev = p;
  }
  const total = len[steps];
  return { at: (deg: number) => len[Math.round((((deg % 360) + 360) % 360) * 2)] / total };
}

export function ServiceOrbit({
  onPick,
  compact = false,
  dark = false,
  children,
}: {
  onPick?: (scene: string) => void;
  compact?: boolean;
  dark?: boolean;
  children?: ReactNode;
}) {
  const dot = useRef<HTMLSpanElement>(null);
  const comet = useRef<SVGPathElement>(null);
  const [active, setActive] = useState(0);
  const table = useMemo(arcTable, []);
  const path = `M ${CX} ${CY - RY} A ${RX} ${RY} 0 1 1 ${CX - 0.001} ${CY - RY} Z`;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last = -1;
    const t0 = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const deg = (((now - t0) / 1000 / PERIOD) * 360) % 360; // 0 = top (the back), clockwise
      const rad = ((deg - 90) * Math.PI) / 180;
      const x = CX + RX * Math.cos(rad);
      const y = CY + RY * Math.sin(rad);
      if (dot.current) {
        dot.current.style.left = `${(x / W) * 100}%`;
        dot.current.style.top = `${(y / H) * 100}%`;
      }
      comet.current?.setAttribute('stroke-dashoffset', String(-(table.at(deg) * 100 - 16)));
      const k = Math.round(deg / (360 / N)) % N;
      if (k !== last) {
        last = k;
        setActive(k);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [table]);

  const ring = dark ? 'rgba(221,255,128,' : 'rgba(94,133,43,';
  return (
    <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="orbit-depth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={`${ring}0.18)`} />
            <stop offset="1" stopColor={`${ring}0.75)`} />
          </linearGradient>
          <radialGradient id="orbit-core" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={dark ? 'rgba(2,30,36,0.7)' : 'rgba(255,253,245,0.95)'} />
            <stop offset="0.7" stopColor={dark ? 'rgba(2,30,36,0.45)' : 'rgba(255,253,245,0.7)'} />
            <stop offset="1" stopColor={dark ? 'rgba(2,30,36,0)' : 'rgba(255,253,245,0)'} />
          </radialGradient>
        </defs>
        <ellipse cx={CX} cy={CY} rx={RX - 6} ry={RY - 4} fill="url(#orbit-core)" />
        {/* outer and inner guide rings give the tilt some depth */}
        <ellipse cx={CX} cy={CY + 1.2} rx={RX + 5} ry={RY + 3.4} fill="none" stroke={`${ring}0.12)`} strokeWidth="0.25" />
        <ellipse cx={CX} cy={CY} rx={RX - 9} ry={RY - 5.5} fill="none" stroke={`${ring}0.1)`} strokeWidth="0.25" strokeDasharray="0.6 1.4" />
        <path d={path} fill="none" stroke="url(#orbit-depth)" strokeWidth="0.55" pathLength={100} />
        <path ref={comet} d={path} fill="none" stroke={dark ? '#DDFF80' : '#88BB41'} strokeWidth="1.1" strokeLinecap="round" pathLength={100} strokeDasharray="16 84" strokeDashoffset="16" />
      </svg>
      <span
        ref={dot}
        aria-hidden
        className="absolute z-[5] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime ring-2 ring-field shadow-[0_0_14px_4px_rgba(221,255,128,0.75)]"
        style={{ left: `${(CX / W) * 100}%`, top: `${((CY - RY) / H) * 100}%` }}
      />

      {orbitStops.map((s, i) => {
        const deg = i * (360 / N);
        const rad = ((deg - 90) * Math.PI) / 180;
        const depth = (Math.sin(rad) + 1) / 2; // 0 at the back, 1 at the front
        const on = i === active;
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick?.(s.scene)}
            style={{
              left: `${((CX + RX * Math.cos(rad)) / W) * 100}%`,
              top: `${((CY + RY * Math.sin(rad)) / H) * 100}%`,
              transform: `translate(-50%, -50%) scale(${(on ? 1.08 : 1) * (0.82 + depth * 0.18)})`,
              zIndex: 10 + Math.round(depth * 10),
              opacity: 0.72 + depth * 0.28,
            }}
            className={`absolute flex flex-col items-center whitespace-nowrap rounded-full text-center transition-[background-color,color,transform] duration-300 ${
              compact ? 'px-2.5 py-1' : 'px-4 py-1.5'
            } ${on ? 'bg-field text-white shadow-[0_8px_26px_-8px_rgba(3,143,47,0.65)]' : dark ? 'bg-white/90 text-ink' : 'bg-white text-ink shadow-[0_6px_20px_-14px_rgba(2,43,54,0.55)]'}`}
          >
            <span className={`font-bold leading-tight ${compact ? 'text-[0.62rem]' : 'text-[clamp(0.74rem,0.92vw,0.9rem)]'}`}>{s.label}</span>
            {!compact && (
              <span className={`text-[clamp(0.6rem,0.72vw,0.7rem)] font-semibold leading-tight ${on ? 'text-lime' : 'text-ink-mute'}`}>{s.via}</span>
            )}
          </button>
        );
      })}

      <div className="absolute inset-x-[24%] inset-y-[22%] z-[4] flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
