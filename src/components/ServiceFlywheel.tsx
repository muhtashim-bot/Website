'use client';

/*
 * The opening statement: every iFarmer service on one flywheel around the farmer. The wheel turns
 * slowly and gathers momentum when the page is scrolled, then settles back: each service keeps the
 * next one going. A green spark runs round the rim and lights each service as it passes.
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

const N = wheelStops.length;
// rounded so the server and the browser print identical coordinates
const f = (n: number) => Math.round(n * 1000) / 1000;
const R = 37; // where the services sit, in % of the wheel
const BASE = 360 / 90; // the wheel: one turn in 90 s
const SPARK = 360 / 30; // the spark: one lap in 30 s

export function ServiceFlywheel({ onPick, compact = false, dark = false, children }: { onPick?: (scene: string) => void; compact?: boolean; dark?: boolean; children?: ReactNode }) {
  const wheel = useRef<HTMLDivElement>(null);
  const spark = useRef<SVGGElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = wheel.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last = performance.now();
    let rot = -12;
    let boost = 140; // spins up on arrival, then settles
    let sparkAt = 0;
    let lastY = window.scrollY;
    let lastK = -1;
    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      boost = Math.min(260, boost + dy * 0.35);
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      boost *= Math.exp(-dt * 1.4);
      rot = (rot + (BASE + boost) * dt) % 360;
      sparkAt = (sparkAt + SPARK * dt) % 360;
      el.style.setProperty('--rot', `${rot}deg`);
      spark.current?.setAttribute('transform', `rotate(${sparkAt - 90} 50 50)`);
      // the service nearest the spark lights up
      const rel = (((sparkAt - rot) % 360) + 360) % 360;
      const k = Math.round(rel / (360 / N)) % N;
      if (k !== lastK) {
        lastK = k;
        setActive(k);
      }
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const line = dark ? 'rgba(221,255,128,' : 'rgba(94,133,43,';
  const CIRC = 2 * Math.PI * 41;
  return (
    <div className="relative aspect-square w-full">
      {/* the wheel: rim, ticks and spokes turn together */}
      <div ref={wheel} className="absolute inset-0 [--rot:-12deg]" style={{ transform: 'rotate(var(--rot))' }}>
        <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id={dark ? 'fw-rim-d' : 'fw-rim'} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={`${line}0.95)`} />
              <stop offset="0.45" stopColor={`${line}0.25)`} />
              <stop offset="0.6" stopColor={`${line}0.2)`} />
              <stop offset="1" stopColor={`${line}0.85)`} />
            </linearGradient>
          </defs>
          {/* spokes */}
          {Array.from({ length: N }, (_, i) => {
            const a = ((i * 360) / N + 360 / N / 2 - 90) * (Math.PI / 180);
            return <line key={i} x1={f(50 + 15 * Math.cos(a))} y1={f(50 + 15 * Math.sin(a))} x2={f(50 + 39 * Math.cos(a))} y2={f(50 + 39 * Math.sin(a))} stroke={`${line}0.16)`} strokeWidth="0.45" />;
          })}
          {/* the rim: a heavy band with a sheen that turns with it */}
          <circle cx="50" cy="50" r="41" fill="none" stroke={`url(#${dark ? 'fw-rim-d' : 'fw-rim'})`} strokeWidth="2.6" />
          <circle cx="50" cy="50" r="43.4" fill="none" stroke={`${line}0.14)`} strokeWidth="0.3" />
          {Array.from({ length: 90 }, (_, i) => {
            const a = (i * 4 - 90) * (Math.PI / 180);
            const long = i % 5 === 0;
            return (
              <line
                key={i}
                x1={f(50 + 43.4 * Math.cos(a))}
                y1={f(50 + 43.4 * Math.sin(a))}
                x2={f(50 + (long ? 45.6 : 44.6) * Math.cos(a))}
                y2={f(50 + (long ? 45.6 : 44.6) * Math.sin(a))}
                stroke={`${line}${long ? 0.45 : 0.22})`}
                strokeWidth={long ? 0.45 : 0.3}
              />
            );
          })}
          {/* hub */}
          <circle cx="50" cy="50" r="15" fill="none" stroke={`${line}0.3)`} strokeWidth="0.6" />
          <circle cx="50" cy="50" r="17.2" fill="none" stroke={`${line}0.12)`} strokeWidth="0.3" strokeDasharray="0.8 1.4" />
        </svg>

        {/* the services ride the wheel and stay upright */}
        {wheelStops.map((s, i) => {
          const a = ((i * 360) / N - 90) * (Math.PI / 180);
          const on = i === active;
          return (
            <div key={s.label} className="absolute z-10" style={{ left: `${f(50 + R * Math.cos(a))}%`, top: `${f(50 + R * Math.sin(a))}%`, transform: 'translate(-50%, -50%) rotate(calc(var(--rot) * -1))' }}>
              <button
                type="button"
                onClick={() => onPick?.(s.scene)}
                className={`flex flex-col items-center whitespace-nowrap rounded-full text-center transition-[background-color,color,transform,box-shadow] duration-500 ${compact ? 'px-2.5 py-1' : 'px-4 py-1.5'} ${
                  on ? 'scale-110 bg-field text-white shadow-[0_10px_28px_-8px_rgba(3,143,47,0.7)]' : dark ? 'bg-white/90 text-ink' : 'bg-white text-ink shadow-[0_8px_22px_-14px_rgba(2,43,54,0.55)] ring-1 ring-ink/[0.06]'
                }`}
              >
                <span className={`font-bold leading-tight ${compact ? 'text-[0.62rem]' : 'text-[clamp(0.76rem,0.95vw,0.92rem)]'}`}>{s.label}</span>
                {!compact && <span className={`text-[clamp(0.62rem,0.74vw,0.72rem)] font-semibold leading-tight ${on ? 'text-lime' : 'text-ink-mute'}`}>{s.via}</span>}
              </button>
            </div>
          );
        })}
      </div>

      {/* the spark runs round the rim on its own, slower than before */}
      <svg aria-hidden viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <g ref={spark} transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r="41" fill="none" stroke={dark ? '#DDFF80' : '#88BB41'} strokeWidth="2.6" strokeLinecap="round" strokeDasharray={`${f(CIRC * 0.12)} ${f(CIRC)}`} transform={`rotate(${-0.12 * 360} 50 50)`} opacity="0.95" />
          <circle cx="91" cy="50" r="1.9" fill="#DDFF80" stroke="#038F2F" strokeWidth="0.6" style={{ filter: 'drop-shadow(0 0 1.6px rgba(221,255,128,0.95))' }} />
        </g>
      </svg>

      {/* the hub: the farmer at the centre */}
      <div className={`absolute inset-[35%] flex flex-col items-center justify-center rounded-full text-center ${dark ? 'bg-[rgba(2,30,36,0.6)]' : 'bg-[radial-gradient(circle,rgba(255,253,245,1)_55%,rgba(255,253,245,0.6))]'}`}>
        {children}
      </div>
    </div>
  );
}
