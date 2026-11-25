'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { beats } from '@/content/story3d';
import { intro, outro, scenes } from '@/content/journey';
import { metrics, headlineMetrics, METRICS_AS_OF } from '@/content/metrics';
import { Channels, JourneyStatic } from './Journey';
import { Phone } from './PhoneScreens';
import { ServiceLoop } from './ServiceLoop';
import type { DeltaWorld } from '@/three/delta';

const N = beats.length;
const BEAT_VH = 72;
const anchorFor: Record<string, string> = {
  apply: 'home',
  fund: 'town',
  receive: 'home',
  buy: 'shop',
  card: 'shop',
  grow: 'field',
  grow2: 'sensor',
  harvest: 'harvest',
  collect: 'collect',
  dispatch: 'highway',
  center: 'center',
  paid: 'home',
  returns: 'town',
};
const services = scenes.filter((s) => s.id !== 'intro');
// pins over the world on the opening and closing views: every service, in its place
const pins: { anchor: string; label: string }[] = [
  { anchor: 'home', label: 'The farmer' },
  { anchor: 'town', label: 'Finance' },
  { anchor: 'shop', label: 'Inputs' },
  { anchor: 'field', label: 'Advice & insurance' },
  { anchor: 'center', label: 'Market & iFarmer Center' },
];
const sceneById = (id: string) => scenes.find((s) => s.id === id);

function canUseWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

export function Story3D() {
  const [mode, setMode] = useState<'pending' | '3d' | 'static'>('pending');
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const forceStatic = new URLSearchParams(window.location.search).has('static');
    setMode(!reduced && !forceStatic && canUseWebGL() ? '3d' : 'static');
  }, []);
  if (mode === 'static') return <JourneyStatic />;
  return <Story3DInner />;
}

function Story3DInner() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const worldRef = useRef<DeltaWorld | null>(null);
  const beatRef = useRef(0);
  const [beat, setBeat] = useState(0);
  const [ready, setReady] = useState(false);
  const [bare, setBare] = useState(false);
  useEffect(() => setBare(new URLSearchParams(window.location.search).has('bare')), []);

  useEffect(() => {
    let disposed = false;
    let world: DeltaWorld | null = null;
    const section = sectionRef.current!;
    const pos = { x: 0, y: 0, visible: false };
    const read = () => {
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    };
    const snap = new URLSearchParams(window.location.search).has('snap');
    const onScroll = () => {
      world?.setProgress(read());
      if (snap && world) world.progress = world.target;
    };
    const onResize = () => world?.resize();

    (async () => {
      await document.fonts?.ready;
      const mod = await import('@/three/delta');
      if (disposed || !canvasRef.current) return;
      const nav = navigator as Navigator & { deviceMemory?: number };
      const small = window.innerWidth < 900 || (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
      const forceLow = new URLSearchParams(window.location.search).has('low');
      world = new mod.DeltaWorld(
        canvasRef.current,
        beats.map((b) => b.id),
        {
          quality: small || forceLow ? 'low' : 'high',
          onFrame: (w) => {
            const x = w.progress * (N - 1);
            const idx = Math.round(x);
            if (idx !== beatRef.current) {
              beatRef.current = idx;
              setBeat(idx);
            }
            // service pins on the opening and closing views
            const pinFade = Math.max(1 - Math.min(1, x * 2.4), Math.min(1, Math.max(0, (x - (N - 1.6)) * 2)));
            pins.forEach((pin, k) => {
              const pe = pinRefs.current[k];
              if (!pe) return;
              w.screen(pin.anchor, pos);
              const vw = w.renderer.domElement.clientWidth;
              const covered = vw >= 1024 && pos.x < vw * 0.49;
              const show = pinFade > 0.01 && pos.visible && !covered && pos.y > 90;
              pe.style.opacity = show ? String(pinFade) : '0';
              if (show) {
                const half = pe.offsetWidth / 2;
                const px = Math.min(Math.max(pos.x, half + 8), vw - half - 8);
                pe.style.transform = `translate3d(${px}px, ${pos.y}px, 0) translate(-50%, -100%)`;
              }
            });
            const el = labelRef.current;
            if (!el) return;
            const a = anchorFor[beats[idx].id];
            const local = x - idx;
            if (!a) {
              el.style.opacity = '0';
              return;
            }
            w.screen(a, pos);
            const fade = 1 - Math.min(1, Math.abs(local) * 2.6);
            el.style.opacity = pos.visible ? String(Math.max(0, fade)) : '0';
            const half = el.offsetWidth / 2;
            const vw = w.renderer.domElement.clientWidth;
            const px = Math.min(Math.max(pos.x, half + 12), vw - half - 12);
            const py = Math.max(pos.y, 150);
            el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -100%)`;
          },
        },
      );
      worldRef.current = world;
      world.setProgress(read());
      world.progress = world.target;
      world.start();
      setReady(true);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
    })();

    const io = new IntersectionObserver(([e]) => worldRef.current?.setVisible(e.isIntersecting), { rootMargin: '200px' });
    io.observe(section);
    return () => {
      disposed = true;
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      world?.dispose();
      worldRef.current = null;
    };
  }, []);

  const goTo = useCallback((sceneId: string) => {
    const section = sectionRef.current;
    if (!section) return;
    const k = beats.findIndex((b) => b.scene === sceneId);
    const top = section.getBoundingClientRect().top + window.scrollY;
    const total = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (k / (N - 1)) * total, behavior: 'smooth' });
  }, []);

  const b = beats[beat];
  const scene = sceneById(b.scene);
  const isIntro = b.id === 'intro';
  const isOutro = b.id === 'outro';
  const activeIdx = services.findIndex((s) => s.id === b.scene);

  return (
    <section ref={sectionRef} id="how-it-works" aria-label="How iFarmer serves a farmer through the season" className="relative bg-[#FFFDF5]" style={{ height: `calc(${N * BEAT_VH}svh + 100svh)` }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`} aria-hidden />
        {!ready && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/scenes/delta-intro.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
        )}

        {!bare && (<>
        {/* label pinned in the world */}
        <div ref={labelRef} className="pointer-events-none absolute left-0 top-0 z-10 opacity-0 transition-opacity duration-300" aria-hidden>
          <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/95 py-1.5 pl-2 pr-3.5 text-sm font-bold text-ink shadow-[0_10px_30px_-10px_rgba(2,43,54,0.5)]">
            <span className="h-2.5 w-2.5 rounded-full bg-leaf ring-4 ring-leaf/30" />
            {b.label}
          </div>
          <div className="mx-auto h-6 w-px bg-white/80" />
        </div>

        {pins.map((pin, k) => (
          <div key={pin.anchor} ref={(el) => { pinRefs.current[k] = el; }} className="pointer-events-none absolute left-0 top-0 z-10 opacity-0 transition-opacity duration-300" aria-hidden>
            <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/90 py-1 pl-1.5 pr-3 text-[0.8rem] font-bold text-ink shadow-[0_8px_24px_-10px_rgba(2,43,54,0.55)] lg:text-[0.86rem]">
              <span className="h-2 w-2 rounded-full bg-leaf ring-[3px] ring-leaf/30" />
              {pin.label}
            </div>
            <div className="mx-auto h-4 w-px bg-white/80" />
          </div>
        ))}

        {/* bottom shade for the story titles */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[46%] bg-gradient-to-t from-[rgba(2,30,36,0.82)] via-[rgba(2,30,36,0.35)] to-transparent" />

        {/* ---------- left: the app journey (desktop) ---------- */}
        <div className="absolute bottom-0 left-0 top-[var(--header-h)] z-20 hidden w-[47%] bg-gradient-to-r from-[rgba(255,253,245,0.95)] via-[rgba(255,253,245,0.86)] to-transparent lg:block">
          <div className="flex h-full items-center gap-7 pl-10 pr-14 xl:gap-10 xl:pl-14">
            <div className="min-w-0 flex-1">
              {isIntro ? (
                <div className="lower-third max-w-[38rem]">
                  <h1 className="text-[clamp(2.4rem,3.9vw,3.8rem)] font-bold leading-[1.03] tracking-[-0.035em] text-ink">{intro.title}</h1>
                  <p className="mt-4 max-w-[32rem] text-[1.08rem] leading-relaxed text-ink-soft">{intro.body}</p>
                  <p className="mt-7 text-[0.95rem] font-bold text-field">Every service, from financing to payout</p>
                  <div className="mt-3">
                    <ServiceLoop onPick={goTo} />
                  </div>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => goTo('finance')} className="btn-primary">
                      Follow a season
                    </button>
                    <Link href="#paths" className="btn-ghost bg-white/60">
                      Find your path
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[0.95rem] font-semibold text-field">The app journey</p>
                  <h2 className="mt-1 text-[1.5rem] font-bold leading-tight tracking-tight xl:text-[1.75rem]">Every service, connected by our apps</h2>
                  <ol className="relative mt-5">
                    {services.map((s, n) => {
                      const on = n === activeIdx;
                      const done = isOutro || n < activeIdx;
                      return (
                        <li key={s.id} className="relative pl-8">
                          {n < services.length - 1 && (
                            <span aria-hidden className="absolute left-[8px] top-[16px] h-full w-[3px] overflow-hidden rounded-full bg-ink/10">
                              <span className="block w-full rounded-full bg-leaf transition-[height] duration-500" style={{ height: done ? '100%' : '0%' }} />
                            </span>
                          )}
                          <span
                            aria-hidden
                            className={`absolute left-0 top-[4px] h-[19px] w-[19px] rounded-full border-[3px] transition-colors duration-300 ${on ? 'border-field bg-lime shadow-[0_0_0_5px_rgba(136,187,65,0.25)]' : done ? 'border-leaf bg-leaf' : 'border-ink/15 bg-[#FFFDF5]'}`}
                          />
                          <button type="button" onClick={() => goTo(s.id)} aria-current={on ? 'true' : undefined} className={`text-left text-[0.98rem] font-bold transition-colors ${on ? 'text-field' : done ? 'text-ink' : 'text-ink-soft hover:text-field'}`}>
                            {s.service}
                          </button>
                          <div className={on ? 'pb-4' : 'pb-2.5'}>
                            {on ? <Channels items={s.channels} /> : <div className="hidden [@media(min-height:880px)]:block"><Channels items={s.channels} compact /></div>}
                            {on && (
                              <p key={b.id} className="thread-open mt-2.5 text-[0.9rem] text-ink-soft">
                                <span className="font-bold text-ink">In {b.app}:</span> {b.does.charAt(0).toLowerCase() + b.does.slice(1)}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
            <div className={`w-[clamp(196px,16vw,250px)] shrink-0 ${isIntro ? 'hidden' : ''}`}>
              <p key={'a' + b.app} className="lower-third mb-3 flex items-center justify-center gap-2 text-[0.92rem] font-bold text-ink">
                <span className="h-2 w-2 rounded-full bg-leaf ring-4 ring-leaf/25" aria-hidden />
                {b.app}
              </p>
              <Phone screen={b.screen} />
              <p key={'d' + b.does} className="lower-third mt-4 text-center text-[0.9rem] font-semibold leading-snug text-ink-soft">
                {b.does}
              </p>
            </div>
          </div>
        </div>

        {/* ---------- story titles over the world ---------- */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-5 pb-7 text-white lg:left-[47%] lg:p-10 lg:pb-12">
          {isIntro && (
            <div className="lower-third max-w-[34rem] lg:hidden">
              <h1 className="text-[2.15rem] font-bold leading-[1.05] tracking-tight text-white">{intro.title}</h1>
              <p className="mt-2.5 text-[0.95rem] text-white/85">{intro.body}</p>
              <p className="mt-4 text-sm font-bold text-lime">Every service, from financing to payout</p>
              <div className="mt-2">
                <ServiceLoop onPick={goTo} compact />
              </div>
            </div>
          )}
          {!isIntro && !isOutro && scene && (
            <div key={scene.id} className="lower-third max-w-[36rem]">
              <p className="text-sm font-bold text-lime lg:text-[0.95rem]">{scene.service}</p>
              <h2 className="mt-1 text-[1.75rem] font-bold leading-[1.1] tracking-tight text-white lg:text-[2.4rem]">{scene.title}</h2>
              <p className="mt-2 line-clamp-3 text-[0.95rem] text-white/85 lg:mt-3 lg:line-clamp-none lg:text-[1.05rem] lg:leading-relaxed">{scene.body}</p>
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
          {isOutro && (
            <div className="lower-third max-w-[40rem]">
              <h2 className="text-[1.9rem] font-bold leading-tight text-white lg:text-[2.8rem]">{outro.title}</h2>
              <p className="mt-3 hidden text-white/85 lg:block">{outro.body}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {headlineMetrics.slice(0, 4).map((id) => (
                  <div key={id}>
                    <dd className="whitespace-nowrap text-2xl font-bold text-lime lg:text-[1.6rem]">{metrics[id].value}</dd>
                    <dt className="text-sm text-white/80">{metrics[id].label}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-white/55">To date, as published in {METRICS_AS_OF}.</p>
            </div>
          )}
        </div>

        {/* mobile phone */}
        <div className={`pointer-events-none absolute right-3 top-[calc(var(--header-h)+12px)] z-20 w-[108px] lg:hidden ${isIntro || isOutro ? 'hidden' : ''}`} aria-hidden>
          <Phone screen={b.screen} />
        </div>
        </>)}
      </div>
    </section>
  );
}
