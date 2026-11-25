'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { nav } from '@/content/nav';
import { HOTLINE, HOTLINE_TEL } from '@/content/offerings';
import { Logo } from './Logo';

export function Header() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  // On the homepage the header floats over the story as plain text, on the light at the top of the page.
  const floating = usePathname() === '/';
  const linkHover = 'text-ink hover:text-field';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(null);
        setMobile(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? 'hidden' : '';
  }, [mobile]);

  return (
    <header
      ref={ref}
      className={floating ? 'fixed inset-x-0 top-0 z-50' : 'sticky top-0 z-50 bg-[#FFFDF5]'}
    >
      <div className="container relative z-10 flex h-[var(--header-h)] items-center gap-6">
        <Link
          href="/"
          className="shrink-0"
          aria-label="iFarmer home"
        >
          <Logo className="h-9 w-auto" />
        </Link>

        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((g) =>
              g.href ? (
                <li key={g.label}>
                  <Link href={g.href} className={`block rounded-full px-3.5 py-2 text-[0.97rem] font-semibold ${linkHover}`}>
                    {g.label}
                  </Link>
                </li>
              ) : (
                <li key={g.label} className="relative" onMouseEnter={() => setOpen(g.label)} onMouseLeave={() => setOpen(null)}>
                  <button
                    type="button"
                    aria-expanded={open === g.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(open === g.label ? null : g.label);
                    }}
                    className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.97rem] font-semibold ${
                      open === g.label ? 'text-field' : linkHover
                    }`}
                  >
                    {g.label}
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`transition-transform ${open === g.label ? 'rotate-180' : ''}`}>
                      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    </svg>
                  </button>
                  {open === g.label && (
                    <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3">
                      <ul className="w-[340px] rounded-3xl bg-white p-2.5 shadow-[0_24px_60px_-20px_rgba(2,43,54,0.28)] ring-1 ring-ink/[0.06]">
                        {g.links!.map((l) => (
                          <li key={l.href}>
                            <Link href={l.href} onClick={() => setOpen(null)} className="block rounded-2xl px-4 py-3 hover:bg-leaf-50">
                              <span className="block font-bold text-ink">{l.label}</span>
                              {l.note && <span className="mt-0.5 block text-sm text-ink-mute">{l.note}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:ml-2 lg:flex">
          <a
            href={HOTLINE_TEL}
            className="hidden text-sm font-semibold text-ink-soft hover:text-field xl:inline"
            title="Free hotline, Saturday to Thursday, 10 AM to 6 PM"
          >
            {HOTLINE}
          </a>
          <Link href="/contact/" className="btn-primary !px-5 !py-2.5 !shadow-none">
            Contact us
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-ink lg:hidden"
          aria-label={mobile ? 'Close menu' : 'Open menu'}
          aria-expanded={mobile}
          onClick={() => setMobile(!mobile)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
            {mobile ? (
              <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {mobile && (
        <div className={`fixed inset-x-0 bottom-0 overflow-y-auto bg-[#FFFDF5] lg:hidden ${floating ? 'top-0 pt-[var(--header-h)]' : 'top-[var(--header-h)]'}`}>
          <nav aria-label="Mobile" className="container py-6">
            <ul className="divide-y divide-ink/10">
              {nav.map((g) => (
                <li key={g.label} className="py-1">
                  {g.href ? (
                    <Link href={g.href} onClick={() => setMobile(false)} className="block py-3 text-xl font-bold">
                      {g.label}
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-expanded={mobileGroup === g.label}
                        onClick={() => setMobileGroup(mobileGroup === g.label ? null : g.label)}
                        className="flex w-full items-center justify-between py-3 text-xl font-bold"
                      >
                        {g.label}
                        <span aria-hidden className="text-field">{mobileGroup === g.label ? '–' : '+'}</span>
                      </button>
                      {mobileGroup === g.label && (
                        <ul className="pb-3">
                          {g.links!.map((l) => (
                            <li key={l.href}>
                              <Link href={l.href} onClick={() => setMobile(false)} className="block py-2 pl-3 text-lg text-ink-soft">
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/contact/" onClick={() => setMobile(false)} className="btn-primary">
                Contact us
              </Link>
              <a href={HOTLINE_TEL} className="btn-ghost">
                Call {HOTLINE} (free)
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
