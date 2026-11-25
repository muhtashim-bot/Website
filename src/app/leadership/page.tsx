import type { Metadata } from 'next';
import { leadership } from '@/content/company';
import { CTABand, Initials, PageIntro, Section, SectionHead } from '@/components/ui';

export const metadata: Metadata = {
  title: 'iFarmer Leadership Team',
  description: 'The founders, advisors and leaders building iFarmer.',
};

function Person({ name, title, big = false }: { name: string; title: string; big?: boolean }) {
  return (
    <li className={`flex items-center gap-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-ink/[0.07] ${big ? 'md:p-7' : ''}`}>
      <Initials name={name} className={big ? 'h-20 w-20 text-2xl' : 'h-14 w-14 text-lg'} />
      <div>
        <p className={`font-bold ${big ? 'text-h3' : 'text-lg'}`}>{name}</p>
        <p className="text-ink-mute">{title}</p>
      </div>
    </li>
  );
}

export default function Leadership() {
  return (
    <>
      <PageIntro kicker="Leadership" title="The people building iFarmer" intro="A team of founders, operators, technologists and agronomists working for smallholder farmers." />
      <Section>
        <SectionHead title="Executive body" />
        <ul className="grid gap-4 md:grid-cols-2">
          {leadership.executive.map((p) => <Person key={p.name} {...p} big />)}
        </ul>
        <div className="mt-14">
          <SectionHead title="Advisor" />
          <ul className="grid gap-4 md:grid-cols-3">
            {leadership.advisor.map((p) => <Person key={p.name} {...p} />)}
          </ul>
        </div>
      </Section>
      <Section tone="mint">
        <SectionHead title="Core leadership team" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leadership.core.map((p) => <Person key={p.name} {...p} />)}
        </ul>
      </Section>
      <CTABand title="Join a team built for impact" primary={{ label: 'See open roles', href: '/careers/' }} />
    </>
  );
}
