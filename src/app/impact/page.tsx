import type { Metadata } from 'next';
import Link from 'next/link';
import { reports, stories } from '@/content/company';
import { CTABand, Initials, MetricRow, PageIntro, Section, SectionHead } from '@/components/ui';
import { services } from '@/content/offerings';

export const metadata: Metadata = {
  title: 'Our Impact | iFarmer',
  description: 'How iFarmer is helping smallholder farmers in Bangladesh win: finance, market access, women farmers and climate-smart farming.',
};

const sdgs = [
  { n: 1, title: 'No poverty', body: 'Higher, steadier farm incomes.' },
  { n: 2, title: 'Zero hunger', body: 'More productive, resilient smallholder farms.' },
  { n: 5, title: 'Gender equality', body: 'Women farmers reached; Orange Seal certified.' },
  { n: 8, title: 'Decent work and economic growth', body: 'Rural retailers, traders and center operators grow their businesses.' },
  { n: 13, title: 'Climate action', body: 'AWD, solar irrigation, vermicompost and IPM programs.' },
];

export default function Impact() {
  const climate = services.find((s) => s.slug === 'climate-smart-solution')!.blocks[0].items;
  return (
    <>
      <PageIntro
        kicker="Our impact"
        title="Helping farmers win"
        intro="Our impact-first approach aims to serve close to 20 million smallholder farmers across Bangladesh. These are the results so far."
      />
      <Section>
        <MetricRow ids={['impactFinanced', 'impactSold', 'impactWomen', 'impactRetailers']} />
      </Section>

      <Section tone="cream">
        <SectionHead title="Where our work meets the Sustainable Development Goals" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {sdgs.map((s) => (
            <li key={s.n} className="rounded-[1.5rem] bg-white p-6 ring-1 ring-ink/[0.07]">
              <p className="text-sm font-semibold text-field">SDG {s.n}</p>
              <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHead title="Climate-smart results" action={<Link href="/climate-smart-solution/" className="btn-ghost">Climate programs</Link>} />
        <ul className="grid gap-x-10 md:grid-cols-2">
          {climate.map((c) => (
            <li key={c.title} className="border-t-2 border-leaf/40 pb-6 pt-5">
              <h3 className="text-h3">{c.title}</h3>
              <p className="mt-2 text-ink-soft">{c.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="mint">
        <SectionHead title="Stories from the field" />
        <ul className="grid gap-5 md:grid-cols-2">
          {stories.map((s) => (
            <li key={s.name} className="flex gap-5 rounded-[1.75rem] bg-white p-7 ring-1 ring-ink/[0.07]">
              <Initials name={s.name} className="h-14 w-14 shrink-0 text-lg" />
              <div>
                <p className="text-lg">{s.story}</p>
                <p className="mt-3 font-bold">{s.name}</p>
                <p className="text-sm text-ink-mute">{s.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHead
          title="Impact reports"
          intro="We work with development organisations to reach remote farmers, build their capacity and resilience, and promote sustainable farming, and we report on the results every year."
          action={<Link href="/reports/" className="btn-ghost">All reports</Link>}
        />
        <ul className="grid gap-4 md:grid-cols-3">
          {reports.slice(0, 3).map((r) => (
            <li key={r.href}>
              <a href={r.href} target="_blank" rel="noopener" className="group block rounded-[1.5rem] bg-cream p-6 hover:ring-2 hover:ring-field">
                <p className="text-sm font-semibold text-field">{r.kind}{r.year && `, ${r.year}`}</p>
                <p className="mt-1 text-h3 group-hover:text-field">{r.title}</p>
                <p className="mt-4 text-sm font-bold">Download PDF</p>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <CTABand title="Partner with us on impact" primary={{ label: 'Start a partnership', href: '/for-partners/' }} secondary={{ label: 'Read the reports', href: '/reports/' }} />
    </>
  );
}
