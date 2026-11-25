import type { Metadata } from 'next';
import { news } from '@/content/company';
import { PageIntro, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: 'News & Media | iFarmer',
  description: 'iFarmer in the news: awards, investments, partnerships and stories from the field.',
};

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function News() {
  const years = Array.from(new Set(news.map((n) => n.date.slice(0, 4))));
  return (
    <>
      <PageIntro kicker="News & media" title="iFarmer in the news" intro="Coverage of our work, newest first. For press enquiries, email hello@ifarmer.asia." />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_3fr]">
          <aside className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
            <div className="rounded-[1.5rem] bg-cream p-6">
              <h2 className="text-lg font-bold">Press kit</h2>
              <p className="mt-2 text-ink-soft">For logo files, company boilerplate, founder photos or an interview, contact our team.</p>
              <a href="mailto:hello@ifarmer.asia?subject=Press%20enquiry" className="btn-primary mt-5">Media enquiries</a>
            </div>
          </aside>
          <div>
            {years.map((y) => (
              <div key={y} className="mb-12">
                <h2 className="mb-4 text-h3 text-field">{y}</h2>
                <ul className="divide-y divide-ink/10 border-y border-ink/10">
                  {news.filter((n) => n.date.startsWith(y)).map((n) => (
                    <li key={n.href}>
                      <a href={n.href} target="_blank" rel="noopener" className="group grid gap-1 py-5 md:grid-cols-[10rem_1fr_10rem] md:gap-6">
                        <time dateTime={n.date} className="text-ink-mute">{fmt(n.date)}</time>
                        <span className="text-lg font-bold group-hover:text-field">{n.title}</span>
                        <span className="text-ink-mute md:text-right">{n.outlet}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
