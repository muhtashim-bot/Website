import type { Metadata } from 'next';
import { shariahBoard, shariahMandate } from '@/content/company';
import { CTABand, Initials, PageIntro, Section, SectionHead } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Shariah Board | iFarmer',
  description: 'iFarmer’s Shariah Board oversees Shariah-compliant funding products for retail funders.',
};

export default function Shariah() {
  return (
    <>
      <PageIntro
        kicker="Shariah Board"
        title="Independent Shariah governance for our funding products"
        intro="Our Shariah Board makes sure that how we raise, deploy and return funds follows Islamic finance principles, so funders can take part with confidence."
      />
      <Section>
        <SectionHead title="The board’s mandate" />
        <ul className="grid gap-x-10 md:grid-cols-2">
          {shariahMandate.map((m) => (
            <li key={m.title} className="border-t-2 border-leaf/40 pb-6 pt-5">
              <h3 className="text-h3">{m.title}</h3>
              <p className="mt-2 text-ink-soft">{m.body}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section tone="cream">
        <SectionHead title="Board members" />
        <ul className="grid gap-5 lg:grid-cols-2">
          {shariahBoard.map((m) => (
            <li key={m.name} className="flex gap-5 rounded-[1.75rem] bg-white p-7 ring-1 ring-ink/[0.07]">
              <Initials name={m.name} className="h-16 w-16 shrink-0 text-xl" />
              <div>
                <h3 className="text-h3">{m.name}</h3>
                <p className="mt-2 text-ink-soft">{m.bio}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <CTABand title="Fund farms through iHarvst" primary={{ label: 'Explore iHarvst', href: '/product-iharvst/' }} secondary={{ label: 'For funders', href: '/for-funders/' }} />
    </>
  );
}
