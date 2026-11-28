'use client';

/*
 * "Flow" version of the homepage opener: a small isometric village with a Bangladeshi farmer at
 * its centre. Two village roads cross at his yard and lanes run off them to eight service
 * stations scattered around; seed, cash and produce travel the roads to and from him while a ring
 * of services turns at his feet. Every station is labelled. Clicking one zooms into it and opens
 * a floating card with that service's phone screens (FlowDetail).
 *
 * The map is one SVG animated with SMIL, so the whole scene can be paused at once: when it is off
 * screen, while a card is open, and from the start for reduced motion.
 */
import { useEffect, useRef, useState } from 'react';
import { FlowDetail } from './flow/FlowDetail';
import {
  Cyl,
  Farmer,
  Field,
  H,
  LEAF,
  PH,
  Palm,
  RING,
  Shadow,
  Slab,
  Tree,
  flat,
  iso,
  sector,
  spin,
  stations,
  type O,
  type P2,
  type Station,
} from './flow/parts';

const ISLAND = 352; // radius of the village, in plane units
const PLAZA = 58; // the farmer's yard
const VB = { x: -440, y: -262, w: 880, h: 540 };
const pct = ([x, y]: P2) => ({ left: ((x - VB.x) / VB.w) * 100, top: ((y - VB.y) / VB.h) * 100 });

/* the roads, in plane coordinates */
const MAIN = [`M ${-ISLAND} 0 H ${ISLAND}`, `M 0 ${-ISLAND} V ${ISLAND}`];
const LANES = stations.map((s) => `M ${s.x} ${s.y} L ${s.lane[0]} ${s.lane[1]}`);

/* what travels them: from each station to the farmer, or out from him, along lane and road */
const trips = stations.map((s) => {
  const pts: P2[] = [iso(s.x, s.y, 4), iso(s.lane[0], s.lane[1], 4), iso(0, 0, 4)];
  const way = s.flow === 'in' ? pts : [...pts].reverse();
  const length = Math.hypot(s.x - s.lane[0], s.y - s.lane[1]) + Math.hypot(s.lane[0], s.lane[1]);
  return { id: s.id, d: `M ${way.map((p) => p.join(' ')).join(' L ')}`, dur: length / 70, color: s.token };
});

const FIELDS = [
  { x: -165, y: -160, w: 90, d: 80, fill: '#F4E58E', row: '#E8CF5C' }, // mustard
  { x: 75, y: 70, w: 100, d: 90, fill: '#CFE7A4', row: '#B5D681' },
  { x: 140, y: -180, w: 80, d: 68, fill: '#D7EDB2', row: '#BEDD8E' },
  { x: -250, y: 115, w: 100, d: 85, fill: '#F4E58E', row: '#E8CF5C' },
  { x: -130, y: 40, w: 70, d: 70, fill: '#D7EDB2', row: '#BEDD8E' },
  { x: 40, y: -120, w: 70, d: 70, fill: '#CFE7A4', row: '#B5D681' },
];
const GREENERY = [
  { kind: 'palm', x: -300, y: 160, s: 1 },
  { kind: 'tree', x: -150, y: -300, s: 1 },
  { kind: 'palm', x: 180, y: -270, s: 0.95 },
  { kind: 'tree', x: 320, y: -120, s: 0.9 },
  { kind: 'palm', x: 230, y: 230, s: 1.05 },
  { kind: 'tree', x: -210, y: 260, s: 0.95 },
  { kind: 'tree', x: 125, y: 300, s: 0.85 },
  { kind: 'tree', x: -280, y: -180, s: 0.9 },
];

function Yard() {
  const top = 12;
  const o: O = { x: 0, y: 0, z: 0 };
  const layers = Math.max(...RING.map((s) => s.h));
  return (
    <g>
      <Cyl o={o} x={0} y={0} z={0} r={PLAZA} h={top} top="#FFFFFF" side="url(#fl-plat)" rim="#E3EADF" />
      <circle r={PLAZA - 8} transform={flat(top)} fill="#F2F7EE" />
      {/* the ring of services, turning at his feet; every layer turns together */}
      {Array.from({ length: layers + 1 }, (_, k) => (
        <g key={k} transform={flat(top + k * 1.6)}>
          <g>
            {spin(32)}
            {RING.map((s, i) => (k <= s.h ? <path key={i} d={sector(i, 33, 46)} fill={k === s.h ? s.c : s.s} stroke={k === s.h ? 'none' : s.s} strokeWidth="1" /> : null))}
          </g>
        </g>
      ))}
      <g transform={`translate(0 ${-top}) scale(1.45)`}>
        <Farmer />
      </g>
    </g>
  );
}

export function ServiceFlow({ onPick, dark = false, compact = false }: { onPick?: (scene: string) => void; dark?: boolean; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const opener = useRef<Element | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [tour, setTour] = useState(0);
  const [seen, setSeen] = useState(true);
  const [open, setOpen] = useState<{ s: Station; from: { x: number; y: number } } | null>(null);
  const still = useRef(false);

  useEffect(() => {
    still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.intersectionRatio > 0.15), { threshold: [0, 0.15, 0.4] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    if (seen && !open && !still.current) s.unpauseAnimations();
    else s.pauseAnimations();
  }, [seen, open]);

  // when nobody is pointing, a soft highlight walks the village from station to station
  useEffect(() => {
    if (hover || open || !seen || still.current) return;
    const id = window.setInterval(() => setTour((t) => (t + 1) % stations.length), 3200);
    return () => window.clearInterval(id);
  }, [hover, open, seen]);

  const activeId = open?.s.id ?? hover ?? stations[tour].id;

  const openStation = (s: Station, el: Element | null) => {
    const box = root.current?.getBoundingClientRect();
    const a = pct(iso(s.x, s.y, PH + s.tall / 2));
    const from = box ? { x: box.left + (a.left / 100) * box.width, y: box.top + (a.top / 100) * box.height } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    opener.current = el;
    setHover(null);
    setOpen({ s, from });
  };

  // zoom the map into the station that is open
  const zoom = open ? pct(iso(open.s.x, open.s.y, PH + open.s.tall / 2)) : null;

  const order = [
    ...stations.map((s) => ({ key: s.id, depth: s.x + s.y, s })),
    ...GREENERY.map((g, i) => ({ key: `g${i}`, depth: g.x + g.y, g })),
    { key: 'yard', depth: 0 },
  ].sort((a, b) => a.depth - b.depth);

  return (
    <div
      ref={root}
      className="relative w-full"
      style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setHover(null);
      }}
    >
      <div
        className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.3,0.7,0.2,1)]"
        style={zoom ? { transform: 'scale(1.55)', transformOrigin: `${zoom.left}% ${zoom.top}%` } : { transform: 'none' }}
      >
        <svg ref={svg} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full overflow-visible" role="group" aria-label="iFarmer's services around the farmer">
          <defs>
            <linearGradient id="fl-plat" x1="0" x2="1">
              <stop offset="0" stopColor="#F4F8F1" />
              <stop offset="1" stopColor="#CFDBCB" />
            </linearGradient>
            <linearGradient id="fl-side" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#F1F5EE" />
              <stop offset="1" stopColor="#CCD8C8" />
            </linearGradient>
            <linearGradient id="fl-earth" x1="0" x2="1">
              <stop offset="0" stopColor="#B88E5E" />
              <stop offset="1" stopColor="#8A6640" />
            </linearGradient>
            <linearGradient id="fl-sack" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#EADBB9" />
              <stop offset="1" stopColor="#C8B48A" />
            </linearGradient>
            <linearGradient id="fl-soil" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#8E6B47" />
              <stop offset="1" stopColor="#6A4F34" />
            </linearGradient>
            <linearGradient id="fl-coin" x1="0" x2="1">
              <stop offset="0" stopColor="#F3C94F" />
              <stop offset="1" stopColor="#C99428" />
            </linearGradient>
            <linearGradient id="fl-pole" x1="0" x2="1">
              <stop offset="0" stopColor="#F1F5EE" />
              <stop offset="1" stopColor="#B9C6B6" />
            </linearGradient>
            <radialGradient id="fl-shadow">
              <stop offset="0.3" stopColor="rgba(2,43,54,0.16)" />
              <stop offset="1" stopColor="rgba(2,43,54,0)" />
            </radialGradient>
            <radialGradient id="fl-glow">
              <stop offset="0" stopColor="rgba(221,255,128,0.95)" />
              <stop offset="1" stopColor="rgba(221,255,128,0)" />
            </radialGradient>
            <radialGradient id="fl-ground">
              <stop offset="0" stopColor="#F6FAEE" />
              <stop offset="0.85" stopColor="#EAF3DC" />
              <stop offset="1" stopColor="#DFEDCB" />
            </radialGradient>
            {trips.map((t) => (
              <path key={t.id} id={`fl-trip-${t.id}`} d={t.d} />
            ))}
          </defs>

          {/* the village: a round plot of land with an earth edge */}
          <ellipse cx="14" cy="46" rx={ISLAND * 1.34} ry={ISLAND * 0.86} fill="url(#fl-shadow)" opacity={dark ? 1.6 : 1} />
          {Array.from({ length: 10 }, (_, k) => (
            <circle key={k} r={ISLAND} transform={flat(-18 + k * 1.8)} fill="url(#fl-earth)" stroke="url(#fl-earth)" strokeWidth="1" />
          ))}
          <circle r={ISLAND} transform={flat(0)} fill="url(#fl-ground)" stroke="#D3E4BC" strokeWidth="1.5" />

          {FIELDS.map((f, i) => (
            <Field key={i} {...f} />
          ))}

          {/* roads and lanes */}
          <g transform={flat(0.8)} fill="none" strokeLinecap="round" strokeLinejoin="round">
            {MAIN.map((d) => (
              <path key={d} d={d} stroke="#D8D0BA" strokeWidth="27" strokeLinecap="butt" />
            ))}
            {LANES.map((d) => (
              <path key={d} d={d} stroke="#DDD6C3" strokeWidth="17" />
            ))}
            {MAIN.map((d) => (
              <path key={`s${d}`} d={d} stroke="#EEE9DC" strokeWidth="23" strokeLinecap="butt" />
            ))}
            {LANES.map((d) => (
              <path key={`s${d}`} d={d} stroke="#F3EFE5" strokeWidth="13" />
            ))}
            {MAIN.map((d) => (
              <path key={`c${d}`} d={d} stroke="#FFFFFF" strokeWidth="1.8" strokeDasharray="11 10" strokeLinecap="butt" />
            ))}
          </g>

          {/* seed, cash and produce on the move */}
          <g>
            {trips.map((t) =>
              [0, 1].map((k) => (
                <g key={`${t.id}-${k}`}>
                  <animateMotion dur={`${t.dur.toFixed(2)}s`} begin={`${(-(k * t.dur) / 2 - t.dur * 0.37).toFixed(2)}s`} repeatCount="indefinite">
                    <mpath href={`#fl-trip-${t.id}`} />
                  </animateMotion>
                  <ellipse cx="1.5" cy="4" rx="5.5" ry="2" fill="rgba(2,43,54,0.18)" />
                  <circle r="5.2" fill={t.color} stroke="#FFFFFF" strokeWidth="1.6" />
                </g>
              )),
            )}
          </g>

          {/* stations, trees and the farmer's yard, back to front */}
          {order.map((item) => {
            if (item.key === 'yard') {
              return (
                <g key="yard" aria-hidden>
                  <Shadow cx={0} cy={0} s={PLAZA} />
                  <Yard />
                </g>
              );
            }
            if ('g' in item && item.g) {
              const g = item.g;
              return g.kind === 'palm' ? <Palm key={item.key} x={g.x} y={g.y} s={g.s} /> : <Tree key={item.key} x={g.x} y={g.y} s={g.s} />;
            }
            const s = (item as { s: Station }).s;
            const o: O = { x: s.x, y: s.y, z: PH };
            const on = activeId === s.id;
            const [gx, gy] = iso(s.x, s.y, PH);
            return (
              <g
                key={s.id}
                data-station={s.id}
                className="flow-station cursor-pointer outline-none"
                tabIndex={0}
                role="button"
                aria-label={`${s.label}: open the details`}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(s.id)}
                onFocus={() => setHover(s.id)}
                onBlur={() => setHover(null)}
                onClick={(e) => openStation(s, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openStation(s, e.currentTarget);
                  }
                }}
              >
                <Shadow cx={s.x} cy={s.y} s={H + 6} />
                <ellipse cx={gx} cy={gy} rx={H * 2.4} ry={H * 1.4} fill="url(#fl-glow)" style={{ opacity: on ? 0.9 : 0, transition: 'opacity .45s' }} />
                <Slab
                  o={{ x: s.x, y: s.y, z: 0 }}
                  x={-H}
                  y={-H}
                  z={0}
                  w={H * 2}
                  d={H * 2}
                  h={PH}
                  rx={9}
                  top={on ? '#F6FFE3' : '#FFFFFF'}
                  side="url(#fl-side)"
                  stroke={on ? LEAF : '#E3EADF'}
                  style={{ transition: 'fill .4s, stroke .4s' }}
                />
                <g className="flow-obj" style={{ transform: on ? 'translateY(-5px)' : 'none' }}>
                  {s.draw(o)}
                </g>
                {/* a generous, invisible target for the pointer */}
                <rect x={gx - H * 1.8} y={gy - s.tall - 14} width={H * 3.6} height={s.tall + H + 24} fill="transparent" />
              </g>
            );
          })}
        </svg>

        {/* every station is labelled; the label opens it too */}
        {stations.map((s) => {
          const a = pct(iso(s.x, s.y, PH + s.tall));
          const on = activeId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              tabIndex={-1}
              onClick={(e) => openStation(s, e.currentTarget)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(s.id)}
              className={`flow-label absolute z-10 whitespace-nowrap rounded-xl bg-white text-center ring-1 transition-[box-shadow,transform] duration-300 ${compact ? 'px-1.5 py-0.5' : 'px-2.5 py-1'} ${
                on ? 'ring-leaf shadow-[0_0_0_3px_rgba(221,255,128,0.7),0_10px_24px_-10px_rgba(2,43,54,0.45)]' : 'ring-ink/[0.07] shadow-[0_8px_20px_-12px_rgba(2,43,54,0.45)]'
              }`}
              style={{ left: `${a.left}%`, top: `${a.top}%`, transform: `translate(-50%, calc(-100% - ${compact ? 4 : 8}px)) scale(${on ? 1.06 : 1})` }}
            >
              <span className={`block font-bold leading-tight text-field ${compact ? 'text-[0.56rem]' : 'text-[clamp(0.68rem,0.82vw,0.82rem)]'}`}>{s.label}</span>
              {!compact && <span className="block text-[clamp(0.58rem,0.66vw,0.68rem)] font-semibold leading-tight text-ink-mute">{s.via}</span>}
            </button>
          );
        })}
        {(() => {
          const a = pct(iso(0, 0, 12 + 96 * 1.45)); // above his hat, like a name tag
          return (
            <div
              className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-full bg-field text-center font-bold text-white shadow-[0_10px_24px_-12px_rgba(2,43,54,0.6)] ${compact ? 'px-2 py-0.5 text-[0.56rem]' : 'px-3 py-1 text-[clamp(0.68rem,0.82vw,0.82rem)]'}`}
              style={{ left: `${a.left}%`, top: `${a.top}%`, transform: `translate(-50%, calc(-100% - ${compact ? 3 : 6}px))` }}
            >
              The farmer, at the centre
            </div>
          );
        })()}
      </div>

      {open && (
        <FlowDetail
          station={open.s}
          from={open.from}
          onClose={() => {
            setOpen(null);
            (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
          }}
          onSeason={onPick ? () => onPick(open.s.scene) : undefined}
        />
      )}
    </div>
  );
}
