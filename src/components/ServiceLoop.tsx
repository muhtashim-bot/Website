'use client';

/*
 * The opening statement of the homepage: every service iFarmer runs, from finance to payout,
 * drawn as one closed loop that starts again next season. A light travels round the loop.
 */
import { useEffect, useRef, useState } from 'react';

export type LoopStop = { label: string; via: string; scene: string };

export const loopStops: LoopStop[] = [
  { label: 'Crop finance', via: 'Folon, iHarvst, banks', scene: 'finance' },
  { label: 'Inputs & machinery', via: 'KriShop, Farmer Card', scene: 'inputs' },
  { label: 'Crop advice', via: 'Folon-AI, agronomists', scene: 'grow' },
  { label: 'Insurance & climate', via: 'Sensors, insurers', scene: 'grow' },
  { label: 'Market & export', via: 'Supplier Connect', scene: 'market' },
  { label: 'iFarmer Center', via: '1,200+ in villages', scene: 'center' },
  { label: 'Paid at harvest', via: 'Loan settled from sale', scene: 'paid' },
  { label: 'Next season', via: 'A stronger record', scene: 'outro' },
];

// top row left to right (stops 0-3), bottom row right to left (stops 4-7), so the loop reads clockwise
const cell = (k: number) => (k < 4 ? { col: k, row: 0 } : { col: 7 - k, row: 1 });

export function ServiceLoop({ onPick, compact = false }: { onPick?: (scene: string) => void; compact?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // a stadium-shaped track through the centres of the two rows
  const { w, h } = size;
  const x0 = w / 8;
  const x1 = (w * 7) / 8;
  const y0 = h / 4;
  const y1 = (h * 3) / 4;
  const r = (y1 - y0) / 2;
  const d = w ? `M ${x0} ${y0} H ${x1} A ${r} ${r} 0 0 1 ${x1} ${y1} H ${x0} A ${r} ${r} 0 0 1 ${x0} ${y0} Z` : '';

  return (
    <div ref={box} className="relative">
      {w > 0 && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={w} height={h}>
          <path d={d} fill="none" stroke="#88BB41" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
          {/* direction marks on the two bends */}
          <path d={`M ${x1 + r - 4} ${(y0 + y1) / 2 - 6} l 4 7 l 4 -7`} fill="none" stroke="#5E852B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M ${x0 - r - 4} ${(y0 + y1) / 2 + 6} l 4 -7 l 4 7`} fill="none" stroke="#5E852B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {[0, 0.5].map((delay) => (
            <circle key={delay} r={delay ? 4 : 6} fill="#DDFF80" stroke="#038F2F" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px rgba(136,187,65,0.9))' }}>
              <animateMotion dur="12s" repeatCount="indefinite" path={d} begin={`${-delay * 12}s`} />
            </circle>
          ))}
        </svg>
      )}
      <ol className={`relative grid grid-cols-4 ${compact ? 'gap-x-1.5 gap-y-5' : 'gap-x-3 gap-y-9'}`}>
        {loopStops.map((s, k) => {
          const c = cell(k);
          return (
            <li key={s.label} style={{ gridColumn: c.col + 1, gridRow: c.row + 1, ['--k' as string]: k }} className="loop-stop">
              <button
                type="button"
                onClick={() => onPick?.(s.scene)}
                className={`group flex h-full w-full flex-col items-center justify-center rounded-2xl bg-white/90 text-center shadow-[0_10px_30px_-18px_rgba(2,43,54,0.45)] ring-1 ring-ink/[0.07] backdrop-blur transition hover:-translate-y-0.5 hover:ring-field ${
                  compact ? 'px-1 py-2' : 'px-2 py-3'
                }`}
              >
                <span className={`font-bold leading-tight text-ink group-hover:text-field ${compact ? 'text-[0.72rem]' : 'text-[0.9rem]'}`}>{s.label}</span>
                {!compact && <span className="mt-1 text-[0.74rem] font-semibold leading-tight text-ink-mute">{s.via}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
