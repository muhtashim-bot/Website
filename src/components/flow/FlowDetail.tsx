'use client';

/*
 * What opens when a station on the flow map is clicked: a floating card that zooms out of the
 * station, with the service's phone screens as a carousel beside its steps. Arrows, dots, swipe
 * and the arrow keys move between screens; it also advances on its own until someone takes over.
 * Escape, the close button or a click outside closes it, zooming back into the station.
 */
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone } from '../PhoneScreens';
import type { Station } from './parts';

const ADVANCE_MS = 3800;
const CLOSE_MS = 280;

export function FlowDetail({ station, from, onClose, onSeason }: { station: Station; from: { x: number; y: number }; onClose: () => void; onSeason?: () => void }) {
  const n = station.steps.length;
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [closing, setClosing] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const swipe = useRef<number | null>(null);
  const after = useRef<(() => void) | null>(null);
  const prevOverflow = useRef('');

  const go = useCallback(
    (k: number) => {
      setAuto(false);
      setI(((k % n) + n) % n);
    },
    [n],
  );
  const close = useCallback(
    (then?: () => void) => {
      if (closing) return;
      after.current = then ?? null;
      setClosing(true);
      window.setTimeout(() => {
        document.documentElement.style.overflow = prevOverflow.current; // free the page before any scroll that follows
        onClose();
        const next = after.current;
        if (next) requestAnimationFrame(next);
      }, CLOSE_MS);
    },
    [closing, onClose],
  );

  // hold the page still while the card is open, and start on the close button
  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const root = document.documentElement;
    prevOverflow.current = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prevOverflow.current;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(i + 1);
      else if (e.key === 'ArrowLeft') go(i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, go, close]);

  useEffect(() => {
    if (!auto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % n), ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [auto, n]);

  // the card grows out of the station that was clicked
  const zoomFrom = { ['--zx' as string]: `${Math.round(from.x - window.innerWidth / 2)}px`, ['--zy' as string]: `${Math.round(from.y - window.innerHeight / 2)}px` };
  const step = station.steps[i];

  const arrow = (dir: -1 | 1) => (
    <button
      type="button"
      onClick={() => go(i + dir)}
      aria-label={dir < 0 ? 'Previous screen' : 'Next screen'}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-field shadow-[0_8px_20px_-10px_rgba(2,43,54,0.5)] ring-1 ring-ink/10 transition-colors hover:bg-lime"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="flow-detail-title">
      <div className={`absolute inset-0 bg-[rgba(2,30,36,0.5)] backdrop-blur-[3px] ${closing ? 'flow-fade-out' : 'flow-fade-in'}`} onClick={() => close()} aria-hidden />
      <div
        className={`relative grid max-h-[92svh] w-[min(920px,100%)] items-center gap-6 overflow-y-auto rounded-[28px] bg-[#FFFDF5] p-5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)] sm:p-8 md:grid-cols-[auto_1fr] md:gap-10 ${closing ? 'flow-zoom-out' : 'flow-zoom-in'}`}
        style={zoomFrom}
      >
        <button
          ref={closeBtn}
          type="button"
          onClick={() => close()}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink ring-1 ring-ink/10 transition-colors hover:bg-mint hover:text-field sm:right-4 sm:top-4"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* the phone carousel */}
        <div className="flex flex-col items-center">
          <div
            className="flex items-center gap-3 sm:gap-4"
            onPointerDown={(e) => {
              swipe.current = e.clientX;
            }}
            onPointerUp={(e) => {
              if (swipe.current === null) return;
              const dx = e.clientX - swipe.current;
              swipe.current = null;
              if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
            }}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setAuto(false)}
          >
            {arrow(-1)}
            <Phone screen={step.screen} className="w-[min(170px,42vw)] touch-pan-y select-none sm:w-[min(230px,46vw)]" />
            {arrow(1)}
          </div>
          <div className="mt-4 flex gap-2" role="tablist" aria-label="Screens">
            {station.steps.map((s, k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={k === i}
                aria-label={`${s.app}: ${s.text}`}
                onClick={() => go(k)}
                className={`h-2.5 rounded-full transition-all duration-300 ${k === i ? 'w-7 bg-field' : 'w-2.5 bg-ink/20 hover:bg-ink/35'}`}
              />
            ))}
          </div>
        </div>

        {/* what it is, and the steps the screens walk through */}
        <div className="min-w-0 md:pr-6">
          <p className="text-sm font-bold text-field">{station.via}</p>
          <h2 id="flow-detail-title" className="mt-1 text-[clamp(1.6rem,2.6vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            {station.label}
          </h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-ink-soft">{station.detail}</p>
          <ol className="mt-5 space-y-1.5">
            {station.steps.map((s, k) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => go(k)}
                  aria-current={k === i ? 'step' : undefined}
                  className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-300 ${k === i ? 'bg-[#F1FBD9] ring-1 ring-leaf/50' : 'hover:bg-ink/[0.03]'}`}
                >
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${k === i ? 'bg-field text-white' : 'bg-mint text-field ring-1 ring-leaf/30'}`}>{k + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-[0.78rem] font-bold text-field">{s.app}</span>
                    <span className="block text-[0.92rem] leading-snug text-ink">{s.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            {onSeason && (
              <button type="button" className="btn-primary" onClick={() => close(onSeason)}>
                See it in the season
              </button>
            )}
            <Link href={station.explore.href} className="btn-ghost">
              {station.explore.label}
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
