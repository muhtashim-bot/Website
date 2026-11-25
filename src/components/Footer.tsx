import Link from 'next/link';
import { nav } from '@/content/nav';
import { offices, socials, memberships } from '@/content/company';
import { EMAIL, HOTLINE, HOTLINE_TEL } from '@/content/offerings';
import { Logo } from './Logo';

export function Footer() {
  const groups = nav.filter((g) => g.links);
  return (
    <footer className="relative overflow-hidden bg-teal text-white">
      <div className="container grid gap-12 pb-10 pt-16 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <Logo tone="white" className="h-10 w-auto" />
          <p className="mt-5 max-w-sm text-white/75">
            iFarmer is a technology company that helps small-scale farmers and agri-businesses earn more, with finance, inputs, advice and markets in one place.
          </p>
          <dl className="mt-8 space-y-4 text-[0.97rem]">
            <div>
              <dt className="text-white/60">Free hotline</dt>
              <dd>
                <a href={HOTLINE_TEL} className="text-xl font-bold text-lime hover:underline">
                  {HOTLINE}
                </a>
                <span className="block text-sm text-white/60">Saturday to Thursday, 10 AM to 6 PM</span>
              </dd>
            </div>
            <div>
              <dt className="text-white/60">Email</dt>
              <dd>
                <a href={`mailto:${EMAIL}`} className="font-semibold hover:text-lime">
                  {EMAIL}
                </a>
              </dd>
            </div>
          </dl>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="iFarmer on social media">
            {socials.map((s) => (
              <li key={s.name}>
                <a href={s.href} className="inline-block rounded-full border border-white/20 px-3.5 py-1.5 text-sm font-semibold hover:border-lime hover:text-lime" rel="noopener" target="_blank">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {groups.map((g) => (
            <div key={g.label}>
              <h2 className="text-sm font-semibold text-white/60">{g.label}</h2>
              <ul className="mt-3 space-y-2">
                {g.links!.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="font-medium text-white/90 hover:text-lime">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="text-sm font-semibold text-white/60">More</h2>
            <ul className="mt-3 space-y-2">
              <li><Link href="/ai-data-intelligence/" className="font-medium text-white/90 hover:text-lime">AI & Data Intelligence</Link></li>
              <li><Link href="/apps/" className="font-medium text-white/90 hover:text-lime">Get the apps</Link></li>
              <li><Link href="/faq/" className="font-medium text-white/90 hover:text-lime">FAQ</Link></li>
              <li><Link href="/contact/" className="font-medium text-white/90 hover:text-lime">Contact</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container grid gap-8 border-t border-white/10 py-10 md:grid-cols-3">
        {offices.map((o) => (
          <address key={o.city} className="not-italic">
            <p className="font-bold">{o.city}</p>
            {o.lines.map((l) => (
              <p key={l} className="text-white/70">{l}</p>
            ))}
            {o.note && <p className="mt-1 text-sm text-white/50">{o.note}</p>}
          </address>
        ))}
        <div>
          <p className="font-bold">Member of</p>
          <p className="text-white/70">{memberships.join(' and ')}</p>
        </div>
      </div>

      <div className="container flex flex-col gap-3 border-t border-white/10 py-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} iFarmer. All rights reserved.</p>
        <p className="flex gap-5">
          <a href="https://www.ifarmer.asia/privacy" className="hover:text-lime">Privacy</a>
          <a href="https://www.ifarmer.asia/terms" className="hover:text-lime">Terms</a>
        </p>
      </div>
      <div aria-hidden className="pointer-events-none select-none px-4 text-center text-[22vw] font-bold leading-[0.8] tracking-tighter text-white/[0.04]">
        ifarmer
      </div>
    </footer>
  );
}
