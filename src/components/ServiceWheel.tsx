'use client';

/*
 * The opening statement of the homepage: the farmer at the centre and every iFarmer service
 * revolving around them in 3D, from finance to payout and round again to the next season. The
 * carousel turns one service at a time; the one that comes to the front glows, the ones behind
 * shrink and fade. It holds still while someone points at it or tabs into it, while it is off
 * screen, and for people who prefer reduced motion.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export type WheelStop = { label: string; via: string; scene: string; icon: ReactNode };

const ic = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full" aria-hidden>
    {d}
  </svg>
);

export const wheelStops: WheelStop[] = [
  {
    label: 'Crop finance',
    via: 'Folon, iHarvst',
    scene: 'finance',
    icon: ic(
      <>
        <rect x="2.5" y="6" width="19" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.8" />
        <path d="M6 9.5h.01M18 14.5h.01" />
      </>,
    ),
  },
  {
    label: 'Inputs & machinery',
    via: 'KriShop, Farmer Card',
    scene: 'inputs',
    icon: ic(
      <>
        <circle cx="7" cy="16" r="4" />
        <circle cx="18" cy="17.5" r="2.5" />
        <path d="M5 12V6h6l2 6h5.5a1.5 1.5 0 0 1 1.5 1.5V15M11 16.5h4.5M16 12V8.5" />
      </>,
    ),
  },
  {
    label: 'Crop advice',
    via: 'Folon-AI',
    scene: 'grow',
    icon: ic(
      <>
        <path d="M4 4.5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1z" />
        <path d="M9 13.5c0-3.2 2.3-5 6-5 0 3.4-2.2 5-6 5zM9 13.5l3.2-2.8" />
      </>,
    ),
  },
  {
    label: 'Insurance & climate',
    via: 'Sensors, insurers',
    scene: 'grow',
    icon: ic(
      <>
        <path d="M3 12a9 9 0 0 1 18 0c-1.5-1.3-3-1.3-4.5 0-1.5-1.3-3-1.3-4.5 0-1.5-1.3-3-1.3-4.5 0-1.5-1.3-3-1.3-4.5 0z" />
        <path d="M12 12v6.5a2 2 0 0 1-4 0" />
      </>,
    ),
  },
  {
    label: 'Market & export',
    via: 'Supplier Connect',
    scene: 'market',
    icon: ic(
      <>
        <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.5v2.5h-7" />
        <circle cx="6.5" cy="17.5" r="1.8" />
        <circle cx="17" cy="17.5" r="1.8" />
      </>,
    ),
  },
  {
    label: 'iFarmer Center',
    via: '1,200+ villages',
    scene: 'center',
    icon: ic(
      <>
        <path d="M4.5 11.5v8h15v-8M10 19.5v-4.5h4v4.5" />
        <path d="M3 10l2-5.5h14l2 5.5c0 1.3-1 2.2-2.25 2.2S16.5 11.3 16.5 10c0 1.3-1 2.2-2.25 2.2S12 11.3 12 10c0 1.3-1 2.2-2.25 2.2S7.5 11.3 7.5 10c0 1.3-1 2.2-2.25 2.2S3 11.3 3 10z" />
      </>,
    ),
  },
  {
    label: 'Paid at harvest',
    via: 'Loan settled',
    scene: 'paid',
    icon: ic(
      <>
        <path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a1.5 1.5 0 0 0 1.5-1.5V8.5A1.5 1.5 0 0 0 19 7H5" />
        <path d="M20.5 11H17a2 2 0 0 0 0 4h3.5" />
      </>,
    ),
  },
  {
    label: 'Next season',
    via: 'Stronger record',
    scene: 'outro',
    icon: ic(
      <>
        <path d="M12 20.5V12M7 20.5h10" />
        <path d="M12 13.5c0-3.3-2.2-5.5-6-5.5 0 3.3 2.2 5.5 6 5.5zM12 11c0-3.3 2.2-5.5 6-5.5 0 3.3-2.2 5.5-6 5.5z" />
      </>,
    ),
  },
];

const N = wheelStops.length;
const STEP = (2 * Math.PI) / N;
const HOLD = 3000; // ms each service rests at the front
const TURN_MS = 1100;
// the floor the services revolve on, in % of the box: 5:4 on wide screens, square on phones
type Floor = { cy: number; rx: number; ry: number; h: number };
const WIDE: Floor = { cy: 47, rx: 35, ry: 27, h: 80 }; // cy and ry in % of height; h = height as % of width
const TALL: Floor = { cy: 50, rx: 34, ry: 31, h: 100 };
// rounded so the server and the browser print identical values
const f = (n: number) => Math.round(n * 1000) / 1000;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Where card i sits when the carousel is at position `pos` (pos = index of the card at the front). */
function seat(fl: Floor, i: number, pos: number) {
  const a = (i - pos) * STEP;
  const d = (Math.cos(a) + 1) / 2; // 1 at the front, 0 at the back
  return {
    left: `${f(50 + fl.rx * Math.sin(a))}%`,
    top: `${f(fl.cy + fl.ry * Math.cos(a))}%`,
    transform: `translate(-50%, -50%) scale(${f(0.6 + 0.5 * d)})`,
    opacity: f(0.28 + 0.72 * Math.pow(d, 1.3)),
    zIndex: 10 + Math.round(d * 20),
  };
}

export function ServiceWheel({ onPick, compact = false, dark = false, children }: { onPick?: (scene: string) => void; compact?: boolean; dark?: boolean; children?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const pos = useRef(0);
  const [step, setStep] = useState(0); // only counts up, so the carousel always turns the same way
  const [held, setHeld] = useState(false);
  const [seen, setSeen] = useState(true);
  const front = step % N;
  const v = dark ? 'd' : 'l'; // separate ids, so a hidden copy never owns the visible one's gradient
  const fl = compact ? TALL : WIDE;
  const { cy: CY, rx: RX, ry: RY, h: VH } = fl;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.intersectionRatio > 0.25), { threshold: [0, 0.25, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (held || !seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setStep((s) => s + 1);
    }, HOLD + TURN_MS);
    return () => window.clearInterval(id);
  }, [held, seen]);

  // glide from where the carousel is to the new front card; styles are written straight to the cards
  useLayoutEffect(() => {
    const from = pos.current;
    const to = step;
    if (from === to) return;
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const k = Math.min(1, (now - t0) / TURN_MS);
      pos.current = from + (to - from) * ease(k);
      cards.current.forEach((el, i) => {
        if (!el) return;
        const st = seat(fl, i, pos.current);
        el.style.left = st.left;
        el.style.top = st.top;
        el.style.transform = st.transform;
        el.style.opacity = String(st.opacity);
        el.style.zIndex = String(st.zIndex);
      });
      if (k < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [step, fl]);

  const lit = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    const y = f(((CY + RY * Math.cos(a)) * VH) / 100);
    return `M ${f(50 - RX * Math.sin(a))} ${y} A ${RX} ${f((RY * VH) / 100)} 0 0 0 ${f(50 + RX * Math.sin(a))} ${y}`;
  };

  return (
    <div
      ref={root}
      className={`relative w-full ${compact ? 'aspect-square' : 'aspect-[5/4]'}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false);
      }}
    >
      {/* the floor: a glow under the farmer and rings resonating outward across it */}
      <div aria-hidden className="absolute" style={{ left: `${50 - RX}%`, right: `${50 - RX}%`, top: `${CY - RY}%`, bottom: `${100 - CY - RY}%` }}>
        <div className={`absolute inset-[18%] rounded-[50%] ${dark ? 'bg-[radial-gradient(closest-side,rgba(221,255,128,0.2),rgba(221,255,128,0))]' : 'bg-[radial-gradient(closest-side,rgba(221,255,128,0.6),rgba(221,255,128,0))]'}`} />
        <div className="absolute inset-0 motion-reduce:hidden">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`wheel-ripple absolute inset-0 rounded-[50%] border ${
                dark
                  ? 'border-lime/50 bg-[radial-gradient(closest-side,rgba(221,255,128,0)_60%,rgba(221,255,128,0.14)_100%)]'
                  : 'border-leaf/55 bg-[radial-gradient(closest-side,rgba(221,255,128,0)_60%,rgba(221,255,128,0.28)_100%)]'
              }`}
              style={{ animationDelay: `${i * 2.4}s` }}
            />
          ))}
        </div>
      </div>

      <svg aria-hidden viewBox={`0 0 100 ${VH}`} className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`front-${v}`} x1="0" x2="1">
            <stop offset="0" stopColor={dark ? '#DDFF80' : '#88BB41'} stopOpacity="0" />
            <stop offset="0.5" stopColor={dark ? '#DDFF80' : '#5E9F2A'} stopOpacity="1" />
            <stop offset="1" stopColor={dark ? '#DDFF80' : '#88BB41'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy={f((CY * VH) / 100)} rx={RX + 6} ry={f(((RY + 7) * VH) / 100)} fill="none" stroke={dark ? 'rgba(255,255,255,0.1)' : 'rgba(94,133,43,0.12)'} strokeWidth="0.3" />
        <ellipse cx="50" cy={f((CY * VH) / 100)} rx={RX} ry={f((RY * VH) / 100)} fill="none" stroke={dark ? 'rgba(221,255,128,0.32)' : 'rgba(136,187,65,0.42)'} strokeWidth="0.55" />
        {/* the front of the carousel: a lit stretch of floor under the service in focus */}
        <path d={lit(38)} fill="none" stroke={`url(#front-${v})`} strokeWidth="1.3" strokeLinecap="round" />
      </svg>

      {/* the farmer, between the services behind and the services in front */}
      <div className="pointer-events-none absolute z-20 flex w-[40%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center" style={{ left: '50%', top: `${CY}%` }}>
        {children}
      </div>

      {wheelStops.map((s, i) => {
        const on = i === front;
        const at = seat(fl, i, 0); // first paint only; after that the glide writes the seats
        return (
          <button
            key={s.label}
            ref={(el) => {
              cards.current[i] = el;
            }}
            type="button"
            onClick={() => onPick?.(s.scene)}
            aria-current={on ? 'true' : undefined}
            style={{ ...at, ['--k' as string]: i }}
            className={`wheel-card absolute flex flex-row items-center rounded-2xl text-left ring-1 transition-[background-color,box-shadow] duration-700 ease-out ${
              compact ? 'w-[37%] gap-1.5 px-1.5 py-1.5' : 'w-[31%] gap-[clamp(0.5rem,0.7vw,0.75rem)] px-[clamp(0.55rem,0.75vw,0.8rem)] py-[clamp(0.5rem,0.65vw,0.7rem)]'
            } ${
              on
                ? 'bg-[#F7FFE6] ring-leaf shadow-[0_0_0_3px_rgba(221,255,128,0.75),0_0_26px_6px_rgba(190,240,90,0.55),0_0_60px_10px_rgba(136,187,65,0.28)]'
                : 'bg-white ring-ink/[0.06] shadow-[0_14px_30px_-18px_rgba(2,43,54,0.6)] hover:ring-leaf'
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-xl transition-colors duration-700 ${
                compact ? 'h-6 w-6 p-1' : 'h-[clamp(2rem,2.6vw,2.6rem)] w-[clamp(2rem,2.6vw,2.6rem)] p-[clamp(0.38rem,0.5vw,0.5rem)]'
              } ${on ? 'bg-field text-lime' : 'bg-mint text-field'}`}
            >
              {s.icon}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className={`font-bold leading-[1.15] transition-colors duration-700 ${on ? 'text-field' : 'text-ink'} ${compact ? 'text-[0.7rem]' : 'text-[clamp(0.72rem,0.92vw,0.88rem)]'}`}>{s.label}</span>
              {!compact && <span className="mt-0.5 text-[clamp(0.62rem,0.74vw,0.72rem)] font-semibold leading-tight text-ink-mute">{s.via}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
