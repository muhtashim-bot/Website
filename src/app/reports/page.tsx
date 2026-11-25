import type { Metadata } from 'next';
import { reports } from '@/content/company';
import { CTABand, PageIntro, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Reports | iFarmer',
  description: 'iFarmer impact assessments and research on farmers, financial inclusion and climate-smart agriculture in Bangladesh.',
};

export default function Reports() {
  return (
    <>
      <PageIntro kicker="Reports" title="Results that matter" intro="Our impact assessments and research, published every year since 2020." />
      <Section>
        <ul className="grid gap-4 md:grid-cols-2">
          {reports.map((r) => (
            <li key={r.href}>
              <a href={r.href} target="_blank" rel="noopener" className="group flex h-full items-start justify-between gap-6 rounded-[1.75rem] bg-white p-7 ring-1 ring-ink/[0.07] hover:ring-field">
                <span>
                  <span className="text-sm font-semibold text-field">{r.kind}</span>
                  <span className="mt-1 block text-h3 group-hover:text-field">{r.title}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-2">
                  {r.year && <span className="text-[1.8rem] font-bold leading-none text-leaf">{r.year}</span>}
                  <span className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-bold text-field">PDF</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>
      <CTABand title="Want to work with our data?" primary={{ label: 'Talk to our team', href: '/contact/?topic=partner' }} />
    </>
  );
}
