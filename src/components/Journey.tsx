'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { howItWorks, outro, scenes, type Channel, type Shot } from '@/content/journey';
import { metrics, headlineMetrics, METRICS_AS_OF } from '@/content/metrics';
import { Phone } from './PhoneScreens';

/* ---------- timing ---------- */
const SHOT_VH = 64; // scroll distance per shot, in % of the viewport height
const TAIL = 0.9; // extra scroll after the last shot for the closing state
const X = 0.34; // share of a shot spent transitioning into it

type Flat = { shot: Shot; scene: number; k: number };
const flat: Flat[] = scenes.flatMap((s, scene) => s.shots.map((shot, k) => ({ shot, scene, k })));
const N = flat.length;
const UNITS = N + TAIL;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** How far shot j has arrived (0 → 1) at scroll position u (in shot units). */
const arrive = (j: number, u: number) => (j === 0 ? 1 : easeInOut(clamp((u - (j - X)) / X)));
/** Camera move progress for shot j. */
const motion = (j: number, u: number) => {
  const end = j === N - 1 ? N + TAIL : j + 1;
  return ease(clamp((u - (j - X)) / (end - (j - X))));
};

const srcSet = (photo: string) => `/photos/${photo}-1080.jpg 1080w, /photos/${photo}-1920.jpg 1920w`;

export function Journey() {
  const [mode, setMode] = useState<'pending' | 'motion' | 'static'>('pending');
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const forceStatic = new URLSearchParams(window.location.search).has('static');
    setMode(reduced || forceStatic ? 'static' : 'motion');
  }, []);
  if (mode === 'static') return <JourneyStatic />;
  return <JourneyMotion />;
}

function JourneyMotion() {
  const sectionRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const target = useRef(0);
  const current = useRef(0);
  const shotRef = useRef(0);
  const phaseRef = useRef<'intro' | 'rail' | 'outro'>('intro');
  const [shotIdx, setShotIdx] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'rail' | 'outro'>('intro');
  const [loaded, setLoaded] = useState(3);

  const readProgress = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let settled = false;
    target.current = current.current = readProgress();
    const onScroll = () => (target.current = readProgress());
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const gap = target.current - current.current;
      if (Math.abs(gap) < 0.00002 && settled) return;
      settled = Math.abs(gap) < 0.00002;
      current.current += gap * (1 - Math.exp(-dt * 7));
      const u = current.current * UNITS;

      let active = 0;
      for (let j = 0; j < N; j++) if (arrive(j, u) >= 0.5) active = j;
      if (active !== shotRef.current) {
        shotRef.current = active;
        setShotIdx(active);
        setLoaded((l) => Math.max(l, active + 3));
      }
      const ph = u > N - 0.15 ? 'outro' : flat[active].scene === 0 ? 'intro' : 'rail';
      if (ph !== phaseRef.current) {
        phaseRef.current = ph;
        setPhase(ph);
      }

      for (let j = 0; j < N; j++) {
        const layer = layerRefs.current[j];
        const img = imgRefs.current[j];
        if (!layer || !img) continue;
        const e = arrive(j, u);
        const next = j + 1 < N ? arrive(j + 1, u) : 0;
        if (e <= 0 || next >= 1) {
          layer.style.visibility = 'hidden';
          continue;
        }
        layer.style.visibility = 'visible';
        const { from, to, enter } = flat[j].shot;
        const m = motion(j, u);
        let s = lerp(from.s, to.s, m);
        let x = lerp(from.x, to.x, m);
        let y = lerp(from.y, to.y, m);
        let opacity = 1;
        let clip = 'none';
        let shade = 0;
        let blur = 0;

        // arriving
        if (e < 1) {
          if (enter === 'zoom') {
            opacity = e;
            s *= lerp(1.14, 1, e);
          } else if (enter === 'slide') {
            clip = `inset(0 0 0 ${((1 - e) * 100).toFixed(2)}%)`;
            x += (1 - e) * 14;
          } else if (enter === 'rise') {
            clip = `inset(${((1 - e) * 100).toFixed(2)}% 0 0 0)`;
            y += (1 - e) * 14;
          } else opacity = e;
        }
        // leaving, in step with how the next shot arrives
        if (next > 0) {
          const nextEnter = flat[j + 1].shot.enter;
          if (nextEnter === 'zoom') {
            s *= 1 + 0.42 * next;
            blur = next * 6;
          } else if (nextEnter === 'slide') {
            x -= next * 18;
            shade = next * 0.45;
          } else if (nextEnter === 'rise') {
            y -= next * 16;
            shade = next * 0.45;
          }
        }
        // never reveal an edge of the photo
        const slack = (s - 1) * 50;
        x = clamp(x, -slack, slack);
        y = clamp(y, -slack, slack);

        layer.style.opacity = opacity.toFixed(3);
        layer.style.clipPath = clip;
        img.style.transform = `translate3d(${x.toFixed(3)}%, ${y.toFixed(3)}%, 0) scale(${s.toFixed(4)})`;
        img.style.filter = blur > 0.2 || shade > 0.01 ? `blur(${blur.toFixed(1)}px) brightness(${(1 - shade).toFixed(3)})` : 'none';
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [readProgress]);

  const goToScene = useCallback((scene: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const j = flat.findIndex((f) => f.scene === scene);
    const u = j + 0.12;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (u / UNITS) * total, behavior: 'smooth' });
  }, []);

  const activeScene = flat[shotIdx].scene;
  const shot = flat[shotIdx].shot;
  const scene = scenes[activeScene];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      aria-label="How iFarmer works"
      className="relative bg-[#FFFDF5]"
      style={{ height: `calc(${(UNITS * SHOT_VH).toFixed(1)}svh + 100svh)` }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* ---------- right: the story, as film ---------- */}
        <div className="absolute inset-0 overflow-hidden bg-teal lg:inset-auto lg:bottom-4 lg:right-4 lg:top-[calc(var(--header-h)+16px)] lg:w-[55%] lg:rounded-[2rem]">
          {flat.map((f, j) => (
            <div
              key={f.shot.photo + j}
              ref={(el) => {
                layerRefs.current[j] = el;
              }}
              className="absolute inset-0 overflow-hidden"
              style={{ zIndex: j, visibility: j === 0 ? 'visible' : 'hidden' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={(el) => {
                  imgRefs.current[j] = el;
                }}
                src={j < loaded ? `/photos/${f.shot.photo}-1920.jpg` : undefined}
                srcSet={j < loaded ? srcSet(f.shot.photo) : undefined}
                sizes="(min-width: 1024px) 55vw, 100vw"
                alt={j === shotIdx ? f.shot.alt : ''}
                decoding="async"
                fetchPriority={j === 0 ? 'high' : 'auto'}
                className="absolute inset-0 h-full w-full object-cover will-change-transform"
                style={{ objectPosition: f.shot.focus ?? '50% 50%', transformOrigin: '50% 50%', transform: `scale(${f.shot.from.s})` }}
              />
            </div>
          ))}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[40] bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,43,54,0.38))]" />
          <div aria-hidden className="grain pointer-events-none absolute inset-0 z-[41] opacity-[0.08] mix-blend-overlay" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[42] h-[66%] bg-gradient-to-t from-[rgba(2,43,54,0.94)] via-[rgba(2,43,54,0.5)] to-transparent lg:h-[58%]" />

          <p key={'c' + shot.caption} className="lower-third pointer-events-none absolute right-6 top-6 z-[43] hidden rounded-full bg-[rgba(2,43,54,0.55)] px-3.5 py-1.5 text-[0.85rem] font-semibold text-white backdrop-blur lg:block">
            {shot.caption}
          </p>

          <div className="absolute inset-x-0 bottom-0 z-[50] p-5 pb-7 text-white lg:p-10 lg:pb-11">
            {phase === 'intro' && (
              <div className="lower-third max-w-[36rem]">
                <h2 className="text-[2.2rem] font-bold leading-[1.05] tracking-tight text-white lg:text-[3.2rem]">{howItWorks.title}</h2>
                <p className="mt-3 text-white/85 lg:text-[1.15rem]">{howItWorks.body}</p>
              </div>
            )}
            {phase === 'rail' && (
              <div key={activeScene} className="lower-third max-w-[38rem]">
                <p className="text-sm font-bold text-lime lg:text-[0.95rem]">{scene.service}</p>
                <h2 className="mt-1 text-[1.75rem] font-bold leading-[1.1] tracking-tight text-white lg:text-[2.6rem]">{scene.title}</h2>
                <p className="mt-2 line-clamp-3 text-[0.95rem] text-white/85 lg:mt-3 lg:line-clamp-none lg:text-[1.08rem] lg:leading-relaxed">{scene.body}</p>
                {scene.more && (
                  <Link href={scene.more.href} className="mt-4 hidden font-bold text-lime underline decoration-2 underline-offset-4 hover:text-white lg:inline-block">
                    {scene.more.label}
                  </Link>
                )}
                <div className="lg:hidden">
                  <Channels items={scene.channels} dark />
                </div>
              </div>
            )}
            {phase === 'outro' && (
              <div className="lower-third max-w-[40rem]">
                <h2 className="text-[1.9rem] font-bold leading-tight text-white lg:text-[3rem]">{outro.title}</h2>
                <p className="mt-3 hidden text-white/85 lg:block lg:text-[1.1rem]">{outro.body}</p>
                <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {headlineMetrics.slice(0, 4).map((id) => (
                    <div key={id}>
                      <dd className="whitespace-nowrap text-2xl font-bold text-lime lg:text-[1.65rem]">{metrics[id].value}</dd>
                      <dt className="text-sm text-white/80">{metrics[id].label}</dt>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-white/55">To date, as published in {METRICS_AS_OF}.</p>
              </div>
            )}
          </div>
        </div>

        {/* ---------- mobile: the phone floats over the film ---------- */}
        <div className="pointer-events-none absolute right-3 top-[calc(var(--header-h)+12px)] z-[45] w-[112px] lg:hidden" aria-hidden>
          <Phone screen={shot.screen} />
        </div>

        {/* ---------- left: the app journey ---------- */}
        <div className="absolute bottom-0 left-0 top-[var(--header-h)] hidden w-[45%] lg:flex lg:items-center">
          <div className="flex w-full items-center gap-7 pl-10 pr-8 xl:gap-10 xl:pl-14">
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] font-semibold text-field">The app journey</p>
              <h2 className="mt-1 text-[1.7rem] font-bold leading-tight tracking-tight xl:text-[2rem]">Every service, connected by our apps</h2>
              <Thread active={phase === 'intro' ? 0 : phase === 'outro' ? scenes.length : activeScene} shot={shot} onSelect={goToScene} />
            </div>
            <div className="w-[clamp(200px,17vw,262px)] shrink-0">
              <p key={'a' + shot.app} className="lower-third mb-3 flex items-center justify-center gap-2 text-[0.92rem] font-bold text-ink">
                <span className="h-2 w-2 rounded-full bg-leaf ring-4 ring-leaf/25" aria-hidden />
                {shot.app}
              </p>
              <Phone screen={shot.screen} />
              <p key={'d' + shot.does} className="lower-third mt-4 text-center text-[0.9rem] font-semibold leading-snug text-ink-soft">
                {shot.does}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const icon: Record<Channel['kind'], React.ReactNode> = {
  app: (
    <svg width="11" height="13" viewBox="0 0 12 14" aria-hidden>
      <rect x="1" y="0.75" width="10" height="12.5" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="10.6" r="0.9" fill="currentColor" />
    </svg>
  ),
  place: (
    <svg width="11" height="13" viewBox="0 0 12 14" aria-hidden>
      <path d="M6 13s4.6-4.3 4.6-7.6A4.6 4.6 0 0 0 1.4 5.4C1.4 8.7 6 13 6 13z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="5.4" r="1.6" fill="currentColor" />
    </svg>
  ),
  partner: null,
};

export function Channels({ items, dark = false, compact = false }: { items: Channel[]; dark?: boolean; compact?: boolean }) {
  return (
    <ul className={`flex flex-wrap gap-1.5 ${compact ? 'mt-1.5' : 'mt-4'}`} aria-label="Delivered through">
      {items.map((c) => (
        <li key={c.name}>
          <Link
            href={c.href}
            tabIndex={compact ? -1 : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-colors ${compact ? 'px-2.5 py-0.5 text-[0.78rem]' : 'px-2.5 py-1 text-[0.82rem]'} ${
              dark
                ? 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur hover:bg-lime hover:text-ink'
                : c.kind === 'app'
                  ? compact
                    ? 'bg-leaf-50 text-field ring-1 ring-leaf/30'
                    : 'bg-field text-white hover:bg-field-700'
                  : c.kind === 'place'
                    ? compact
                      ? 'bg-lime/50 text-ink-soft'
                      : 'bg-lime text-ink hover:bg-leaf'
                    : 'bg-white text-ink-soft ring-1 ring-ink/15 hover:ring-field'
            }`}
          >
            {icon[c.kind]}
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Every service on one thread; the thread fills up to the service on screen. */
function Thread({ active, shot, onSelect }: { active: number; shot: Shot; onSelect: (scene: number) => void }) {
  const items = useMemo(() => scenes.map((s, i) => ({ s, i })).slice(1), []);
  return (
    <ol className="relative mt-6">
      {items.map(({ s, i }, n) => {
        const on = i === active;
        const done = i < active;
        const lastItem = n === items.length - 1;
        return (
          <li key={s.id} className="relative pl-8">
            {!lastItem && (
              <span aria-hidden className="absolute left-[8px] top-[16px] h-full w-[3px] overflow-hidden rounded-full bg-ink/10">
                <span className="block w-full rounded-full bg-leaf transition-[height] duration-500" style={{ height: done ? '100%' : '0%' }} />
              </span>
            )}
            <span
              aria-hidden
              className={`absolute left-0 top-[4px] h-[19px] w-[19px] rounded-full border-[3px] transition-colors duration-300 ${on ? 'border-field bg-lime shadow-[0_0_0_5px_rgba(136,187,65,0.25)]' : done ? 'border-leaf bg-leaf' : 'border-ink/15 bg-[#FFFDF5]'}`}
            />
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={on ? 'true' : undefined}
              className={`text-left text-[0.98rem] font-bold transition-colors ${on ? 'text-field' : done ? 'text-ink' : 'text-ink-soft hover:text-field'}`}
            >
              {s.service}
            </button>
            <div className={on ? 'pb-4' : 'pb-2.5'}>
              <Channels items={s.channels} compact={!on} />
              {on && (
                <p key={shot.does} className="thread-open mt-2.5 text-[0.9rem] text-ink-soft">
                  <span className="font-bold text-ink">In {shot.app}:</span> {shot.does.charAt(0).toLowerCase() + shot.does.slice(1)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Reduced-motion version: the same services and photos as a readable sequence. */
export function JourneyStatic() {
  return (
    <section aria-label="How iFarmer serves a farmer through the season" className="bg-[#FFFDF5]">
      <div className="container py-16 md:py-24">
        <h2 id="how-it-works" className="max-w-3xl text-h1">{howItWorks.title}</h2>
        <p className="mt-5 max-w-2xl text-lead text-ink-soft">{howItWorks.body}</p>
        <ul className="mt-14 space-y-6">
          {scenes.slice(1).map((s) => (
            <li key={s.id} className="grid overflow-hidden rounded-[2rem] bg-white ring-1 ring-ink/[0.07] md:grid-cols-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/photos/${s.shots[0].photo}-1080.jpg`} alt={s.shots[0].alt} className="aspect-[4/3] h-full w-full object-cover" loading="lazy" />
              <div className="p-8">
                <p className="font-bold text-field">{s.service}</p>
                <h2 className="mt-1 text-h2">{s.title}</h2>
                <p className="mt-3 text-ink-soft">{s.body}</p>
                <Channels items={s.channels} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
