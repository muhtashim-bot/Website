import type { Metadata } from 'next';
import Link from 'next/link';
import { allPages, HOTLINE } from '@/content/offerings';
import { FAQList, PageIntro, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | iFarmer',
  description: 'Answers about iFarmer finance, inputs, advisory, insurance, iFarmer Centers and how to get started.',
};

const general = [
  { q: 'What is iFarmer?', a: 'iFarmer is a Bangladeshi agritech company. We help small-scale farmers and agri-businesses earn more by bringing finance, quality inputs, advice, insurance and buyers together in one place.' },
  { q: 'How do I reach iFarmer?', a: `Call our free hotline ${HOTLINE}, Saturday to Thursday, 10 AM to 6 PM, email hello@ifarmer.asia, or visit an iFarmer Center.` },
  { q: 'Where does iFarmer work?', a: 'Across 42 districts of Bangladesh, through 1,200+ iFarmer Centers, our field team and partner retailers.' },
];

export default function FAQ() {
  const groups = allPages.filter((p) => p.faqs && p.faqs.length);
  return (
    <>
      <PageIntro kicker="FAQ" title="Questions and answers" intro={`Can’t find what you need? Call ${HOTLINE} free, or send us a message.`} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_2.4fr]">
          <nav aria-label="FAQ topics" className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
            <ul className="space-y-1">
              <li><a href="#general" className="block rounded-xl px-3 py-2 font-semibold hover:bg-leaf-50 hover:text-field">General</a></li>
              {groups.map((g) => (
                <li key={g.slug}><a href={`#${g.slug}`} className="block rounded-xl px-3 py-2 font-semibold hover:bg-leaf-50 hover:text-field">{g.name}</a></li>
              ))}
            </ul>
          </nav>
          <div className="space-y-14">
            <div id="general">
              <h2 className="mb-4 text-h3">General</h2>
              <FAQList faqs={general} />
            </div>
            {groups.map((g) => (
              <div key={g.slug} id={g.slug}>
                <h2 className="mb-4 text-h3">
                  <Link href={`/${g.slug}/`} className="hover:text-field">{g.name}</Link>
                </h2>
                <FAQList faqs={g.faqs!} />
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
