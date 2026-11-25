import type { Metadata } from 'next';
import Link from 'next/link';
import { CTABand, MetricRow, PageIntro, Section, SectionHead } from '@/components/ui';

export const metadata: Metadata = {
  title: 'About iFarmer | Agritech for Bangladeshi Farmers',
  description: 'Founded in 2018, iFarmer connects farmers, agri-retailers and buyers through finance, technology and data.',
};

const pillars = [
  { title: 'Finance & credit', body: 'Digital finance for farmers, retailers and agri-businesses, with partner banks, NBFIs and retail funders.', href: '/access-to-finance/' },
  { title: 'Input marketplace', body: 'Seeds, fertilizer, feed and machinery through KriShop, iFarmer Centers and Experience Centers.', href: '/agri-input/' },
  { title: 'Market access', body: 'Connections to institutional and export buyers through our output supply chain.', href: '/forward-market-linkage/' },
  { title: 'Data & insights', body: 'AI-powered farmer profiling, credit scoring and supply-chain analytics.', href: '/ai-data-intelligence/' },
];

// Milestones taken from published press coverage (see /news).
const timeline = [
  { when: '2018', what: 'iFarmer founded on the belief that farmers deserve better access to capital, inputs, information and markets.' },
  { when: 'Jun 2020', what: 'Starts supplying farm produce to the market, at around 50 tonnes a month.' },
  { when: 'May 2022', what: 'Raises US$2.1 million.' },
  { when: '2022', what: 'Named ICT Startup of the Year at The Daily Star ICT Awards.' },
  { when: 'Aug 2024', what: 'Listed in Forbes Asia 100 to Watch.' },
  { when: 'Sep 2024', what: 'Investment from UK-based Razor Capital.' },
  { when: 'Apr 2025', what: 'Pioneer Facility makes its first Bangladesh investment in iFarmer.' },
  { when: 'May 2025', what: 'Launches the Farmer Card in Bogura.' },
  { when: 'Jul 2025', what: 'Partners with VisionSpring to bring eyecare to farmers.' },
  { when: 'Apr 2026', what: 'Distributes AWD pipes to 1,000 farmers.' },
  { when: 'Jun 2026', what: 'Wins the OPEC Fund Annual Award for Development (US$250,000).' },
];

export default function About() {
  return (
    <>
      <PageIntro
        kicker="About us"
        title="We are cultivating the future of agriculture through trust and technology"
        intro="iFarmer connects farmers, agri-retailers and institutional buyers through finance, technology and data. Our vision: agriculture that is more inclusive, transparent and rewarding for everyone, from farmers to financiers and global buyers."
      />

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="prose-ifarmer">
            <h2 className="mb-5 text-h2">Our approach</h2>
            <p>We combine digital agriculture, embedded finance and market linkage. Farmers get financing, seeds and inputs, agronomic advice and a buyer for their harvest in one ecosystem.</p>
            <p>Banks and investors get a verified borrower pipeline with performance data and risk insights. Our technology tracks every transaction from financing to harvest, and the data makes each season better than the last.</p>
            <p>We have recently entered export markets and introduced private-label brands.</p>
          </div>
          <figure className="overflow-hidden rounded-[2.25rem] bg-teal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/farmer-meeting-1080.jpg" alt="Farmers gather in an open field for a meeting with iFarmer field staff" className="aspect-[4/3] w-full object-cover" loading="lazy" />
          </figure>
        </div>
      </Section>

      <Section tone="cream">
        <SectionHead title="What we do" />
        <ul className="grid gap-x-10 md:grid-cols-2">
          {pillars.map((p) => (
            <li key={p.title} className="border-t-2 border-leaf/40 pb-8 pt-5">
              <h3 className="text-h3">{p.title}</h3>
              <p className="mt-2 text-ink-soft">{p.body}</p>
              <Link href={p.href} className="link mt-3 inline-block text-[0.95rem]">Learn more<span className="sr-only"> about {p.title}</span></Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHead title="Our reach" />
        <MetricRow ids={['registeredFarmers', 'districts', 'centers', 'registeredRetailers']} />
      </Section>

      <Section tone="mint">
        <SectionHead title="Milestones" intro="From a side project in 2018 to a full-stack platform for smallholder farmers." />
        <ol className="relative border-l-2 border-leaf/50 pl-8">
          {timeline.map((t) => (
            <li key={t.when + t.what} className="relative pb-8 last:pb-0">
              <span className="absolute -left-[41px] top-1.5 h-4 w-4 rounded-full border-4 border-mint bg-field" aria-hidden />
              <p className="font-bold text-field">{t.when}</p>
              <p className="mt-1 max-w-2xl text-lg">{t.what}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHead title="The impact we work for" />
        <ul className="grid gap-4 md:grid-cols-2">
          {[
            'Better income and financial inclusion for smallholder farmers.',
            'Stronger trust between financial institutions, suppliers and producers.',
            'Fewer inefficiencies and information gaps in the agri supply chain.',
            'Sustainable, climate-resilient farming.',
          ].map((t) => (
            <li key={t} className="rounded-[1.5rem] bg-cream p-6 text-lg font-semibold">{t}</li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/our-values/" className="btn-ghost">Our values</Link>
          <Link href="/leadership/" className="btn-ghost">Leadership</Link>
          <Link href="/shariah-board/" className="btn-ghost">Shariah Board</Link>
          <Link href="/impact/" className="btn-ghost">Our impact</Link>
        </div>
      </Section>

      <CTABand title="Join a team built for impact" primary={{ label: 'See open roles', href: '/careers/' }} secondary={{ label: 'Contact us', href: '/contact/' }} />
    </>
  );
}
