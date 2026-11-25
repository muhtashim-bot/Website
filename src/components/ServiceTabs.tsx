'use client';

import Link from 'next/link';
import { useState } from 'react';
import { services, products } from '@/content/offerings';

const tabs = [
  ...services.map((s) => ({ slug: s.slug, name: s.name, title: s.title, intro: s.intro, points: s.blocks[0].items.slice(0, 3).map((i) => i.title), photo: s.photo })),
  (() => {
    const c = products.find((p) => p.slug === 'ifarmer-center')!;
    return { slug: c.slug, name: c.name, title: c.title, intro: c.intro, points: c.blocks[0].items.slice(0, 4).map((i) => i.title), photo: c.photo };
  })(),
];

export function ServiceTabs() {
  const [i, setI] = useState(0);
  const t = tabs[i];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)]">
      <div role="tablist" aria-label="iFarmer services" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {tabs.map((tab, k) => (
          <button
            key={tab.slug}
            role="tab"
            id={`tab-${tab.slug}`}
            aria-selected={k === i}
            aria-controls="service-panel"
            onClick={() => setI(k)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') setI((i + 1) % tabs.length);
              if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') setI((i - 1 + tabs.length) % tabs.length);
            }}
            tabIndex={k === i ? 0 : -1}
            className={`shrink-0 rounded-2xl px-5 py-4 text-left text-[1.05rem] font-bold transition-colors lg:w-full ${k === i ? 'bg-field text-white' : 'bg-white text-ink ring-1 ring-ink/[0.07] hover:ring-field'}`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <div id="service-panel" role="tabpanel" aria-labelledby={`tab-${t.slug}`} className="grid overflow-hidden rounded-[2.25rem] bg-white ring-1 ring-ink/[0.07] md:grid-cols-[1.1fr_1fr]">
        <div className="p-8 md:p-10">
          <h3 className="text-h2">{t.title}</h3>
          <p className="mt-4 text-ink-soft">{t.intro}</p>
          <ul className="mt-6 space-y-2.5">
            {t.points.map((p) => (
              <li key={p} className="flex items-start gap-3 font-semibold">
                <svg width="20" height="20" viewBox="0 0 20 20" className="mt-0.5 shrink-0" aria-hidden>
                  <circle cx="10" cy="10" r="10" fill="#DDFF80" />
                  <path d="m6 10.2 2.6 2.6L14 7.4" stroke="#038F2F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
          <Link href={`/${t.slug}/`} className="btn-primary mt-8">
            Explore {t.name}
          </Link>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/photos/${t.photo}-1080.jpg`} alt="" className="h-full min-h-[260px] w-full object-cover" loading="lazy" />
      </div>
    </div>
  );
}
