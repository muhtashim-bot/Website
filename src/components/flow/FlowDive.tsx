'use client';

/*
 * What happens when a station on the flow map is clicked: the map zooms into it and the
 * service's phone floats out of the station into the middle of the screen, with no card or
 * backdrop around it. Scrolling (wheel, swipe, arrow keys) walks through the service's steps,
 * the phone changing screen and the words arriving beside it. Scrolling past the last step, or
 * back before the first, zooms out to the map again.
 */
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone } from '../PhoneScreens';
import type { Station } from './parts';

const OUT_MS = 520;

export function FlowDive({ station, from, onExit, onSeason, dark = false }: { station: Station; from: { x: number; y: number }; onExit: () => void; onSeason?: () => void; dark?: boolean }) {
  const n = station.steps.length;
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'measure' | 'in' | 'out'>('measure');
  const [vec, setVec] = useState({ x: 0, y: 0 });
  const phone = useRef<HTMLDivElement>(null);
  const idx = useRef(0);
  const leaving = useRef(false);
  const after = useRef<(() => void) | null>(null);
  const gesture = useRef({ lastEvent: 0, lastStep: 0, acc: 0, used: false, touchY: null as number | null });

  // measure where the phone will sit, so it can fly there from the station
  useLayoutEffect(() => {
    const r = phone.current?.getBoundingClientRect();
    if (r) setVec({ x: Math.round(from.x - (r.left + r.width / 2)), y: Math.round(from.y - (r.top + r.height / 2)) });
    setPhase('in');
  }, [from.x, from.y]);

  const exit = useCallback(
    (then?: () => void) => {
      if (leaving.current) return;
      leaving.current = true;
      after.current = then ?? null;
      setPhase('out');
      window.setTimeout(() => {
        onExit();
        const next = after.current;
        if (next) requestAnimationFrame(next);
      }, OUT_MS);
    },
    [onExit],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      const next = idx.current + dir;
      if (next < 0 || next >= n) {
        exit();
        return;
      }
      idx.current = next;
      setI(next);
    },
    [n, exit],
  );

  // the page holds still; the scroll drives the steps instead
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    const g = gesture.current;
    // one step per gesture: a pause in the wheel events starts a new one, since a trackpad keeps
    // sending them for a while after the fingers lift; a very long scroll may step again
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      if (now - g.lastEvent > 220) {
        g.acc = 0;
        g.used = false;
      }
      g.lastEvent = now;
      if (g.used && now - g.lastStep < 1100) return;
      g.acc += e.deltaY;
      if (Math.abs(g.acc) > 30) {
        const dir = g.acc > 0 ? 1 : -1;
        g.used = true;
        g.lastStep = now;
        g.acc = 0;
        step(dir);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      g.touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY;
      if (g.touchY === null || y === undefined) return;
      const dy = y - g.touchY;
      const now = performance.now();
      if (Math.abs(dy) > 46 && now - g.lastStep > 350) {
        g.touchY = y;
        g.lastStep = now;
        step(dy < 0 ? 1 : -1);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit();
      else if (['ArrowDown', 'PageDown', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
        step(1);
      } else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [step, exit]);

  const s = station.steps[i];
  const last = i === n - 1;
  const fly = { ['--zx' as string]: `${vec.x}px`, ['--zy' as string]: `${vec.y}px` };

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center px-5 pb-6 pt-[calc(var(--header-h)+12px)]" role="dialog" aria-modal="true" aria-labelledby="flow-dive-title">
      {/* a soft wash of light behind the phone and words, so they read over the map; no edges */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[92vh] w-[min(1200px,110vw)] -translate-x-1/2 -translate-y-1/2 ${
          dark ? 'bg-[radial-gradient(closest-side,rgba(1,32,38,0.78),rgba(1,32,38,0.5)_60%,rgba(1,32,38,0))]' : 'bg-[radial-gradient(closest-side,rgba(255,253,245,0.94),rgba(255,253,245,0.75)_55%,rgba(255,253,245,0))]'
        } ${phase === 'out' ? 'flow-fade-out' : 'flow-fade-in'}`}
      />
      <div className="relative flex w-full max-w-[980px] flex-col items-center gap-5 md:flex-row md:justify-center md:gap-[clamp(2.5rem,5vw,5rem)]">
        <div ref={phone} className={phase === 'measure' ? 'opacity-0' : phase === 'in' ? 'flow-zoom-in' : 'flow-zoom-out'} style={fly}>
          <div className="flow-float">
            <Phone screen={s.screen} className="w-[min(42vw,190px,calc((100svh-430px)*0.47))] md:w-[clamp(200px,17vw,262px)]" />
          </div>
        </div>

        <div className={`w-[min(92vw,420px)] text-center md:text-left ${phase === 'out' ? 'flow-fade-out' : 'flow-info-in'}`}>
          <button type="button" onClick={() => exit()} className="mb-4 hidden items-center gap-1.5 text-sm font-bold text-ink-soft transition-colors hover:text-field md:inline-flex">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Back to the map
          </button>
          <p className={`text-sm font-bold ${dark ? 'text-lime' : 'text-field'}`}>{station.via}</p>
          <h2 id="flow-dive-title" className={`mt-1 text-[clamp(1.7rem,3vw,2.6rem)] font-bold leading-[1.05] tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>
            {station.label}
          </h2>

          <div key={i} className="lower-third mt-4 md:mt-6" aria-live="polite">
            <p className={`text-[0.8rem] font-bold ${dark ? 'text-white/60' : 'text-ink-mute'}`}>
              Step {i + 1} of {n}
            </p>
            <p className={`mt-1 text-[0.95rem] font-bold ${dark ? 'text-lime' : 'text-field'}`}>{s.app}</p>
            <p className={`mt-1 text-[clamp(1.05rem,1.5vw,1.3rem)] font-semibold leading-snug ${dark ? 'text-white' : 'text-ink'}`}>{s.text}</p>
          </div>

          <div className="mx-auto mt-5 flex max-w-[260px] gap-1.5 md:mx-0" aria-hidden>
            {station.steps.map((_, k) => (
              <span key={k} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${k <= i ? (dark ? 'bg-lime' : 'bg-field') : dark ? 'bg-white/20' : 'bg-ink/15'}`} />
            ))}
          </div>

          <p className={`mt-5 flex items-center justify-center gap-2 text-[0.8rem] font-semibold md:justify-start ${dark ? 'text-white/65' : 'text-ink-mute'}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <rect x="7" y="3" width="10" height="18" rx="5" />
              <path d="M12 7v3" className="flow-wheel" />
            </svg>
            {last ? `${dark ? 'Swipe' : 'Scroll'} once more to return to the map` : `${dark ? 'Swipe up' : 'Scroll'} for the next step`}
          </p>

          <div className={`mt-5 flex flex-wrap justify-center gap-3 transition-opacity duration-500 md:justify-start ${last ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!last}>
            {onSeason && (
              <button type="button" className={`${dark ? 'btn-lime' : 'btn-primary'} !py-2.5`} tabIndex={last ? 0 : -1} onClick={() => exit(onSeason)}>
                See it in the season
              </button>
            )}
            <Link href={station.explore.href} className={`${dark ? 'btn-on-dark' : 'btn-ghost'} !py-2.5`} tabIndex={last ? 0 : -1}>
              {station.explore.label}
            </Link>
          </div>
          <button type="button" onClick={() => exit()} className={`mt-4 text-sm font-bold underline underline-offset-4 md:hidden ${dark ? 'text-white/75 decoration-white/30' : 'text-ink-soft decoration-ink/20'}`}>
            Back to the map
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
