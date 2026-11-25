import type { Metadata } from 'next';
import Link from 'next/link';
import { backers, news, reports } from '@/content/company';
import { CTABand, MetricRow, PageIntro, Section, SectionHead } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Investors | iFarmer',
  description: 'Who backs iFarmer, how the business works, and where to find our reports.',
};

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const milestones = news.filter((n) => /invest|raises|award|Forbes/i.test(n.title));

export default function Investors() {
  return (
    <>
      <PageIntro
        kicker="Investors"
        title="A full-stack platform for Bangladesh’s smallholder farmers"
        intro="Finance, inputs, advice and market access in one loop, built on a growing base of farmer and transaction data."
      />
      <Section>
        <MetricRow ids={['registeredFarmers', 'financeFacilitated', 'registeredRetailers', 'produceSold']} />
      </Section>
      <Section tone="cream">
        <SectionHead title="Backed by" intro="Investors named in public coverage of iFarmer." />
        <ul className="grid gap-4 md:grid-cols-3">
          {backers.map((b) => (
            <li key={b.name} className="rounded-[1.75rem] bg-white p-7 ring-1 ring-ink/[0.07]">
              <p className="text-h3">{b.name}</p>
              <p className="mt-1 text-ink-mute">{b.note}</p>
              {b.href && <a href={b.href} target="_blank" rel="noopener" className="link mt-4 inline-block text-sm">Read the coverage</a>}
            </li>
          ))}
        </ul>
      </Section>
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHead title="Milestones" />
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {milestones.map((m) => (
                <li key={m.href} className="flex gap-6 py-4">
                  <time dateTime={m.date} className="w-20 shrink-0 font-semibold text-field">{fmt(m.date)}</time>
                  <a href={m.href} target="_blank" rel="noopener" className="font-semibold hover:text-field">{m.title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHead title="Reports" />
            <ul className="space-y-3">
              {reports.slice(0, 4).map((r) => (
                <li key={r.href}>
                  <a href={r.href} target="_blank" rel="noopener" className="flex justify-between gap-4 rounded-2xl bg-mint p-5 font-semibold hover:ring-2 hover:ring-field">
                    {r.title}
                    <span className="text-field">PDF</span>
                  </a>
                </li>
              ))}
            </ul>
            <Link href="/reports/" className="link mt-5 inline-block">All reports</Link>
          </div>
        </div>
      </Section>
      <CTABand title="Investor enquiries" body="Write to us and our leadership team will respond." primary={{ label: 'Email hello@ifarmer.asia', href: 'mailto:hello@ifarmer.asia?subject=Investor%20enquiry' }} secondary={{ label: 'Leadership', href: '/leadership/' }} />
    </>
  );
}
