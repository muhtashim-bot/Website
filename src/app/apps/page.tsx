import type { Metadata } from 'next';
import Link from 'next/link';
import { products, HOTLINE } from '@/content/offerings';
import { GooglePlay, PageIntro, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Get the iFarmer Apps | Folon, KriShop, iHarvst, Sofol, Supplier Connect',
  description: 'Find the right iFarmer app for farmers, retailers, funders, field agents and suppliers.',
};

const order = ['product-folon', 'product-krishop', 'product-iharvst', 'product-sofol', 'product-supplier-connect'];
const forWho: Record<string, string> = {
  'product-folon': 'For farmers',
  'product-krishop': 'For agri-input retailers',
  'product-iharvst': 'For funders',
  'product-sofol': 'For field facilitators and partner retailers',
  'product-supplier-connect': 'For suppliers and traders',
};

export default function Apps() {
  const apps = order.map((s) => products.find((p) => p.slug === s)!);
  return (
    <>
      <PageIntro kicker="Get the apps" title="One app for each part of the season" intro="Pick the app made for you. If a download link isn’t listed, our team will set you up: call the free hotline." />
      <Section>
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {apps.map((a) => (
            <li key={a.slug} className="grid gap-4 py-8 md:grid-cols-[1fr_2fr_auto] md:items-center md:gap-10">
              <div>
                <p className="text-sm font-semibold text-field">{forWho[a.slug]}</p>
                <h2 className="text-h2">{a.name}</h2>
              </div>
              <p className="text-lg text-ink-soft">{a.intro}</p>
              <div className="flex flex-wrap gap-3 md:justify-end">
                {a.stores?.android ? (
                  <GooglePlay href={a.stores.android} />
                ) : (
                  <a href={`tel:+88${HOTLINE}`} className="btn-ghost">Call to get set up</a>
                )}
                <Link href={`/${a.slug}/`} className="btn-ghost">About {a.name}</Link>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
