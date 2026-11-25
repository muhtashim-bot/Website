import type { Metadata } from 'next';
import { offices } from '@/content/company';
import { EMAIL, HOTLINE, HOTLINE_TEL } from '@/content/offerings';
import { PageIntro, Section } from '@/components/ui';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact iFarmer | Hotline 08008500800',
  description: 'Call iFarmer free on 08008500800, email hello@ifarmer.asia, or send us a message.',
};

export default function Contact() {
  return (
    <>
      <PageIntro kicker="Contact" title="Talk to us" intro="Farmers, retailers, funders, buyers and partners: tell us what you need and the right team will get back to you." />
      <Section>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] bg-field p-7 text-white">
              <p className="font-semibold text-lime">Free hotline</p>
              <a href={HOTLINE_TEL} className="mt-1 block text-[2.4rem] font-bold leading-none hover:underline">{HOTLINE}</a>
              <p className="mt-3 text-white/80">Saturday to Thursday, 10 AM to 6 PM. Advice, loans, orders and sales.</p>
            </div>
            <div className="rounded-[1.75rem] bg-mint p-7">
              <p className="font-semibold text-field">Email</p>
              <a href={`mailto:${EMAIL}`} className="mt-1 block text-h3 hover:text-field">{EMAIL}</a>
            </div>
            {offices.map((o) => (
              <address key={o.city} className="rounded-[1.75rem] p-7 not-italic ring-1 ring-ink/10">
                <p className="font-bold">{o.city}</p>
                {o.lines.map((l) => <p key={l} className="text-ink-soft">{l}</p>)}
                {o.note && <p className="mt-2 text-sm text-ink-mute">{o.note}</p>}
              </address>
            ))}
          </div>
          <div className="rounded-[2rem] bg-cream p-7 md:p-10">
            <h2 className="mb-6 text-h2">Send a message</h2>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
