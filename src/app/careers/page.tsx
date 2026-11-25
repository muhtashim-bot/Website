import type { Metadata } from 'next';
import { jobs, teamStories } from '@/content/company';
import { CTABand, Initials, PageIntro, Section, SectionHead } from '@/components/ui';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers at iFarmer | Jobs in Agritech, Data & Field Operations',
  description: 'Join iFarmer to work on finance, inputs, markets and AI for smallholder farmers in Bangladesh.',
};

const problems = [
  'Bangla speech AI that understands farmers in their own words',
  'Credit for farmers with no formal credit history',
  'Crop monitoring from space across thousands of fields',
];

export default function Careers() {
  return (
    <>
      <PageIntro
        kicker="Careers"
        title="Let’s grow together"
        intro="We value diverse perspectives and people who want to grow and make an impact: agronomists with data skills, field operators, engineers and data scientists, in a fast-paced team focused on food security."
      >
        <a href="#openings" className="btn-primary mt-8">See current openings</a>
      </PageIntro>

      <Section id="openings">
        <SectionHead title="Current openings" intro="All roles are full time." />
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {jobs.map((j) => (
            <li key={j.title}>
              <a href={j.href} target="_blank" rel="noopener" className="group grid gap-1 py-6 md:grid-cols-[2fr_1fr_auto] md:items-center md:gap-8">
                <span className="text-h3 group-hover:text-field">{j.title}</span>
                <span className="text-ink-mute">{j.team}</span>
                <span className="font-bold text-field">View role</span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="teal">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="text-sm font-semibold text-lime">Data & AI team</p>
            <h2 className="mt-2 text-h2 text-white">Join our Data & AI team</h2>
            <p className="mt-4 text-white/75">Work on real problems with real agricultural data, alongside agronomists, credit teams and field staff.</p>
            <Link href="/ai-data-intelligence/" className="btn-lime mt-6">How we use AI</Link>
          </div>
          <ul className="space-y-3">
            {problems.map((p) => (
              <li key={p} className="rounded-2xl bg-white/[0.06] p-5 text-lg font-semibold text-white ring-1 ring-white/10">{p}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="mint">
        <SectionHead title="Our team’s stories" />
        <ul className="grid gap-5 md:grid-cols-3">
          {teamStories.map((t) => (
            <li key={t.name} className="rounded-[1.75rem] bg-white p-7 ring-1 ring-ink/[0.07]">
              <Initials name={t.name} className="h-14 w-14 text-lg" />
              <p className="mt-5 text-lg">{t.story}</p>
              <p className="mt-4 font-bold">{t.name}</p>
              <p className="text-sm text-ink-mute">{t.role}</p>
            </li>
          ))}
        </ul>
      </Section>

      <CTABand title="Don’t see your role?" body="Send us your CV and tell us how you’d help farmers win." primary={{ label: 'Email hello@ifarmer.asia', href: 'mailto:hello@ifarmer.asia?subject=Careers' }} secondary={{ label: 'Our values', href: '/our-values/' }} />
    </>
  );
}
