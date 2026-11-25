'use client';

/*
 * Simplified app screens shown in the phone on the homepage. They are illustrative layouts in the
 * brand style, not product screenshots: no real people, prices or results.
 * To use a real screenshot instead, add public/apps/<screen>.png and list it in `realShots`.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

export const realShots: Record<string, string> = {
  // 'folon-apply': '/apps/folon-apply.png',
};

const G = '#038F2F';
const LEAF = '#88BB41';
const LIME = '#DDFF80';
const TEAL = '#022B36';

type AppStyle = { name: string; bg: string; fg: string; mark: string };
const apps: Record<string, AppStyle> = {
  Folon: { name: 'Folon', bg: G, fg: '#fff', mark: 'F' },
  'Folon-AI': { name: 'Folon-AI', bg: TEAL, fg: LIME, mark: 'AI' },
  Sofol: { name: 'Sofol', bg: '#0E6B5C', fg: '#fff', mark: 'S' },
  KriShop: { name: 'KriShop', bg: '#17201B', fg: '#fff', mark: 'K' },
  iHarvst: { name: 'iHarvst', bg: '#5E852B', fg: '#fff', mark: 'iH' },
  'Supplier Connect': { name: 'Supplier Connect', bg: '#124A55', fg: '#fff', mark: 'SC' },
  'Farmer Card': { name: 'Farmer Card', bg: G, fg: '#fff', mark: 'FC' },
  'Voice AI': { name: 'Bangla Voice AI', bg: TEAL, fg: LIME, mark: 'VA' },
};

function Bar({ app, title }: { app: string; title: string }) {
  const a = apps[app];
  return (
    <div className="px-4 pb-3 pt-1" style={{ background: a.bg, color: a.fg }}>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold" style={{ background: a.fg, color: a.bg }}>
          {a.mark}
        </span>
        <span className="text-[13px] font-bold">{a.name}</span>
      </div>
      <p className="mt-2 text-[17px] font-bold leading-tight">{title}</p>
    </div>
  );
}

const Skel = ({ w = '100%', h = 7, c = '#E6ECE2' }: { w?: string; h?: number; c?: string }) => (
  <span className="block rounded-full" style={{ width: w, height: h, background: c }} />
);
const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-black/[0.07]">
    <span className="block text-[9.5px] font-semibold text-[#6B786E]">{label}</span>
    <span className="block text-[12.5px] font-bold text-[#1B2A1F]">{value}</span>
  </div>
);
const Btn = ({ children, tone = 'g' }: { children: ReactNode; tone?: 'g' | 'lime' | 'dark' }) => (
  <div
    className="mt-auto rounded-full py-2.5 text-center text-[12.5px] font-bold"
    style={{ background: tone === 'g' ? G : tone === 'lime' ? LIME : TEAL, color: tone === 'lime' ? TEAL : '#fff' }}
  >
    {children}
  </div>
);
const Check = ({ on = true }: { on?: boolean }) => (
  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: on ? G : '#E1E7DD' }}>
    {on && (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="m2 5.2 2 2L8 3" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </span>
);
const Steps = ({ items, at }: { items: string[]; at: number }) => (
  <ul className="space-y-2.5">
    {items.map((t, i) => (
      <li key={t} className="flex items-center gap-2.5 text-[12px] font-semibold" style={{ color: i <= at ? '#1B2A1F' : '#9AA59C' }}>
        {i < at ? <Check /> : i === at ? <span className="h-5 w-5 shrink-0 rounded-full border-[3px]" style={{ borderColor: G, background: LIME }} /> : <Check on={false} />}
        {t}
      </li>
    ))}
  </ul>
);
const Body = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`flex flex-1 flex-col gap-2.5 bg-[#F5F7F1] p-3.5 ${className}`}>{children}</div>
);
const Thumb = ({ photo, h = 92, pos = '50% 50%' }: { photo: string; h?: number; pos?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={`/photos/${photo}-1080.jpg`} alt="" className="w-full rounded-xl object-cover" style={{ height: h, objectPosition: pos }} loading="lazy" />
);

/** A Bangla Voice AI call: what the farmer said, then what it became. */
const Call = ({ title, bn, en, children }: { title: string; bn: string; en: string; children: ReactNode }) => (
  <>
    <Bar app="Voice AI" title={title} />
    <Body>
      <div className="rounded-2xl p-3" style={{ background: '#0B3A45', color: '#fff' }}>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: LIME }} />
          <span className="text-[9.5px] font-bold" style={{ color: LIME }}>
            Call in progress
          </span>
          <span className="ml-auto flex h-3 items-center gap-[2px]" aria-hidden>
            {[5, 9, 6, 11, 7, 10, 5].map((h, i) => (
              <span key={i} className="w-[2px] rounded-full" style={{ height: h, background: LIME, opacity: 0.8 }} />
            ))}
          </span>
        </div>
        <p lang="bn" className="mt-2 text-[13px] font-semibold leading-snug">
          {bn}
        </p>
        <p className="mt-1 text-[9.5px] leading-snug opacity-70">{en}</p>
      </div>
      {children}
    </Body>
  </>
);

const screens: Record<string, () => ReactNode> = {
  'voice-profile': () => (
    <Call title="Building the farmer profile" bn="আমার দুই বিঘা জমিতে বোরো ধান আছে, পরিবারে পাঁচজন।" en="I grow Boro rice on two bigha. There are five of us at home.">
      <p className="text-[10px] font-bold text-[#6B786E]">Saved to the farmer profile</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Household" value="5 people" />
        <Field label="Land" value="2 bigha" />
        <Field label="Crop" value="Boro rice" />
        <Field label="Phone" value="Verified" />
      </div>
      <Btn tone="lime">Profile updated</Btn>
    </Call>
  ),
  'voice-credit': () => (
    <Call title="Adding to the credit assessment" bn="গত বছরের লোন সময়মতো শোধ করেছি।" en="I repaid last year’s loan on time.">
      <div className="rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]">
        <Steps items={['KYC and identity', 'Repayment history', 'What the farmer shared', 'Field verification']} at={2} />
      </div>
      <p className="text-[10px] font-semibold text-[#6B786E]">The credit team or lending partner makes the decision.</p>
      <Btn tone="dark">Send to credit team</Btn>
    </Call>
  ),
  'voice-advice': () => (
    <Call title="Answering in Bangla" bn="ধানের পাতায় বাদামি দাগ, কী করব?" en="Brown spots on my rice leaves. What should I do?">
      <div className="rounded-2xl rounded-bl-md p-3" style={{ background: LIME, color: TEAL }}>
        <p lang="bn" className="text-[12px] font-semibold leading-snug">
          সম্ভবত বাদামি দাগ রোগ। সঠিক মাত্রায় পটাশ সার দিন।
        </p>
        <p className="mt-1 text-[9.5px] leading-snug opacity-75">Likely brown spot. Apply potash at the right rate.</p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-[11.5px] font-bold ring-1 ring-black/[0.06]">
        <Check /> Agronomist follow-up booked
      </div>
      <Btn>Send photo to agronomist</Btn>
    </Call>
  ),
  'voice-inputs': () => (
    <Call title="Recommending inputs" bn="এই সময় কোন সার দেব, কোথায় পাব?" en="Which fertilizer now, and where can I get it?">
      <div className="rounded-2xl bg-white p-3 ring-1 ring-black/[0.06]">
        <p className="text-[9.5px] font-bold text-[#6B786E]">For your crop stage</p>
        <p className="mt-1 text-[13px] font-bold text-[#1B2A1F]">Fertilizer for tillering rice</p>
        <div className="mt-2 space-y-1.5">
          <Skel w="85%" />
          <Skel w="60%" />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-[11.5px] font-bold ring-1 ring-black/[0.06]">
        <Check /> Available through KriShop partner shops
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-[11.5px] font-bold ring-1 ring-black/[0.06]">
        <Check /> Order follow-up in two days
      </div>
      <Btn>Send to KriShop</Btn>
    </Call>
  ),
  'voice-procure': () => (
    <Call title="Planning procurement" bn="এবার চল্লিশ মণ আলু বিক্রি করতে চাই।" en="This season I want to sell forty maunds of potatoes.">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Crop" value="Potato" />
        <Field label="Expected volume" value="40 maunds" />
        <Field label="Ready" value="In three weeks" />
        <Field label="Plans to" value="Sell" />
      </div>
      <Field label="Collection" value="Nearest iFarmer Center" />
      <Btn tone="lime">Added to procurement plan</Btn>
    </Call>
  ),

  launcher: () => (
    <div className="absolute inset-0 flex flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/photos/farmer-phone-1080.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(2,43,54,0.35)] to-[rgba(2,43,54,0.75)]" />
      <div className="relative mt-16 px-4 text-center text-white">
        <p className="text-[34px] font-bold leading-none">iFarmer</p>
        <p className="mt-1 text-[11px] font-semibold opacity-80">One season, five apps</p>
      </div>
      <div className="relative mt-auto grid grid-cols-3 gap-y-4 px-3 pb-6">
        {['Folon', 'Folon-AI', 'KriShop', 'iHarvst', 'Sofol', 'Supplier Connect'].map((k) => (
          <div key={k} className="flex flex-col items-center gap-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[12px] font-bold shadow-lg" style={{ background: apps[k].bg, color: apps[k].fg }}>
              {apps[k].mark}
            </span>
            <span className="text-center text-[9px] font-bold leading-tight text-white">{k}</span>
          </div>
        ))}
      </div>
    </div>
  ),
  'folon-apply': () => (
    <>
      <Bar app="Folon" title="Apply for crop finance" />
      <Body>
        <div className="flex gap-1">
          {[1, 1, 1, 0].map((on, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: on ? LEAF : '#DDE4D8' }} />
          ))}
        </div>
        <Field label="Crop" value="Maize" />
        <Field label="Land" value="1.5 acres" />
        <Field label="What you need" value="Seed, fertilizer, labour" />
        <Field label="Repayment" value="At harvest" />
        <p className="text-[10px] font-semibold text-[#6B786E]">No collateral needed. A facilitator can help you apply.</p>
        <Btn>Submit application</Btn>
      </Body>
    </>
  ),
  'folon-approved': () => (
    <>
      <Bar app="Folon" title="Your crop finance" />
      <Body>
        <div className="mx-auto mt-1 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: LIME }}>
          <svg width="26" height="26" viewBox="0 0 30 30" aria-hidden>
            <path d="m7 15.5 5.5 5.5L23 10" stroke={G} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-center text-[15px] font-bold">Approved</p>
        <div className="rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]">
          <Steps items={['Application received', 'Farm verified', 'Approved by the lender', 'Funds sent to you']} at={3} />
        </div>
        <Field label="Repayment" value="At harvest" />
        <Btn>Buy inputs at KriShop</Btn>
      </Body>
    </>
  ),
  'iharvst-fund': () => (
    <>
      <Bar app="iHarvst" title="All Farms" />
      <Body>
        <div className="rounded-2xl bg-white p-2.5 ring-1 ring-black/[0.06]">
          <Thumb photo="seed-farmer" h={96} pos="60% 45%" />
          <p className="mt-2 text-[13px] font-bold">Maize farm</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {['Insured', 'Season updates', 'Shariah option'].map((t) => (
              <span key={t} className="rounded-full bg-[#EEF6E2] px-2 py-0.5 text-[9px] font-bold text-[#038F2F]">{t}</span>
            ))}
          </div>
          <p className="mt-2 text-[9.5px] font-semibold text-[#6B786E]">Funding progress</p>
          <span className="mt-1 block h-1.5 rounded-full bg-[#E1E7DD]">
            <span className="block h-full w-[62%] rounded-full" style={{ background: LEAF }} />
          </span>
        </div>
        <div className="rounded-2xl bg-white p-2.5 opacity-70 ring-1 ring-black/[0.06]">
          <Thumb photo="advisory-field" h={44} />
          <p className="mt-1.5 text-[12px] font-bold">Rice farm</p>
        </div>
        <Btn>Fund this farm</Btn>
      </Body>
    </>
  ),
  'krishop-order': () => (
    <>
      <Bar app="KriShop" title="Order inputs" />
      <Body>
        <div className="rounded-full bg-white px-3 py-2 text-[11px] text-[#9AA59C] ring-1 ring-black/[0.07]">Search seed, fertilizer, protection</div>
        {[
          ['Hybrid maize seed', 2],
          ['Organic fertilizer', 4],
          ['Crop protection', 1],
        ].map(([n, q]) => (
          <div key={n as string} className="flex items-center gap-2.5 rounded-xl bg-white p-2 ring-1 ring-black/[0.06]">
            <span className="h-10 w-10 shrink-0 rounded-lg" style={{ background: '#EEF6E2' }} />
            <span className="flex-1 text-[11.5px] font-bold leading-tight">{n}</span>
            <span className="flex items-center gap-1.5 text-[12px] font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF6E2] text-[#038F2F]">−</span>
              {q}
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: G }}>+</span>
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-bold" style={{ background: LIME, color: TEAL }}>
          Pay later with Farmer Card <Check />
        </div>
        <Btn tone="dark">Place order</Btn>
      </Body>
    </>
  ),
  'krishop-delivery': () => (
    <>
      <Bar app="KriShop" title="Your order" />
      <Body>
        <div className="rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]">
          <Steps items={['Order placed', 'Confirmed by iFarmer', 'Out for delivery', 'At your shop']} at={2} />
        </div>
        <div className="rounded-2xl bg-white p-3 ring-1 ring-black/[0.06]">
          <p className="text-[10px] font-semibold text-[#6B786E]">Delivering to</p>
          <p className="text-[12.5px] font-bold">Your registered shop</p>
          <div className="mt-2 space-y-1.5">
            <Skel w="80%" />
            <Skel w="55%" />
          </div>
        </div>
        <Btn tone="dark">Track delivery</Btn>
      </Body>
    </>
  ),
  'farmer-card': () => (
    <>
      <Bar app="Farmer Card" title="Your Farmer Card" />
      <Body>
        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white" style={{ background: `linear-gradient(135deg, ${G}, ${LEAF})`, height: 118 }}>
          <p className="text-[11px] font-bold opacity-90">iFarmer</p>
          <p className="text-[15px] font-bold">Farmer Card</p>
          <p className="absolute bottom-3 left-3.5 text-[12px] font-bold tracking-[0.2em]">•••• ••••</p>
          <span className="absolute bottom-3 right-3 h-7 w-7 rounded-md bg-white/90" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['Pay at a shop', 'Transactions', 'Advice', 'Insurance'].map((t) => (
            <div key={t} className="rounded-xl bg-white px-2.5 py-3 text-[11px] font-bold ring-1 ring-black/[0.06]">{t}</div>
          ))}
        </div>
        <p className="text-[10px] font-semibold text-[#6B786E]">Buy inputs now and repay in 30 to 90 days.</p>
        <Btn>Pay at a shop</Btn>
      </Body>
    </>
  ),
  'folonai-ask': () => (
    <>
      <Bar app="Folon-AI" title="Ask about your crop" />
      <Body>
        <div className="flex rounded-full bg-white p-0.5 text-[10.5px] font-bold ring-1 ring-black/[0.07]">
          {['Text', 'Voice', 'Photo'].map((t) => (
            <span key={t} className="flex-1 rounded-full py-1 text-center" style={t === 'Photo' ? { background: TEAL, color: LIME } : { color: '#4A5A4E' }}>
              {t}
            </span>
          ))}
        </div>
        <div className="ml-6 rounded-2xl rounded-br-md p-2 text-white" style={{ background: G }}>
          <Thumb photo="advisory-field" h={70} pos="60% 70%" />
          <p className="mt-1.5 text-[11px] font-semibold">What is wrong with these leaves?</p>
        </div>
        <div className="mr-6 space-y-1.5 rounded-2xl rounded-bl-md bg-white p-3 ring-1 ring-black/[0.06]">
          <Skel w="92%" />
          <Skel w="84%" />
          <Skel w="60%" />
          <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: LIME, color: TEAL }}>Agronomist can follow up</span>
        </div>
        <div className="mt-auto flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-black/[0.07]">
          <span className="flex-1 text-[10.5px] text-[#9AA59C]">Ask in Bangla</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: TEAL }}>
            <svg width="10" height="13" viewBox="0 0 10 13" aria-hidden>
              <rect x="3" y="0.5" width="4" height="8" rx="2" fill={LIME} />
              <path d="M1 6.5a4 4 0 0 0 8 0M5 10.5V12.5" stroke={LIME} strokeWidth="1.3" fill="none" />
            </svg>
          </span>
        </div>
      </Body>
    </>
  ),
  'folon-advice': () => (
    <>
      <Bar app="Folon" title="This week for your maize" />
      <Body>
        <div className="rounded-2xl p-3 ring-1 ring-black/[0.06]" style={{ background: LIME }}>
          <p className="text-[10px] font-bold" style={{ color: TEAL }}>Weather alert</p>
          <div className="mt-1.5 space-y-1.5">
            <Skel w="90%" c="rgba(2,43,54,0.2)" />
            <Skel w="64%" c="rgba(2,43,54,0.2)" />
          </div>
        </div>
        {['Fertilizer timing', 'Pest watch'].map((t) => (
          <div key={t} className="rounded-2xl bg-white p-3 ring-1 ring-black/[0.06]">
            <p className="text-[12px] font-bold">{t}</p>
            <div className="mt-1.5 space-y-1.5">
              <Skel w="94%" />
              <Skel w="70%" />
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <span className="flex-1 rounded-full bg-white py-2 text-center text-[11px] font-bold ring-1 ring-black/[0.07]">Listen</span>
          <span className="flex-1 rounded-full bg-white py-2 text-center text-[11px] font-bold ring-1 ring-black/[0.07]">Chat with expert</span>
        </div>
        <Btn>Mark as done</Btn>
      </Body>
    </>
  ),
  'supplier-share': () => (
    <>
      <Bar app="Supplier Connect" title="Share availability" />
      <Body>
        <Field label="Crop" value="Bottle gourd" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Quantity" value="2 tonnes" />
          <Field label="Grade" value="A" />
        </div>
        <Field label="Ready from" value="Next week" />
        <Field label="Your price" value="Per kg, negotiable" />
        <Btn>Share with iFarmer</Btn>
      </Body>
    </>
  ),
  'supplier-orders': () => (
    <>
      <Bar app="Supplier Connect" title="Buyer orders" />
      <Body>
        {['Quality standard', 'Delivery date', 'Payment schedule'].map((t, i) => (
          <div key={t} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 ring-1 ring-black/[0.06]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold" style={{ background: i === 0 ? LIME : '#EEF6E2', color: TEAL }}>
              {i + 1}
            </span>
            <span className="flex-1">
              <span className="block text-[11.5px] font-bold">{t}</span>
              <Skel w="70%" h={6} />
            </span>
          </div>
        ))}
        <Thumb photo="collection-center" h={78} />
        <Btn>Accept order</Btn>
      </Body>
    </>
  ),
  'supplier-dispatch': () => (
    <>
      <Bar app="Supplier Connect" title="Order status" />
      <Body>
        <Thumb photo="harvest-crates" h={86} />
        <div className="rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]">
          <Steps items={['Collected at center', 'Quality checked', 'Dispatched to buyer', 'Payment released']} at={2} />
        </div>
        <Btn tone="lime">View payment schedule</Btn>
      </Body>
    </>
  ),
  'sofol-register': () => (
    <>
      <Bar app="Sofol" title="Register a farmer" />
      <Body>
        <div className="relative flex h-[138px] items-center justify-center rounded-2xl" style={{ background: '#1B2A1F' }}>
          {['left-3 top-3 border-l-2 border-t-2', 'right-3 top-3 border-r-2 border-t-2', 'bottom-3 left-3 border-b-2 border-l-2', 'bottom-3 right-3 border-b-2 border-r-2'].map((c) => (
            <span key={c} className={`absolute h-5 w-5 rounded-sm ${c}`} style={{ borderColor: LIME }} />
          ))}
          <div className="w-[70%] rounded-lg bg-white/90 p-2">
            <Skel w="50%" h={6} c="#C9D3C4" />
            <div className="mt-1.5 flex gap-2">
              <span className="h-9 w-8 rounded bg-[#C9D3C4]" />
              <span className="flex-1 space-y-1">
                <Skel w="90%" h={5} c="#C9D3C4" />
                <Skel w="70%" h={5} c="#C9D3C4" />
                <Skel w="80%" h={5} c="#C9D3C4" />
              </span>
            </div>
          </div>
        </div>
        <p className="text-center text-[11px] font-semibold text-[#4A5A4E]">Scan the national ID card</p>
        <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-[12px] font-bold ring-1 ring-black/[0.06]">
          <Check /> e-KYC verified
        </div>
        <Btn>Continue to farm details</Btn>
      </Body>
    </>
  ),
  'sofol-profile': () => (
    <>
      <Bar app="Sofol" title="Farmer profile" />
      <Body>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/[0.06]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: '#EEF6E2', color: G }}>
            FP
          </span>
          <span className="flex-1 space-y-1.5">
            <Skel w="70%" h={8} c="#CFD8CA" />
            <Skel w="45%" h={6} />
          </span>
        </div>
        {['Household', 'Land and crops', 'Transactions'].map((t) => (
          <div key={t} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-[12px] font-bold ring-1 ring-black/[0.06]">
            {t} <Check />
          </div>
        ))}
        <p className="text-[10px] font-bold text-[#6B786E]">Services</p>
        <div className="flex flex-wrap gap-1">
          {['Finance', 'Inputs', 'Advice', 'Insurance', 'Market'].map((t) => (
            <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: LIME, color: TEAL }}>{t}</span>
          ))}
        </div>
      </Body>
    </>
  ),
  'krishop-credit': () => (
    <>
      <Bar app="KriShop" title="Buy now, pay later" />
      <Body>
        <div className="rounded-2xl p-3.5" style={{ background: TEAL, color: '#fff' }}>
          <p className="text-[10px] font-bold opacity-80">Input credit</p>
          <div className="mt-2 space-y-1.5">
            <Skel w="60%" h={10} c="rgba(221,255,128,0.85)" />
            <Skel w="40%" h={6} c="rgba(255,255,255,0.3)" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-[12px] font-bold ring-1 ring-black/[0.06]">
          <Check /> Instant decision
        </div>
        <p className="text-[10px] font-bold text-[#6B786E]">Repay in</p>
        <div className="flex rounded-full bg-white p-0.5 text-[11px] font-bold ring-1 ring-black/[0.07]">
          {['30 days', '60 days', '90 days'].map((t) => (
            <span key={t} className="flex-1 rounded-full py-1.5 text-center" style={t === '60 days' ? { background: TEAL, color: LIME } : { color: '#4A5A4E' }}>
              {t}
            </span>
          ))}
        </div>
        <Btn tone="dark">Use credit for this order</Btn>
      </Body>
    </>
  ),
  'krishop-ledger': () => (
    <>
      <Bar app="KriShop" title="Lenden: your shop's book" />
      <Body>
        <div className="grid grid-cols-2 gap-2">
          {['Sales today', 'Due to collect'].map((t, i) => (
            <div key={t} className="rounded-xl bg-white p-2.5 ring-1 ring-black/[0.06]">
              <p className="text-[9.5px] font-semibold text-[#6B786E]">{t}</p>
              <Skel w={i ? '55%' : '70%'} h={9} c={i ? '#F2C9A0' : '#CFE3B0'} />
            </div>
          ))}
        </div>
        {['RK', 'MA', 'SH'].map((ini, i) => (
          <div key={ini} className="flex items-center gap-2.5 rounded-xl bg-white p-2 ring-1 ring-black/[0.06]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: '#EEF6E2', color: G }}>
              {ini}
            </span>
            <span className="flex-1 space-y-1">
              <Skel w="65%" h={6} c="#CFD8CA" />
              <Skel w="40%" h={5} />
            </span>
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={i === 0 ? { background: LIME, color: TEAL } : { background: '#FBE9DA', color: '#8A4B12' }}>
              {i === 0 ? 'Reminder sent' : 'Due'}
            </span>
          </div>
        ))}
        <p className="text-[10px] font-semibold text-[#6B786E]">Works offline. SMS reminders go to customers with unpaid balances.</p>
        <Btn tone="dark">Add entry</Btn>
      </Body>
    </>
  ),
  'sofol-visits': () => (
    <>
      <Bar app="Sofol" title="Farm visit" />
      <Body>
        <Thumb photo="advisory-field" h={104} pos="50% 60%" />
        {['Crop stage recorded', 'Photos uploaded', 'Transaction logged'].map((t) => (
          <div key={t} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-[12px] font-bold ring-1 ring-black/[0.06]">
            {t} <Check />
          </div>
        ))}
        <Field label="Next visit" value="In two weeks" />
        <Btn>Save visit</Btn>
      </Body>
    </>
  ),
  'iharvst-updates': () => (
    <>
      <Bar app="iHarvst" title="Season updates" />
      <Body>
        <Thumb photo="seed-farmer" h={96} pos="60% 45%" />
        <div className="rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]">
          <Steps items={['Land prepared', 'Seeds sown', 'Crop flowering', 'Harvest and sale']} at={2} />
        </div>
        <div className="flex flex-wrap gap-1">
          {['Insured', 'Photos from the field'].map((t) => (
            <span key={t} className="rounded-full bg-[#EEF6E2] px-2 py-0.5 text-[9.5px] font-bold text-[#038F2F]">{t}</span>
          ))}
        </div>
        <Btn>See all updates</Btn>
      </Body>
    </>
  ),
  'machine-catalog': () => (
    <>
      <Bar app="Farmer Card" title="Machines you can finance" />
      <Body>
        {['Power tiller', 'Rice reaper', 'Power sprayer'].map((t, i) => (
          <div key={t} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 ring-1 ring-black/[0.06]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: i === 1 ? LIME : '#EEF6E2' }}>
              <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden>
                <rect x="2" y="3" width="12" height="7" rx="2" fill={TEAL} opacity="0.85" />
                <circle cx="5" cy="12.5" r="2.8" fill={TEAL} />
                <circle cx="16" cy="11.5" r="3.8" fill={TEAL} />
              </svg>
            </span>
            <span className="flex-1">
              <span className="block text-[12px] font-bold">{t}</span>
              <span className="text-[9.5px] font-semibold text-[#6B786E]">Try it at an Experience Center</span>
            </span>
          </div>
        ))}
        <Btn>Book a demo</Btn>
      </Body>
    </>
  ),
  'machine-emi': () => (
    <>
      <Bar app="Farmer Card" title="Pay in instalments" />
      <Body>
        <Field label="Machine" value="Rice reaper" />
        <p className="text-[10px] font-bold text-[#6B786E]">Pay over</p>
        <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
          {['4', '6', '9', '12'].map((t) => (
            <span key={t} className="rounded-lg py-2 text-center ring-1 ring-black/[0.06]" style={t === '6' ? { background: G, color: '#fff' } : { background: '#fff', color: '#4A5A4E' }}>
              {t} mo
            </span>
          ))}
        </div>
        <div className="rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]">
          <Steps items={['Machine chosen', 'Instalment plan', 'Training booked', 'After-sales service']} at={1} />
        </div>
        <Btn>Request instalments</Btn>
      </Body>
    </>
  ),
  'folon-paid': () => (
    <>
      <Bar app="Folon" title="Harvest sold" />
      <Body className="items-stretch">
        <div className="mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: LIME }}>
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
            <path d="m7 15.5 5.5 5.5L23 10" stroke={G} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-center text-[15px] font-bold">Payment received</p>
        <div className="rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]">
          <Steps items={['Sold through iFarmer Center', 'Loan settled from harvest', 'Payment received', 'Ready for next season']} at={3} />
        </div>
        <Btn>Plan next season</Btn>
      </Body>
    </>
  ),
  'iharvst-returns': () => (
    <>
      <Bar app="iHarvst" title="Project complete" />
      <Body>
        <Thumb photo="harvest-market" h={100} pos="50% 40%" />
        {['Harvest sold', 'Loan repaid', 'Returns shared'].map((t) => (
          <div key={t} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-[12px] font-bold ring-1 ring-black/[0.06]">
            {t} <Check />
          </div>
        ))}
        <Btn>Fund next season</Btn>
      </Body>
    </>
  ),
};

/** A phone with an app screen, drawn at 300px wide and scaled to fit. Changing `screen` slides the new one in. */
export function Phone({ screen, className = '' }: { screen: string; className?: string }) {
  const Screen = screens[screen] ?? screens.launcher;
  const real = realShots[screen];
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.7);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / 300));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className={`relative aspect-[300/632] ${className}`}>
      {/* drawn at 300 x 632 and zoomed to the box; absolute so the drawing never sizes the box */}
      <div className="absolute left-0 top-0" style={{ width: 300, height: 632, zoom: k }}>
        <div className="relative h-full w-full rounded-[2.9rem] bg-[#0E1512] p-[10px] shadow-[0_40px_80px_-30px_rgba(2,43,54,0.55),inset_0_0_0_1.5px_rgba(255,255,255,0.08)]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[2.35rem] bg-[#F5F7F1] font-sans text-[#1B2A1F]">
            <div className="absolute left-1/2 top-2 z-20 h-[20px] w-[82px] -translate-x-1/2 rounded-full bg-[#0E1512]" aria-hidden />
            <div key={screen} className="screen-in relative flex h-full flex-col">
              {real ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={real} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <div
                    className={`flex h-9 shrink-0 items-end justify-between px-6 pb-1 text-[11px] font-bold ${screen === 'launcher' ? 'absolute inset-x-0 top-0 z-10 text-white' : ''}`}
                    style={screen === 'launcher' ? undefined : { background: apps[screenApp(screen)].bg, color: apps[screenApp(screen)].fg }}
                  >
                    <span>10:30</span>
                    <span className="flex gap-1" aria-hidden>
                      <span className="h-2 w-3 rounded-sm bg-current opacity-80" />
                      <span className="h-2 w-4 rounded-sm bg-current" />
                    </span>
                  </div>
                  <Screen />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function screenApp(screen: string) {
  if (screen.startsWith('folonai')) return 'Folon-AI';
  if (screen.startsWith('folon')) return 'Folon';
  if (screen.startsWith('sofol')) return 'Sofol';
  if (screen.startsWith('krishop')) return 'KriShop';
  if (screen.startsWith('iharvst')) return 'iHarvst';
  if (screen.startsWith('supplier')) return 'Supplier Connect';
  if (screen.startsWith('voice')) return 'Voice AI';
  return 'Farmer Card';
}

export function appStyle(app: string) {
  return apps[app] ?? apps.Folon;
}
