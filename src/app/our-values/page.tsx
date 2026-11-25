import type { Metadata } from 'next';
import { values } from '@/content/company';
import { CTABand, PageIntro, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Our Values | iFarmer',
  description: 'The six values that guide how iFarmer works with farmers, partners and each other.',
};

export default function Values() {
  return (
    <>
      <PageIntro kicker="Our values" title="Six values that guide how we work" intro="They shape how we treat farmers, partners and each other, and how we make decisions when it is hard." />
      <Section>
        <ol className="grid gap-x-12 md:grid-cols-2">
          {values.map((v, i) => (
            <li key={v.title} className="flex gap-6 border-t-2 border-leaf/40 py-8">
              <span className="text-[2.6rem] font-bold leading-none text-leaf" aria-hidden>{i + 1}</span>
              <div>
                <h2 className="text-h3">{v.title}</h2>
                <p className="mt-2 text-lg text-ink-soft">{v.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <CTABand title="Share these values?" primary={{ label: 'See open roles', href: '/careers/' }} />
    </>
  );
}
