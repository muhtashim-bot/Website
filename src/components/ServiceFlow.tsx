'use client';

/*
 * "Flow" version of the homepage opener: open farmland with a Bangladeshi farmer at its centre and
 * eight service stations scattered around him, joined by winding village roads that carry seed,
 * cash and produce. The land has no edge; it fades away. The whole place turns slowly around the
 * farmer. Every station is labelled; clicking one dives into it (FlowDive).
 *
 * Built for smoothness: the ground is drawn once, flat, and turned and tilted into isometric view
 * by a CSS transform; each station, tree and the farmer is its own small layer that only moves.
 * One loop drives the turn and stops whenever nothing is turning.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlowDive } from './flow/FlowDive';
import { C, Cyl, Farmer, LEAF, PH, Palm, Tree, stations, type O, type Station } from './flow/parts';

const VB = { x: -450, y: -330, w: 900, h: 590 }; // the scene, in screen units (origin = the farmer)
const SP = { w: 190, top: 128, h: 186 }; // a station's layer, around its ground point
const TP = { w: 70, top: 66, h: 80 }; // a tree's layer
const FP = { w: 120, top: 92, h: 112 }; // the farmer's layer
const GROUND = 720; // half-size of the drawn land, in plane units
const TURN = (2 * Math.PI) / 130; // radians per second: one slow turn in a little over two minutes
const PLAT = 42; // platform radius

/* ---------- the land: drawn once, flat ---------- */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f1 = (n: number) => Math.round(n * 10) / 10;

const PLOTS = (() => {
  const rand = rng(20261128);
  const cell = 96;
  const n = Math.ceil(GROUND / cell) + 1;
  const pts: number[][][] = [];
  for (let i = -n; i <= n; i++) {
    pts[i + n] = [];
    for (let j = -n; j <= n; j++) pts[i + n][j + n] = [i * cell + (rand() - 0.5) * cell * 0.5, j * cell + (rand() - 0.5) * cell * 0.5];
  }
  const fills = ['#D5EBAE', '#C9E49C', '#DCEFBB', '#BFDD8E', '#D1E8A8', '#C4E096', '#F2E38E', '#E9E0C4', '#DCEFBB', '#CBE6A0'];
  const plots: { d: string; fill: string; rows: number }[] = [];
  for (let i = 0; i < 2 * n; i++) {
    for (let j = 0; j < 2 * n; j++) {
      const q = [pts[i][j], pts[i + 1][j], pts[i + 1][j + 1], pts[i][j + 1]];
      const cx = (q[0][0] + q[2][0]) / 2;
      const cy = (q[0][1] + q[2][1]) / 2;
      if (Math.hypot(cx, cy) > GROUND - 40) continue;
      plots.push({ d: `M ${q.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L ')} Z`, fill: fills[Math.floor(rand() * fills.length)], rows: rand() < 0.55 ? Math.floor(rand() * 3) : -1 });
    }
  }
  return plots;
})();

// the village road: one winding loop through every station, in the order of the season
const RING = (() => {
  const p = stations.map((s) => [s.x, s.y]);
  const n = p.length;
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${p2[0]} ${p2[1]}`;
  }
  return `${d} Z`;
})();
// lanes from a few stations in to the farmer's yard, gently curved
const LANES = ['next', 'advice', 'center', 'insurance'].map((id) => {
  const s = stations.find((t) => t.id === id)!;
  const mx = s.x / 2 - s.y * 0.14;
  const my = s.y / 2 + s.x * 0.14;
  return { id, d: `M ${s.x} ${s.y} Q ${f1(mx)} ${f1(my)} 0 0`, color: s.token };
});
const PONDS = [
  { cx: -20, cy: -120, rx: 34, ry: 22, a: 25 },
  { cx: 215, cy: 268, rx: 42, ry: 26, a: -15 },
  { cx: -335, cy: -150, rx: 38, ry: 24, a: 40 },
];
const TREES = [
  { kind: 'palm', x: -345, y: 60, s: 1 },
  { kind: 'tree', x: -60, y: -345, s: 1 },
  { kind: 'palm', x: 175, y: -300, s: 0.95 },
  { kind: 'tree', x: 350, y: -10, s: 0.9 },
  { kind: 'palm', x: 165, y: 300, s: 1.05 },
  { kind: 'tree', x: -265, y: 230, s: 0.95 },
  { kind: 'tree', x: 110, y: 40, s: 0.8 },
  { kind: 'tree', x: -95, y: -115, s: 0.85 },
  { kind: 'palm', x: 330, y: -240, s: 0.9 },
];
const RING_TOKENS = ['#F2C14E', '#88BB41', '#B8E655', '#E9792F', '#F2C14E', '#88BB41', '#7CC6E8', '#B8E655', '#E9792F', '#F2C14E'];

function Ground({ svgRef }: { svgRef: (el: SVGSVGElement | null) => void }) {
  return (
    <svg ref={svgRef} viewBox={`${-GROUND} ${-GROUND} ${GROUND * 2} ${GROUND * 2}`} className="absolute inset-0 h-full w-full" aria-hidden>
      <circle r={GROUND} fill="#E3F0CF" />
      <g stroke="#F4F8EC" strokeWidth="5" strokeLinejoin="round">
        {PLOTS.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
      </g>
      <g stroke="none" opacity="0.35">
        {PLOTS.map((p, i) => (p.rows >= 0 ? <path key={i} d={p.d} fill={`url(#fl-rows-${p.rows})`} /> : null))}
      </g>
      {PONDS.map((p, i) => (
        <g key={i} transform={`translate(${p.cx} ${p.cy}) rotate(${p.a})`}>
          <ellipse rx={p.rx + 5} ry={p.ry + 5} fill="#D9E9C8" />
          <ellipse rx={p.rx} ry={p.ry} fill="#A9D8E6" />
          <ellipse rx={p.rx * 0.55} ry={p.ry * 0.35} cx={-p.rx * 0.2} cy={-p.ry * 0.25} fill="#C8E9F2" />
        </g>
      ))}
      {/* the farmer's yard */}
      <circle r="50" fill="#EFE7D4" stroke="#E2D6BA" strokeWidth="3" />
      {/* roads */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={RING} stroke="#D8CFB7" strokeWidth="30" />
        {LANES.map((l) => (
          <path key={l.id} d={l.d} stroke="#DDD5C0" strokeWidth="19" />
        ))}
        <path d={RING} stroke="#F0EBDD" strokeWidth="25" />
        {LANES.map((l) => (
          <path key={`s${l.id}`} d={l.d} stroke="#F4F0E6" strokeWidth="14" />
        ))}
        <path d={RING} stroke="#FFFFFF" strokeWidth="2.2" strokeDasharray="14 12" />
      </g>
      {/* seed, cash and produce on the move: round the village, and in to the farmer */}
      <path id="fl-ring" d={RING} fill="none" />
      {RING_TOKENS.map((c, i) => (
        <circle key={i} r="7.5" fill={c} stroke="#FFFFFF" strokeWidth="3">
          <animateMotion dur="44s" begin={`${-(i * 44) / RING_TOKENS.length}s`} repeatCount="indefinite">
            <mpath href="#fl-ring" />
          </animateMotion>
        </circle>
      ))}
      {LANES.map((l, i) => (
        <g key={`t${l.id}`}>
          <path id={`fl-lane-${l.id}`} d={l.d} fill="none" />
          {[0, 1].map((k) => (
            <circle key={k} r="6.5" fill={l.color} stroke="#FFFFFF" strokeWidth="3">
              <animateMotion dur="5.5s" begin={`${-(k * 2.75 + i * 0.9)}s`} repeatCount="indefinite">
                <mpath href={`#fl-lane-${l.id}`} />
              </animateMotion>
            </circle>
          ))}
        </g>
      ))}
    </svg>
  );
}

/* ---------- shared gradients, mounted once outside any hidden copy of the scene ---------- */

let defsOwner = false;
function FlowDefs() {
  const [own, setOwn] = useState(false);
  useEffect(() => {
    if (defsOwner) return;
    defsOwner = true;
    setOwn(true);
    return () => {
      defsOwner = false;
    };
  }, []);
  if (!own) return null;
  return createPortal(
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <linearGradient id="fl-plat" x1="0" x2="1">
          <stop offset="0" stopColor="#F7FAF4" />
          <stop offset="1" stopColor="#D2DDCE" />
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
        <radialGradient id="fl-glow">
          <stop offset="0" stopColor="rgba(221,255,128,0.95)" />
          <stop offset="1" stopColor="rgba(221,255,128,0)" />
        </radialGradient>
        <radialGradient id="fl-shade">
          <stop offset="0.35" stopColor="rgba(2,43,54,0.2)" />
          <stop offset="1" stopColor="rgba(2,43,54,0)" />
        </radialGradient>
        {[0, 60, 120].map((a, k) => (
          <pattern key={k} id={`fl-rows-${k}`} width="11" height="11" patternUnits="userSpaceOnUse" patternTransform={`rotate(${a})`}>
            <rect width="11" height="5" fill="#7FAF45" />
          </pattern>
        ))}
      </defs>
    </svg>,
    document.body,
  );
}

/* ---------- placing things as the land turns ---------- */

type Box = { w: number; top: number; h: number };
type Thing = { x: number; y: number; box: Box };
const things: Thing[] = [...stations.map((s) => ({ x: s.x, y: s.y, box: SP })), ...TREES.map((t) => ({ x: t.x, y: t.y, box: TP }))];

/** screen position of a plane point after the land has turned by a */
function project(x: number, y: number, a: number) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const xr = x * ca - y * sa;
  const yr = x * sa + y * ca;
  return { sx: (xr - yr) * C, sy: (xr + yr) * 0.5, depth: xr + yr };
}
/** the transform that puts a layer's ground point at screen position (sx, sy), in % of its own size */
const seat = (sx: number, sy: number, b: Box) => `translate3d(${(((sx - VB.x - b.w / 2) / b.w) * 100).toFixed(3)}%, ${(((sy - VB.y - b.top) / b.h) * 100).toFixed(3)}%, 0)`;
const size = (b: Box) => ({ width: `${(b.w / VB.w) * 100}%`, height: `${(b.h / VB.h) * 100}%` });
const START = -0.35; // the turn the scene opens at
const groundTurn = (a: number) => `scale(${(Math.SQRT2 * C).toFixed(5)}, ${Math.SQRT1_2.toFixed(5)}) rotate(${(45 + (a * 180) / Math.PI).toFixed(3)}deg)`;

export function ServiceFlow({ onPick, compact = false, dark = false }: { onPick?: (scene: string) => void; dark?: boolean; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const svgs = useRef<Set<SVGSVGElement>>(new Set());
  const angle = useRef(START);
  const [hot, setHot] = useState<string | null>(null);
  const [seen, setSeen] = useState(true);
  const [dive, setDive] = useState<{ s: Station; from: { x: number; y: number }; at: { left: number; top: number } } | null>(null);
  const still = useRef(false);

  const keep = useCallback((el: SVGSVGElement | null) => {
    if (el) svgs.current.add(el);
  }, []);

  const place = useCallback((a: number) => {
    if (ground.current) ground.current.style.transform = groundTurn(a % (2 * Math.PI));
    things.forEach((t, i) => {
      const el = layers.current[i];
      if (!el) return;
      const p = project(t.x, t.y, a);
      el.style.transform = seat(p.sx, p.sy, t.box);
      el.style.zIndex = String(200 + Math.round(p.depth / 4));
    });
  }, []);

  useEffect(() => {
    still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.intersectionRatio > 0.1), { threshold: [0, 0.1, 0.3] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // pause every little animation when the scene is out of sight or a station is open
  useEffect(() => {
    const run = seen && !dive && !still.current;
    svgs.current.forEach((s) => (run ? s.unpauseAnimations() : s.pauseAnimations()));
  }, [seen, dive]);

  // the slow turn: eases to a stop while someone points at a station, or one is open
  const held = hot !== null;
  useEffect(() => {
    const target = seen && !held && !dive && !still.current ? TURN : 0;
    let speed = target ? TURN * 0.6 : 0;
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      speed += (target - speed) * Math.min(1, dt * 2.5);
      angle.current += speed * dt;
      place(angle.current);
      if (target || speed > 0.0005) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [seen, held, dive, place]);

  const open = (s: Station) => {
    const p = project(s.x, s.y, angle.current);
    const at = { left: ((p.sx - VB.x) / VB.w) * 100, top: ((p.sy - PH - s.tall / 2 - VB.y) / VB.h) * 100 };
    const r = root.current?.getBoundingClientRect();
    const from = r ? { x: r.left + (at.left / 100) * r.width, y: r.top + (at.top / 100) * r.height } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setHot(null);
    document.documentElement.classList.add('flow-diving');
    setDive({ s, from, at });
  };
  const close = () => {
    document.documentElement.classList.remove('flow-diving');
    setDive(null);
  };
  useEffect(() => () => document.documentElement.classList.remove('flow-diving'), []);

  // where things sit before the first turn, so the server-drawn page already looks right
  const initial = (t: Thing) => {
    const p = project(t.x, t.y, START);
    return { transform: seat(p.sx, p.sy, t.box), zIndex: 200 + Math.round(p.depth / 4) };
  };

  return (
    <div
      ref={root}
      className="relative w-full select-none"
      style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setHot(null);
      }}
    >
      <FlowDefs />
      <div
        className="absolute inset-0 transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.3,0.7,0.2,1)]"
        style={dive ? { transform: 'scale(2.3)', transformOrigin: `${dive.at.left}% ${dive.at.top}%`, opacity: dark ? 0.1 : 0.16 } : { transform: 'none', opacity: 1 }}
      >
        {/* the land, fading out on every side */}
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_50%_46%_at_50%_54%,#000_52%,transparent_100%)]">
          <div
            ref={ground}
            className="absolute will-change-transform"
            style={{
              left: `${((-GROUND - VB.x) / VB.w) * 100}%`,
              top: `${((-GROUND - VB.y) / VB.h) * 100}%`,
              width: `${((GROUND * 2) / VB.w) * 100}%`,
              height: `${((GROUND * 2) / VB.h) * 100}%`,
              transform: groundTurn(START),
            }}
          >
            <Ground svgRef={keep} />
          </div>
        </div>

        {/* the farmer, at the centre of it all */}
        <div className="pointer-events-none absolute left-0 top-0" style={{ ...size(FP), transform: seat(0, 0, FP), zIndex: 200 }}>
          <svg ref={keep} viewBox={`${-FP.w / 2} ${-FP.top} ${FP.w} ${FP.h}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <ellipse cx="0" cy="0" rx="34" ry="19" fill="none" stroke={LEAF} strokeWidth="1.5" opacity="0.6">
              <animate attributeName="rx" values="26;46" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="ry" values="14;26" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="2.8s" repeatCount="indefinite" />
            </ellipse>
            <Farmer />
          </svg>
          <span
            className={`absolute left-1/2 whitespace-nowrap rounded-full bg-field font-bold text-white shadow-[0_10px_24px_-12px_rgba(2,43,54,0.6)] ${compact ? 'px-2 py-0.5 text-[0.56rem]' : 'px-3 py-1 text-[clamp(0.66rem,0.8vw,0.8rem)]'}`}
            style={{ top: `${((FP.top - 74) / FP.h) * 100}%`, transform: 'translate(-50%, calc(-100% - 4px))' }}
          >
            The farmer, at the centre
          </span>
        </div>

        {/* stations and trees, each its own layer */}
        {things.map((t, i) => {
          const tree = i >= stations.length ? TREES[i - stations.length] : null;
          if (tree) {
            return (
              <div key={`t${i}`} ref={(el) => void (layers.current[i] = el)} className="pointer-events-none absolute left-0 top-0 will-change-transform" style={{ ...size(TP), ...initial(t) }}>
                <svg ref={keep} viewBox={`${-TP.w / 2} ${-TP.top} ${TP.w} ${TP.h}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                  {tree.kind === 'palm' ? <Palm x={0} y={0} s={tree.s} /> : <Tree x={0} y={0} s={tree.s} />}
                </svg>
              </div>
            );
          }
          const st = stations[i];
          const o: O = { x: 0, y: 0, z: PH };
          const on = hot === st.id;
          return (
            <div key={st.id} ref={(el) => void (layers.current[i] = el)} className="pointer-events-none absolute left-0 top-0 will-change-transform" style={{ ...size(SP), ...initial(t) }}>
              <svg ref={keep} viewBox={`${-SP.w / 2} ${-SP.top} ${SP.w} ${SP.h}`} className="absolute inset-0 h-full w-full overflow-visible">
                <g
                  className="flow-station pointer-events-auto cursor-pointer outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`${st.label}: see how it works`}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setHot(st.id)}
                  onPointerLeave={(e) => e.pointerType === 'mouse' && setHot(null)}
                  onFocus={() => setHot(st.id)}
                  onBlur={() => setHot(null)}
                  onClick={() => open(st)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      open(st);
                    }
                  }}
                >
                  <ellipse cx="4" cy="6" rx={PLAT * 1.55} ry={PLAT * 0.95} fill="url(#fl-shade)" />
                  <ellipse cx="0" cy={-PH / 2} rx={PLAT * 2} ry={PLAT * 1.2} fill="url(#fl-glow)" style={{ opacity: on ? 0.9 : 0, transition: 'opacity .4s' }} />
                  <Cyl o={{ x: 0, y: 0, z: 0 }} x={0} y={0} z={0} r={PLAT} h={PH} top={on ? '#F6FFE3' : '#FFFFFF'} side="url(#fl-plat)" rim={on ? LEAF : '#E3EADF'} />
                  <g className="flow-obj" style={{ transform: on ? 'translateY(-5px)' : 'none' }}>
                    {st.draw(o)}
                  </g>
                  <rect x={-PLAT * 1.35} y={-PH - st.tall - 10} width={PLAT * 2.7} height={st.tall + PH + PLAT * 0.85 + 10} fill="transparent" />
                </g>
              </svg>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => open(st)}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHot(st.id)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setHot(null)}
                className={`pointer-events-auto absolute left-1/2 whitespace-nowrap rounded-xl bg-white text-center ring-1 transition-shadow duration-300 ${compact ? 'px-1.5 py-0.5' : 'px-2.5 py-1'} ${
                  on ? 'ring-leaf shadow-[0_0_0_3px_rgba(221,255,128,0.75),0_10px_24px_-10px_rgba(2,43,54,0.45)]' : 'ring-ink/[0.07] shadow-[0_8px_20px_-12px_rgba(2,43,54,0.45)]'
                }`}
                style={{ top: `${((SP.top - PH - st.tall) / SP.h) * 100}%`, transform: `translate(-50%, calc(-100% - ${compact ? 3 : 7}px))` }}
              >
                <span className={`block font-bold leading-tight text-field ${compact ? 'text-[0.56rem]' : 'text-[clamp(0.68rem,0.82vw,0.82rem)]'}`}>{st.label}</span>
                {!compact && <span className="block text-[clamp(0.58rem,0.66vw,0.68rem)] font-semibold leading-tight text-ink-mute">{st.via}</span>}
              </button>
            </div>
          );
        })}
      </div>

      {dive && <FlowDive station={dive.s} from={dive.from} dark={dark} onExit={close} onSeason={onPick ? () => onPick(dive.s.scene) : undefined} />}
    </div>
  );
}
