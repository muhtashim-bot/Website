'use client';

/*
 * The homepage story. Real footage plays full screen behind the page and crossfades from step to
 * step as the reader scrolls. On the left: the phone with the app for this moment, the services on
 * a half circle around it (the current one at the front), and the story text beside it.
 * Only the clip on screen and its neighbours are loaded, and only the one on screen plays.
 */
import Link from 'next/link';
import { preconnect } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { beats } from '@/content/story3d';
import { intro, outro, scenes } from '@/content/journey';
import { metrics, headlineMetrics, METRICS_AS_OF } from '@/content/metrics';
import { clips, sceneMedia, type Clip } from '@/content/storyVideo';
import { Channels } from './Journey';
import { Phone } from './PhoneScreens';
import { ServiceOrbit } from './ServiceOrbit';

const N = beats.length;
const BEAT_VH = 40;
const services = scenes.filter((s) => s.id !== 'intro');
const sceneById = (id: string) => scenes.find((s) => s.id === id);
const ORDER = ['intro', ...services.map((s) => s.id), 'outro'];

export function StoryVideo() {
  preconnect('https://videos.pexels.com');
  preconnect('https://images.pexels.com');
  const sectionRef = useRef<HTMLElement>(null);
  const [beat, setBeat] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMobile(window.matchMedia('(max-width: 767px)').matches);
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const section = sectionRef.current!;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      setBeat(Math.round(p * (N - 1)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const goTo = useCallback((sceneId: string) => {
    const section = sectionRef.current;
    if (!section) return;
    const k = Math.max(0, beats.findIndex((b) => b.scene === sceneId));
    const top = section.getBoundingClientRect().top + window.scrollY;
    const total = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (k / (N - 1)) * total, behavior: 'smooth' });
  }, []);

  const b = beats[beat];
  const scene = sceneById(b.scene);
  const isIntro = b.id === 'intro';
  const isOutro = b.id === 'outro';

  return (
    <section ref={sectionRef} id="how-it-works" aria-label="How iFarmer serves a farmer through the season" className="relative bg-[#FFFDF5]" style={{ height: `calc(${N * BEAT_VH}svh + 100svh)` }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#1d2b22]">
        <Backdrop scene={b.scene} mobile={mobile} reduced={reduced} />

        {/* light from the left and the top: the story and the navigation sit on it */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[6] hidden w-[88%] bg-[linear-gradient(90deg,rgba(255,253,245,0.97)_0%,rgba(255,253,245,0.95)_46%,rgba(255,253,245,0.84)_62%,rgba(255,253,245,0.45)_78%,rgba(255,253,245,0)_100%)] lg:block" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[6] h-[24%] bg-gradient-to-b from-[rgba(255,253,245,0.94)] via-[rgba(255,253,245,0.55)] to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-[64%] bg-gradient-to-t from-[rgba(2,30,36,0.94)] via-[rgba(2,30,36,0.55)] to-transparent lg:hidden" />

        {/* ---------- desktop ---------- */}
        <div className="absolute inset-0 z-20 hidden items-center pl-[clamp(2rem,5vw,6rem)] pt-[var(--header-h)] lg:flex">
          {isIntro && (
            <div className="lower-third w-[min(52vw,760px)]">
              <ServiceOrbit onPick={goTo}>
                <h1 className="text-[clamp(1.6rem,2.5vw,2.6rem)] font-bold leading-[1.04] tracking-[-0.035em] text-ink">{intro.title}</h1>
                <p className="mt-2 text-[clamp(0.8rem,0.95vw,0.95rem)] font-bold text-field">Every service, from financing to payout</p>
              </ServiceOrbit>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 pl-[6%]">
                <p className="max-w-[26rem] text-[1rem] leading-relaxed text-ink-soft">{intro.body}</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => goTo('finance')} className="btn-primary">
                    Follow a season
                  </button>
                  <Link href="#paths" className="btn-ghost bg-white/70">
                    Find your path
                  </Link>
                </div>
              </div>
            </div>
          )}
          {!isIntro && !isOutro && scene && <StepsArc beatIdx={beat} onPick={goTo} />}
          {isOutro && (
            <div className="lower-third max-w-[40rem]">
              <h2 className="text-[clamp(2rem,3.2vw,3rem)] font-bold leading-[1.05] tracking-tight text-ink">{outro.title}</h2>
              <p className="mt-4 max-w-[32rem] text-[1.05rem] leading-relaxed text-ink-soft">{outro.body}</p>
              <dl className="mt-7 grid grid-cols-2 gap-x-10 gap-y-5">
                {headlineMetrics.slice(0, 4).map((id) => (
                  <div key={id}>
                    <dd className="whitespace-nowrap text-[2rem] font-bold leading-none text-field">{metrics[id].value}</dd>
                    <dt className="mt-1 text-sm text-ink-soft">{metrics[id].label}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-ink-mute">To date, as published in {METRICS_AS_OF}.</p>
            </div>
          )}
        </div>

        {/* ---------- phones ---------- */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-7 text-white lg:hidden">
          {isIntro && (
            <div className="lower-third mx-auto max-w-[26rem] px-5">
              <ServiceOrbit onPick={goTo} compact dark>
                <h1 className="text-[1.08rem] font-bold leading-[1.1] tracking-tight text-white">{intro.title}</h1>
                <p className="mt-1 text-[0.62rem] font-bold leading-snug text-lime">Every service, from financing to payout</p>
              </ServiceOrbit>
              <div className="mt-5 flex justify-center">
                <button type="button" onClick={() => goTo('finance')} className="btn-primary !py-2.5">
                  Follow a season
                </button>
              </div>
            </div>
          )}
          {!isIntro && !isOutro && scene && (
            <div>
              <MiniArc active={services.findIndex((s) => s.id === scene.id)} />
              <div className="mt-4 flex items-end gap-4">
                <div className="w-[94px] shrink-0">
                  <Phone screen={b.screen} />
                </div>
                <div key={b.id} className="lower-third min-w-0">
                  <p className="text-[0.8rem] font-bold text-lime">{scene.service}</p>
                  <h2 className="mt-0.5 text-[1.35rem] font-bold leading-[1.1] tracking-tight text-white">{scene.title}</h2>
                  <p className="mt-1.5 line-clamp-3 text-[0.85rem] leading-snug text-white/85">{scene.body}</p>
                  <p className="mt-2 text-[0.8rem] text-white/80">
                    <span className="font-bold text-white">In {b.app}:</span> {lower(b.does)}
                  </p>
                </div>
              </div>
            </div>
          )}
          {isOutro && (
            <div className="lower-third">
              <h2 className="text-[1.8rem] font-bold leading-tight text-white">{outro.title}</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                {headlineMetrics.slice(0, 4).map((id) => (
                  <div key={id}>
                    <dd className="text-2xl font-bold text-lime">{metrics[id].value}</dd>
                    <dt className="text-sm text-white/80">{metrics[id].label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <a href="#footage" className="absolute bottom-3 right-4 z-20 hidden text-[0.7rem] font-semibold text-white/60 hover:text-white lg:block">
          Footage: Pexels
        </a>
      </div>
    </section>
  );
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/* ------------------------------------------------------------------ background footage */

function Backdrop({ scene, mobile, reduced }: { scene: string; mobile: boolean; reduced: boolean }) {
  const media = sceneMedia[scene] ?? sceneMedia.intro;
  const [armed, setArmed] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const i = ORDER.indexOf(scene);
    const near = [ORDER[i - 1], ORDER[i], ORDER[i + 1]].filter(Boolean).map((s) => sceneMedia[s]?.clip).filter(Boolean) as string[];
    setArmed((prev) => (near.every((k) => prev.has(k)) ? prev : new Set([...prev, ...near])));
  }, [scene]);
  const photos = Object.entries(sceneMedia).filter(([, m]) => m.photo);
  return (
    <div className="absolute inset-0">
      {Object.values(clips).map((c) => (
        <ClipVideo key={c.key} clip={c} armed={armed.has(c.key)} active={media.clip === c.key} start={media.clip === c.key ? media.start : undefined} scene={scene} mobile={mobile} reduced={reduced} />
      ))}
      {photos.map(([id, m]) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={id}
          src={m.photo}
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${scene === id ? 'kenburns opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  );
}

function ClipVideo({ clip, armed, active, start, scene, mobile, reduced }: { clip: Clip; armed: boolean; active: boolean; start?: number; scene: string; mobile: boolean; reduced: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (armed) ref.current?.load();
  }, [armed]);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      const seek = () => {
        if (start !== undefined && Math.abs(v.currentTime - start) > 1.5) v.currentTime = Math.min(start, Math.max(0, (v.duration || start + 1) - 1));
      };
      if (v.readyState >= 1) seek();
      else v.addEventListener('loadedmetadata', seek, { once: true });
      if (!reduced) v.play().catch(() => {});
      return;
    }
    const t = window.setTimeout(() => v.pause(), 800);
    return () => window.clearTimeout(t);
  }, [active, scene, start, reduced, armed]);
  return (
    <video
      ref={ref}
      muted
      playsInline
      loop
      disablePictureInPicture
      preload={active ? 'auto' : armed ? 'metadata' : 'none'}
      poster={armed ? clip.poster : undefined}
      aria-hidden
      className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[800ms] ease-out ${active ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'}`}
    >
      {armed && (mobile ? clip.mobile : clip.desktop).map((src) => <source key={src} src={src} type="video/mp4" />)}
    </video>
  );
}

/* ------------------------------------------------------------------ steps on a half circle (desktop) */

const ANGLES = [0, 40, 63, 82, 100];

function StepsArc({ beatIdx, onPick }: { beatIdx: number; onPick: (scene: string) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const [H, setH] = useState(620);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const b = beats[beatIdx];
  const scene = sceneById(b.scene)!;
  const active = services.findIndex((s) => s.id === scene.id);
  const phoneH = H * 0.76;
  const phoneW = (phoneH * 300) / 632;
  const cx = phoneW / 2;
  const cy = H / 2;
  const R = phoneW / 2 + H * 0.3;
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [R + R * Math.cos((a * Math.PI) / 180), R + R * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`;
  };

  return (
    <div ref={stage} className="relative h-[min(calc(100svh-var(--header-h)-40px),680px)]" style={{ width: cx + R + 46 + 400 }}>
      {/* the half circle: travelled part above the front, the rest below */}
      <svg aria-hidden className="absolute overflow-visible" style={{ left: cx - R, top: cy - R, width: 2 * R, height: 2 * R }} viewBox={`0 0 ${2 * R} ${2 * R}`}>
        <path d={arc(-100, 0)} fill="none" stroke="#88BB41" strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" />
        <path d={arc(0, 100)} fill="none" stroke="rgba(2,43,54,0.14)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* the phone, inside the half circle */}
      <div className="absolute" style={{ left: 0, top: cy - phoneH / 2, width: phoneW }}>
        <p key={'a' + b.app} className="lower-third absolute -top-8 left-0 right-0 flex items-center justify-center gap-2 text-[0.92rem] font-bold text-ink">
          <span className="h-2 w-2 rounded-full bg-leaf ring-4 ring-leaf/25" aria-hidden />
          {b.app}
        </p>
        <Phone screen={b.screen} />
      </div>

      {/* the services, turning round the half circle */}
      <div className="absolute" style={{ left: cx, top: cy }}>
        {services.map((s, i) => {
          const d = i - active;
          const a = Math.sign(d) * ANGLES[Math.min(ANGLES.length - 1, Math.abs(d))];
          const opacity = d === 0 ? 0 : Math.abs(d) === 1 ? 1 : Math.abs(d) === 2 ? 0.6 : Math.abs(d) === 3 ? 0.3 : 0;
          return (
            <div key={s.id} className="absolute left-0 top-0 transition-transform duration-500 ease-out" style={{ transform: `rotate(${a}deg) translateX(${R}px)` }}>
              <div className="transition-transform duration-500 ease-out" style={{ transform: `rotate(${-a}deg)` }}>
                <button
                  type="button"
                  onClick={() => onPick(s.id)}
                  tabIndex={opacity ? 0 : -1}
                  aria-hidden={opacity ? undefined : true}
                  className="group flex -translate-y-1/2 items-center gap-3 whitespace-nowrap transition-opacity duration-500"
                  style={{ opacity, pointerEvents: opacity ? 'auto' : 'none' }}
                >
                  <span className={`-ml-[7px] h-[14px] w-[14px] rounded-full border-[3px] ${d < 0 ? 'border-leaf bg-leaf' : 'border-ink/20 bg-[#FFFDF5]'}`} aria-hidden />
                  <span className={`text-[0.98rem] font-bold group-hover:text-field ${d < 0 ? 'text-ink' : 'text-ink-soft'}`}>{s.service}</span>
                </button>
              </div>
            </div>
          );
        })}
        {/* the front of the half circle: the current service */}
        <span aria-hidden className="absolute h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-field bg-lime shadow-[0_0_0_7px_rgba(136,187,65,0.22)]" style={{ left: R, top: 0 }} />
        <span aria-hidden className="absolute h-[2px] -translate-y-1/2 bg-field/40" style={{ left: R + 14, top: 0, width: 26 }} />
      </div>

      {/* the story for this step */}
      <div className="absolute w-[min(400px,28vw)] -translate-y-1/2" style={{ left: cx + R + 46, top: cy }}>
       <div key={scene.id} className="lower-third">
        <p className="text-[0.95rem] font-bold text-field">{scene.service}</p>
        <h2 className="mt-1 text-[clamp(1.7rem,2.5vw,2.4rem)] font-bold leading-[1.06] tracking-tight text-ink">{scene.title}</h2>
        <p className="mt-3 line-clamp-4 text-[1rem] leading-relaxed text-ink-soft">{scene.body}</p>
        <p key={b.id} className="thread-open mt-3 text-[0.95rem] text-ink-soft">
          <span className="font-bold text-ink">In {b.app}:</span> {lower(b.does)}
        </p>
        <div className="mt-3 hidden [@media(min-height:760px)]:block">
          <Channels items={scene.channels} />
        </div>
        {scene.more && (
          <Link href={scene.more.href} className="mt-4 inline-block font-bold text-field underline decoration-2 underline-offset-4 hover:text-ink">
            {scene.more.label}
          </Link>
        )}
       </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ steps on a shallow arc (phones) */

function MiniArc({ active }: { active: number }) {
  const n = services.length;
  return (
    <ol className="relative h-7" aria-label="Services">
      {services.map((s, i) => {
        const t = i / (n - 1);
        const y = 22 * (1 - Math.sin(Math.PI * t)); // ends lower, middle higher: half a circle, flattened
        const on = i === active;
        return (
          <li key={s.id} className="absolute -translate-x-1/2" style={{ left: `${6 + t * 88}%`, top: y }} aria-current={on ? 'step' : undefined}>
            <span className={`block rounded-full transition-all duration-300 ${on ? 'h-3.5 w-3.5 bg-lime ring-4 ring-lime/25' : i < active ? 'h-2.5 w-2.5 bg-leaf' : 'h-2.5 w-2.5 bg-white/40'}`} />
            <span className="sr-only">{s.service}</span>
          </li>
        );
      })}
    </ol>
  );
}
