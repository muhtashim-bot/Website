import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Status, Item, Block, FAQ as FAQType, Module } from '@/content/offerings';
import { metrics, METRICS_AS_OF, type MetricId } from '@/content/metrics';

type Tone = 'plain' | 'mint' | 'cream' | 'lime' | 'teal';
const toneClass: Record<Tone, string> = {
  plain: '',
  mint: 'bg-mint',
  cream: 'bg-cream',
  lime: 'bg-lime',
  teal: 'bg-teal text-white',
};

export function Section({
  id,
  tone = 'plain',
  className = '',
  children,
  label,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  return (
    <section id={id} aria-label={label} className={`${toneClass[tone]} ${className}`}>
      <div className="container py-16 md:py-24">{children}</div>
    </section>
  );
}

export function SectionHead({ title, intro, action, dark = false }: { title: string; intro?: string; action?: ReactNode; dark?: boolean }) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <h2 className={`text-h2 ${dark ? 'text-white' : ''}`}>{title}</h2>
        {intro && <p className={`mt-4 text-lead ${dark ? 'text-white/75' : 'text-ink-soft'}`}>{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const statusStyle: Record<Status, string> = {
  LIVE: 'bg-field text-white',
  PILOT: 'bg-lime text-ink',
  'IN DEVELOPMENT': 'bg-ink/10 text-ink-soft',
};
const statusText: Record<Status, string> = { LIVE: 'Live', PILOT: 'Pilot', 'IN DEVELOPMENT': 'In development' };

export function StatusTag({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'LIVE' ? 'bg-lime' : status === 'PILOT' ? 'bg-field' : 'bg-ink/40'}`} aria-hidden />
      {statusText[status]}
    </span>
  );
}

export function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const external = /^(https?:|mailto:|tel:)/.test(href);
  if (external)
    return (
      <a href={href} className={className} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function ItemBody({ item }: { item: Item }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-h3">{item.title}</h3>
        {item.status && <StatusTag status={item.status} />}
      </div>
      <p className="mt-2 text-ink-soft">{item.body}</p>
      {item.href && (
        <SmartLink href={item.href} className="link mt-3 inline-block text-[0.95rem]">
          Learn more<span className="sr-only"> about {item.title}</span>
        </SmartLink>
      )}
    </>
  );
}

export function BlockView({ block, dark = false }: { block: Block; dark?: boolean }) {
  const layout = block.layout ?? 'grid';
  return (
    <div>
      <SectionHead title={block.title} intro={block.intro} dark={dark} />
      {layout === 'steps' ? (
        <ol className={`grid gap-6 sm:grid-cols-2 ${block.items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {block.items.map((it, i) => (
            <li key={it.title} className="relative rounded-[1.75rem] bg-white p-7 ring-1 ring-ink/[0.07]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-lg font-bold text-ink" aria-hidden>
                {i + 1}
              </span>
              <div className="mt-5">
                <ItemBody item={it} />
              </div>
            </li>
          ))}
        </ol>
      ) : layout === 'list' ? (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {block.items.map((it) => (
            <li key={it.title} className="grid gap-2 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-h3">{it.title}</h3>
                {it.status && <StatusTag status={it.status} />}
              </div>
              <p className="text-ink-soft md:text-lg">{it.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-x-10 gap-y-2 md:grid-cols-2">
          {block.items.map((it) => (
            <li key={it.title} className="border-t-2 border-leaf/40 pb-6 pt-5">
              <ItemBody item={it} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const metricCols: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-5',
};

export function MetricRow({ ids, dark = false, note = true }: { ids: MetricId[]; dark?: boolean; note?: boolean }) {
  return (
    <div>
      <dl className={`grid gap-6 ${metricCols[Math.min(ids.length, 5)]}`}>
        {ids.map((id) => (
          <div key={id} className={`border-l-4 pl-5 ${dark ? 'border-lime' : 'border-leaf'}`}>
            <dd className={`whitespace-nowrap text-[2.1rem] font-bold leading-none tracking-tight md:text-[2.5rem] xl:text-[2.8rem] ${dark ? 'text-lime' : 'text-field'}`}>{metrics[id].value}</dd>
            <dt className={`mt-2 ${dark ? 'text-white/80' : 'text-ink-soft'}`}>{metrics[id].label}</dt>
          </div>
        ))}
      </dl>
      {note && <p className={`mt-6 text-sm ${dark ? 'text-white/55' : 'text-ink-mute'}`}>To date, as published in {METRICS_AS_OF}.</p>}
    </div>
  );
}

export function AIModuleCard({ module }: { module: Module }) {
  return (
    <div className="grid gap-8 overflow-hidden rounded-[2.25rem] bg-teal p-8 text-white md:grid-cols-[auto_1fr] md:items-center md:p-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lime/15 ring-1 ring-lime/40" aria-hidden>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="6" fill="#DDFF80" />
          <circle cx="20" cy="20" r="12" stroke="#DDFF80" strokeOpacity="0.5" fill="none" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="18" stroke="#DDFF80" strokeOpacity="0.25" fill="none" strokeWidth="1.5" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-lime">From our AI & Data work</p>
        <h2 className="mt-2 text-h2 text-white">{module.title}</h2>
        <p className="mt-3 max-w-prose text-lg text-white/80">{module.body}</p>
        <Link href={module.href} className="btn-lime mt-6">
          {module.linkLabel}
        </Link>
      </div>
    </div>
  );
}

export function FAQList({ faqs }: { faqs: FAQType[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <div>
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {faqs.map((f) => (
          <li key={f.q}>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-field transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-ink-soft">{f.a}</p>
            </details>
          </li>
        ))}
      </ul>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}

export function CTABand({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="furrows bg-lime">
      <div className="container flex flex-col gap-8 py-16 md:flex-row md:items-center md:justify-between md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-h2">{title}</h2>
          {body && <p className="mt-3 text-lead text-ink-soft">{body}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <SmartLink href={primary.href} className="btn-primary">
            {primary.label}
          </SmartLink>
          {secondary && (
            <SmartLink href={secondary.href} className="btn-ghost bg-white/60">
              {secondary.label}
            </SmartLink>
          )}
        </div>
      </div>
    </section>
  );
}

export function Initials({ name, className = '' }: { name: string; className?: string }) {
  const parts = name.replace(/^(Md\.|Mohammad|Hafez|Mawlana|Mufti)\s+/g, '').split(/\s+/);
  const ini = (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '');
  return (
    <span aria-hidden className={`inline-flex items-center justify-center rounded-full bg-leaf-100 font-bold text-field ${className}`}>
      {ini.toUpperCase()}
    </span>
  );
}

export function PageIntro({ kicker, title, intro, children }: { kicker?: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-mint">
      <div aria-hidden className="furrows absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container relative py-16 md:py-24">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className="mt-2 max-w-4xl text-h1">{title}</h1>
        {intro && <p className="mt-5 max-w-3xl text-lead text-ink-soft md:text-[1.3rem]">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function GooglePlay({ href, dark = false }: { href: string; dark?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener" className={`inline-flex items-center gap-3 rounded-2xl px-5 py-2.5 ${dark ? 'bg-white text-ink' : 'bg-ink text-white'}`}>
      <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden>
        <path d="M1 1.5 12.5 12 1 22.5z" fill="#34A853" />
        <path d="M1 1.5 16 10 12.5 12z" fill="#FBBC04" />
        <path d="M1 22.5 16 14 12.5 12z" fill="#EA4335" />
        <path d="M16 10 21 12.8 16 14 12.5 12z" fill="#4285F4" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[0.7rem] opacity-75">Get it on</span>
        <span className="block font-bold">Google Play</span>
      </span>
    </a>
  );
}
