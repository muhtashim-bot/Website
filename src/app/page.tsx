import Link from 'next/link';
import { Journey } from '@/components/Journey';
import { HeroFilm, StatementBand } from '@/components/HeroFilm';
import { ServiceTabs } from '@/components/ServiceTabs';
import { CTABand, Initials, MetricRow, Section, SectionHead, StatusTag } from '@/components/ui';
import { audiences, products, services } from '@/content/offerings';
import { headlineMetrics, metrics } from '@/content/metrics';
import { awards, backers, news, stories } from '@/content/company';
import { capabilities } from '@/content/ai';

const apps = ['product-folon', 'product-sofol', 'product-krishop', 'product-iharvst', 'product-supplier-connect']
  .map((s) => products.find((p) => p.slug === s)!)
  .filter(Boolean);

const aiStrip = [
  { id: 'voice-ai', title: 'Bangla Voice AI', body: 'One conversation serves five needs: profile, credit inputs, advice, inputs and harvest plans.' },
  { id: 'folon-ai', title: 'AI advisory', body: 'Folon-AI answers by text, voice or photo, and hands complex cases to agronomists.' },
  { id: 'credit', title: 'Credit and farm intelligence', body: 'Data-driven credit assessment and crop monitoring from space and soil.' },
];

const climate = services.find((s) => s.slug === 'climate-smart-solution')!.blocks[0].items;
const climateFigures = ['1,310', '30%', '~20%', '40–60%'];
const climateUnits = ['BDT saved per bigha with AWD', 'less chemical fertilizer with vermicompost', 'lower running costs with solar irrigation', 'less chemical pesticide with IPM'];

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Home() {
  return (
    <>
      <HeroFilm />
      <Journey />

      {/* metrics */}
      <section aria-label="iFarmer in numbers" className="border-b border-ink/[0.06] bg-white">
        <div className="container py-14">
          <MetricRow ids={headlineMetrics} />
        </div>
      </section>

      {/* paths */}
      <Section id="paths" tone="mint" label="Choose your path">
        <SectionHead title="Where do you fit in the season?" intro="Five ways into iFarmer. Pick yours to see what you get and how to start." />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {audiences.map((a, i) => (
            <li key={a.slug}>
              <Link
                href={`/${a.slug}/`}
                className={`group flex h-full flex-col justify-between rounded-[1.75rem] p-6 ring-1 transition-colors ${i === 0 ? 'bg-field text-white ring-field' : 'bg-white ring-ink/[0.07] hover:ring-field'}`}
              >
                <span className={`text-sm font-semibold ${i === 0 ? 'text-lime' : 'text-field'}`}>I am a</span>
                <span className="mt-1 block text-[1.6rem] font-bold leading-tight">{a.name.replace(' & Export', '')}</span>
                <span className={`mt-6 block text-[0.95rem] ${i === 0 ? 'text-white/80' : 'text-ink-mute'}`}>{a.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <StatementBand
        photo="advisory-field"
        statement="Our impact-first approach aims to serve close to 20 million smallholder farmers across Bangladesh."
        link={{ label: 'See our impact', href: '/impact/' }}
      />

      {/* services */}
      <Section label="Services">
        <SectionHead title="Everything farmers need to thrive" intro="Six services that work as one, so a loan arrives with the right inputs, advice, cover and a buyer for the harvest." />
        <ServiceTabs />
      </Section>

      {/* technology */}
      <Section tone="teal" label="Technology">
        <SectionHead
          dark
          title="Technology that knows every farmer"
          intro="Powered by Bangla Voice AI, AI advisory, farmer data, satellite monitoring and machine learning, and always checked by people."
          action={
            <Link href="/ai-data-intelligence/" className="btn-lime">
              Explore AI & Data
            </Link>
          }
        />
        <ul className="grid gap-4 md:grid-cols-3">
          {aiStrip.map((a) => {
            const cap = capabilities.find((c) => c.id === a.id)!;
            return (
              <li key={a.id}>
                <Link href={`/ai-data-intelligence/#${a.id}`} className="block h-full rounded-[1.75rem] bg-white/[0.06] p-7 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                  <StatusTag status={cap.status} />
                  <h3 className="mt-4 text-h3 text-white">{a.title}</h3>
                  <p className="mt-2 text-white/75">{a.body}</p>
                </Link>
              </li>
            );
          })}
        </ul>

        <h3 className="mt-16 text-h3 text-white">Five apps, one loop</h3>
        <ul className="mt-6 grid gap-px overflow-hidden rounded-[1.75rem] bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
          {apps.map((p) => (
            <li key={p.slug} className="bg-teal">
              <Link href={`/${p.slug}/`} className="block h-full p-6 hover:bg-white/[0.06]">
                <span className="text-sm font-semibold text-lime">{p.eyebrow}</span>
                <span className="mt-1 block text-xl font-bold text-white">{p.name}</span>
                <span className="mt-2 block text-[0.95rem] text-white/70">{p.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* centers */}
      <Section label="iFarmer Centers">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-h2">A one-stop shop in the farmer’s own village</h2>
            <p className="mt-4 text-lead text-ink-soft">
              Farmers walk into an iFarmer Center to apply for a loan, buy inputs, get one-to-one advice and sell their harvest. Our Agri-Machinery Experience Centers let them try a machine before they buy it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ifarmer-center/" className="btn-primary">About iFarmer Centers</Link>
              <Link href="/experience-centers/" className="btn-ghost">Experience Centers</Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {(['centers', 'experienceCenters', 'districts', 'riskCovered'] as const).map((id) => (
              <div key={id} className="rounded-[1.75rem] bg-cream p-6">
                <dd className="text-[2.2rem] font-bold leading-none text-field">{metrics[id].value}</dd>
                <dt className="mt-2 text-ink-soft">{metrics[id].label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* climate */}
      <Section tone="cream" label="Climate-smart results">
        <SectionHead
          title="Climate-smart farming that pays for itself"
          intro="Field programs that save water, soil and money, measured with the farmers who run them."
          action={<Link href="/climate-smart-solution/" className="btn-ghost bg-white/60">See all programs</Link>}
        />
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {climate.map((c, i) => (
            <li key={c.title} className="border-t-2 border-field/30 pt-5">
              <p className="text-[2.4rem] font-bold leading-none text-field">{climateFigures[i]}</p>
              <p className="mt-2 font-semibold">{climateUnits[i]}</p>
              <p className="mt-3 text-sm text-ink-mute">{c.title}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* stories */}
      <Section label="Voice of impact">
        <SectionHead title="Voice of impact" intro="Farmers and retailers on what changed for them." action={<Link href="/impact/" className="btn-ghost">Our impact</Link>} />
        <ul className="grid gap-5 md:grid-cols-2">
          {stories.map((s) => (
            <li key={s.name} className="flex gap-5 rounded-[1.75rem] bg-mint p-7">
              <Initials name={s.name} className="h-14 w-14 shrink-0 text-lg" />
              <div>
                <p className="text-lg leading-relaxed">{s.story}</p>
                <p className="mt-4 font-bold">{s.name}</p>
                <p className="text-sm text-ink-mute">{s.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* awards */}
      <Section tone="lime" label="Awards and recognition">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-h2">Recognised for the work in the field</h2>
            <p className="mt-4 text-ink-soft">
              iFarmer is also Orange Seal certified, recognising our commitment to advancing gender equality in line with SDG 5.
            </p>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {awards.map((a) => (
              <li key={a.name} className="flex items-baseline justify-between gap-4 border-b border-ink/15 py-3.5">
                <span>
                  {a.href ? (
                    <a href={a.href} target="_blank" rel="noopener" className="font-bold hover:text-field hover:underline">
                      {a.name}
                    </a>
                  ) : (
                    <span className="font-bold">{a.name}</span>
                  )}
                  <span className="block text-sm text-ink-soft">{a.by}</span>
                </span>
                {a.year && <span className="shrink-0 text-sm font-semibold text-ink-soft">{a.year}</span>}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* backers */}
      <Section label="Backers">
        <SectionHead title="Backed by investors who share the mission" action={<Link href="/investors/" className="btn-ghost">For investors</Link>} />
        <ul className="grid gap-4 md:grid-cols-3">
          {backers.map((b) => (
            <li key={b.name} className="rounded-[1.75rem] p-6 ring-1 ring-ink/10">
              <p className="text-xl font-bold">{b.name}</p>
              <p className="mt-1 text-ink-mute">{b.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* news */}
      <Section tone="mint" label="News">
        <SectionHead title="In the news" action={<Link href="/news/" className="btn-ghost bg-white/60">All news</Link>} />
        <ul className="grid gap-5 md:grid-cols-3">
          {news.slice(0, 3).map((n) => (
            <li key={n.href}>
              <a href={n.href} target="_blank" rel="noopener" className="group flex h-full flex-col rounded-[1.75rem] bg-white p-7 ring-1 ring-ink/[0.07] hover:ring-field">
                <span className="text-sm font-semibold text-field">{n.outlet}</span>
                <span className="mt-2 text-h3 group-hover:text-field">{n.title}</span>
                <time dateTime={n.date} className="mt-auto pt-6 text-sm text-ink-mute">{fmt(n.date)}</time>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      {/* careers */}
      <Section label="Careers">
        <div className="grid items-center gap-10 rounded-[2.25rem] bg-cream p-8 md:grid-cols-[2fr_1fr] md:p-12">
          <div>
            <h2 className="text-h2">A team built for impact</h2>
            <p className="mt-4 text-lead text-ink-soft">
              Agronomists with data skills, field operators, engineers and data scientists working on food security every day.
            </p>
          </div>
          <div className="md:text-right">
            <Link href="/careers/" className="btn-primary">See open roles</Link>
          </div>
        </div>
      </Section>

      <CTABand
        title="Build the next season with us"
        body="Lenders, agribusinesses, buyers and development partners: let’s reach more farmers together."
        primary={{ label: 'Partner with us', href: '/for-partners/' }}
        secondary={{ label: 'Get the apps', href: '/apps/' }}
      />
    </>
  );
}
