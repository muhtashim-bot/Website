import Link from 'next/link';
import type { Page } from '@/content/offerings';
import { pageBySlug } from '@/content/offerings';
import { ch } from '@/content/journey';
import { Channels } from './Journey';
import { Walkthrough } from './Walkthrough';
import { AIModuleCard, BlockView, CTABand, FAQList, GooglePlay, MetricRow, Section, SectionHead, SmartLink } from './ui';

const kindLabel: Record<Page['kind'], string> = { service: 'Service', product: 'Solution', audience: 'For you' };

const extraRelated: Record<string, { label: string; href: string }> = {
  'shariah-board': { label: 'Shariah Board', href: '/shariah-board/' },
  impact: { label: 'Our impact', href: '/impact/' },
};

export function OfferingPage({ page }: { page: Page }) {
  const channels = page.channels.map((k) => ch[k]);
  const related = (page.related ?? [])
    .map((slug) => {
      const p = pageBySlug(slug);
      return p ? { label: p.name, href: `/${p.slug}/`, note: p.title } : extraRelated[slug] ? { ...extraRelated[slug], note: '' } : null;
    })
    .filter(Boolean) as { label: string; href: string; note: string }[];

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-mint">
        <div aria-hidden className="furrows absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="container relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-field ring-1 ring-leaf/30">
              {kindLabel[page.kind]}: {page.name}
              {page.eyebrow && <span className="font-semibold text-ink-mute">{page.eyebrow}</span>}
            </p>
            <h1 className="mt-5 text-h1">{page.title}</h1>
            <p className="mt-5 max-w-xl text-lead text-ink-soft">{page.intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {page.stores?.android ? (
                <GooglePlay href={page.stores.android} />
              ) : (
                <SmartLink href={page.cta.href} className="btn-primary">
                  {page.cta.label}
                </SmartLink>
              )}
              {page.secondary && (
                <SmartLink href={page.secondary.href} className="btn-ghost bg-white/70">
                  {page.secondary.label}
                </SmartLink>
              )}
            </div>
          </div>

          <figure className="relative">
            <div className="overflow-hidden rounded-[2.5rem] bg-teal ring-1 ring-ink/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/photos/${page.photo}-1920.jpg`}
                srcSet={`/photos/${page.photo}-1080.jpg 1080w, /photos/${page.photo}-1920.jpg 1920w`}
                sizes="(min-width: 1024px) 48vw, 100vw"
                alt=""
                className="kenburns aspect-[4/3] w-full object-cover"
                width={1200}
                height={900}
              />
            </div>
            <figcaption className="absolute -bottom-8 left-4 right-4 rounded-[1.75rem] bg-white/95 p-4 pr-5 shadow-[0_24px_60px_-28px_rgba(2,43,54,0.5)] ring-1 ring-ink/[0.06] backdrop-blur md:-left-8 md:right-auto md:max-w-[26rem]">
              <span className="block text-sm font-bold text-ink">Delivered through</span>
              <Channels items={channels} compact />
            </figcaption>
          </figure>
        </div>
      </section>

      {page.metrics && page.metrics.length > 0 && (
        <section className="border-b border-ink/[0.06]">
          <div className="container py-12">
            <MetricRow ids={page.metrics} />
          </div>
        </section>
      )}

      {page.walkthrough && <Walkthrough name={page.name} data={page.walkthrough} />}

      {page.blocks.map((b, i) => (
        <Section key={b.title} tone={i % 2 === 1 ? 'cream' : 'plain'}>
          <BlockView block={b} />
        </Section>
      ))}

      {page.module && (
        <section>
          <div className="container py-8 md:py-12">
            <AIModuleCard module={page.module} />
          </div>
        </section>
      )}

      {page.faqs && page.faqs.length > 0 && (
        <Section>
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-h2">Questions people ask</h2>
              <p className="mt-3 text-ink-soft">
                More answers in our <Link href="/faq/" className="link">FAQ</Link>, or call the free hotline.
              </p>
            </div>
            <FAQList faqs={page.faqs} />
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section tone="mint">
          <SectionHead title="Works together with" />
          <ul className="grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="group block h-full rounded-[1.75rem] bg-white p-6 ring-1 ring-ink/[0.07] transition-colors hover:ring-field">
                  <span className="text-h3 group-hover:text-field">{r.label}</span>
                  {r.note && <span className="mt-1 block text-ink-mute">{r.note}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <CTABand
        title={page.kind === 'audience' ? 'Ready when you are' : `Talk to us about ${page.name}`}
        body="Call our free hotline 08008500800, Saturday to Thursday, 10 AM to 6 PM, or send us a message."
        primary={page.cta}
        secondary={{ label: 'Contact us', href: '/contact/' }}
      />
    </>
  );
}
