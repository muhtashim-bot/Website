'use client';

/*
 * Solution pages: a phone with the app, and the steps of the service. As the reader scrolls,
 * each step's text rises into place beside the phone, the phone switches to that step's screen,
 * and short callouts pop out around it. Steps already read stay in the list.
 */
import { useEffect, useRef, useState } from 'react';
import type { Walkthrough as W } from '@/content/offerings';
import { Phone } from './PhoneScreens';

const STEP_VH = 52;

export function Walkthrough({ name, data }: { name: string; data: W }) {
  const ref = useRef<HTMLElement>(null);
  const [k, setK] = useState(0);
  const [mode, setMode] = useState<'scroll' | 'static'>('scroll');
  const n = data.steps.length;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMode('static');
      return;
    }
    const el = ref.current!;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(0.999, Math.max(0, -r.top / total)) : 0;
      setK(Math.min(n - 1, Math.floor(p * n)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [n]);

  const jump = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / n) * total, behavior: 'smooth' });
  };

  if (mode === 'static') {
    return (
      <section aria-labelledby="walk-title" className="bg-[#FFFDF5]">
        <div className="container py-16">
          <p className="text-[0.95rem] font-bold text-field">How it works in {name}</p>
          <h2 id="walk-title" className="mt-1 max-w-2xl text-h2">{data.title}</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {data.steps.map((s) => (
              <li key={s.title} className="flex gap-5">
                <div className="w-[120px] shrink-0">
                  <Phone screen={s.screen} />
                </div>
                <div>
                  <h3 className="text-h3">{s.title}</h3>
                  <p className="mt-2 text-ink-soft">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  const step = data.steps[k];
  return (
    <section ref={ref} aria-labelledby="walk-title" className="relative bg-[#FFFDF5]" style={{ height: `calc(${n * STEP_VH}svh + 45svh)` }}>
      <div className="sticky top-[var(--header-h)] h-[calc(100svh-var(--header-h))] overflow-hidden">
        <div aria-hidden className="furrows pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(60%_70%_at_70%_50%,black,transparent)]" />
        <div className="container relative grid h-full grid-rows-[auto_1fr] gap-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1 lg:items-center lg:gap-12 lg:py-10">
          {/* the steps */}
          <div className="order-2 min-h-0 lg:order-1">
            <p className="hidden text-[0.95rem] font-bold text-field lg:block">How it works in {name}</p>
            <h2 id="walk-title" className="mt-1 hidden max-w-xl text-[clamp(1.8rem,2.8vw,2.6rem)] font-bold leading-[1.08] tracking-tight lg:block">
              {data.title}
            </h2>
            <p className="text-sm font-bold text-ink-mute lg:mt-6" aria-live="polite">
              <span className="lg:hidden">How it works in {name}, step {k + 1} of {n}</span>
              <span className="hidden lg:inline">Step {k + 1} of {n}</span>
            </p>
            <ol className="relative mt-3 lg:mt-4">
              <span aria-hidden className="absolute bottom-3 left-[9px] top-3 hidden w-[3px] overflow-hidden rounded-full bg-ink/10 lg:block">
                <span className="block w-full rounded-full bg-leaf transition-[height] duration-300 ease-out" style={{ height: `${(k / Math.max(1, n - 1)) * 100}%` }} />
              </span>
              {data.steps.map((s, i) => {
                const placed = i <= k;
                const on = i === k;
                return (
                  <li
                    key={s.title}
                    className={`wt-step relative pl-0 lg:pl-10 ${placed ? 'is-placed' : ''} ${on ? 'is-active' : 'hidden lg:block'}`}
                    aria-current={on ? 'step' : undefined}
                  >
                    <span
                      aria-hidden
                      className={`absolute left-0 top-[6px] hidden h-[21px] w-[21px] rounded-full border-[3px] transition-colors duration-300 lg:block ${
                        on ? 'border-field bg-lime shadow-[0_0_0_6px_rgba(136,187,65,0.22)]' : placed ? 'border-leaf bg-leaf' : 'border-ink/15 bg-[#FFFDF5]'
                      }`}
                    />
                    <button type="button" onClick={() => jump(i)} className="text-left">
                      <h3 className={`font-bold leading-snug tracking-tight transition-colors ${on ? 'text-[1.35rem] text-ink lg:text-[1.55rem]' : 'text-[1.05rem] text-ink-soft hover:text-field'}`}>{s.title}</h3>
                    </button>
                    <div className={`wt-body grid transition-[grid-template-rows] duration-300 ease-out ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <p className="overflow-hidden pb-1 text-[1.02rem] leading-relaxed text-ink-soft lg:max-w-[30rem]">
                        <span className="block pt-2">{s.body}</span>
                      </p>
                    </div>
                    <div className="h-4 lg:h-6" />
                  </li>
                );
              })}
            </ol>
          </div>

          {/* the phone, with callouts */}
          <div className="relative order-1 flex min-h-0 items-center justify-center lg:order-2">
            <div className="relative h-[48svh] lg:h-[min(620px,calc(100svh-var(--header-h)-80px))]">
              <div className="relative mx-auto h-full aspect-[300/632]">
                <Phone screen={step.screen} className="h-full !w-auto" />
                {(step.callouts ?? []).map((c, j) => (
                  <span
                    key={step.screen + c}
                    className={`wt-callout absolute z-10 hidden whitespace-nowrap rounded-full bg-white px-4 py-2 text-[0.92rem] font-bold text-ink shadow-[0_16px_40px_-18px_rgba(2,43,54,0.55)] ring-1 ring-ink/[0.06] sm:flex sm:items-center sm:gap-2 ${
                      j % 2 === 0 ? 'right-[88%] top-[22%]' : 'left-[88%] top-[58%]'
                    }`}
                    style={{ animationDelay: `${0.06 + j * 0.08}s` }}
                  >
                    <span className="h-2 w-2 rounded-full bg-leaf ring-4 ring-leaf/25" aria-hidden />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
