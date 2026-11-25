'use client';

import { useEffect, useState } from 'react';
import { EMAIL } from '@/content/offerings';

const topics = [
  { id: 'farmer', label: 'I’m a farmer' },
  { id: 'retailer', label: 'I run an agri-input shop' },
  { id: 'funder', label: 'I want to fund farms' },
  { id: 'buyer', label: 'I want to buy produce or export' },
  { id: 'supplier', label: 'I want to supply through Supplier Connect' },
  { id: 'partner', label: 'Partnership (lender, agribusiness, development)' },
  { id: 'center', label: 'iFarmer Center or Experience Center' },
  { id: 'media', label: 'Press and media' },
  { id: 'other', label: 'Something else' },
];

/**
 * Prototype form: opens the visitor's email app with the message filled in, so it works with no backend.
 * Before launch, connect it to the CRM or a form endpoint.
 */
export function ContactForm() {
  const [topic, setTopic] = useState('farmer');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('topic');
    if (t && topics.some((x) => x.id === t)) setTopic(t);
  }, []);

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const label = topics.find((x) => x.id === topic)?.label ?? topic;
        const body = `Name: ${f.get('name')}\nPhone: ${f.get('phone')}\nEmail: ${f.get('email')}\nOrganisation: ${f.get('org') || '-'}\n\n${f.get('message')}`;
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Website enquiry: ' + label)}&body=${encodeURIComponent(body)}`;
        setSent(true);
      }}
    >
      <label className="grid gap-2">
        <span className="font-bold">What can we help with?</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} name="topic" className="rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 text-lg focus:border-field">
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-bold">Your name</span>
          <input required name="name" autoComplete="name" className="rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 text-lg focus:border-field" />
        </label>
        <label className="grid gap-2">
          <span className="font-bold">Phone</span>
          <input name="phone" type="tel" autoComplete="tel" className="rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 text-lg focus:border-field" />
        </label>
        <label className="grid gap-2">
          <span className="font-bold">Email</span>
          <input name="email" type="email" autoComplete="email" className="rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 text-lg focus:border-field" />
        </label>
        <label className="grid gap-2">
          <span className="font-bold">Organisation <span className="font-normal text-ink-mute">(optional)</span></span>
          <input name="org" autoComplete="organization" className="rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 text-lg focus:border-field" />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="font-bold">Message</span>
        <textarea required name="message" rows={5} className="rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 text-lg focus:border-field" />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary">Send message</button>
        {sent && <p role="status" className="font-semibold text-field">Your email app should open with the message ready to send.</p>}
      </div>
    </form>
  );
}
