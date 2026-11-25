import type { Metadata } from 'next';
import { posts } from '@/content/company';
import { PageIntro, Section, SectionHead } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Insights | iFarmer',
  description: 'Stories and insights on Bangladeshi agriculture, and notes from the iFarmer tech team.',
};

export default function Blogs() {
  const groups = [
    { id: 'Insights', title: 'Field insights', intro: 'Stories and ideas from Bangladeshi agriculture.' },
    { id: 'Tech', title: 'From the tech team', intro: 'How we build and test the apps behind iFarmer.' },
  ];
  return (
    <>
      <PageIntro kicker="Insights" title="Notes from the field and the code" />
      {groups.map((g, i) => (
        <Section key={g.id} tone={i ? 'mint' : 'plain'}>
          <SectionHead title={g.title} intro={g.intro} />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.filter((p) => p.topic === g.id).map((p) => (
              <li key={p.href}>
                <a href={p.href} target="_blank" rel="noopener" className="group flex h-full flex-col rounded-[1.75rem] bg-white p-7 ring-1 ring-ink/[0.07] hover:ring-field">
                  <span className="text-h3 group-hover:text-field">{p.title}</span>
                  <span className="mt-auto pt-6 text-sm font-bold text-field">Read on ifarmer.asia</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </>
  );
}
