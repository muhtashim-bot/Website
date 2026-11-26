import type { Metadata } from 'next';
import Link from 'next/link';
import { aiFlow, aiFlowIntro, aiHero, capabilities, folonAI, profileInputs, responsibleAI, voiceAI, voiceWalk, workWithUs } from '@/content/ai';
import { FolonModes } from '@/components/AIInteractive';
import { AIChatDemo } from '@/components/AIChatDemo';
import { FieldIntelligence } from '@/components/FieldIntelligence';
import { Walkthrough } from '@/components/Walkthrough';
import { Section, SectionHead, SmartLink, StatusTag } from '@/components/ui';

export const metadata: Metadata = {
  title: 'AI in Agriculture | Bangla Voice AI & Farm Data | iFarmer',
  description:
    'How iFarmer uses Bangla Voice AI, AI advisory, satellite monitoring and credit intelligence to serve smallholder farmers in Bangladesh.',
};

const anchors = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'voice-ai', label: 'Bangla Voice AI' },
  { id: 'folon-ai', label: 'Folon-AI' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'credit', label: 'Credit' },
  { id: 'responsible-ai', label: 'Responsible AI' },
  { id: 'work-with-us', label: 'Work with us' },
];

export default function AIPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#01232C] text-white">
        {/* a slow aurora under the land, then the land being read, then shade behind the words */}
        <div aria-hidden className="ai-aurora-a absolute -right-[12%] -top-[30%] h-[110%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(221,255,128,0.2),rgba(221,255,128,0))]" />
        <div aria-hidden className="ai-aurora-b absolute -bottom-[40%] left-[18%] h-[100%] w-[60%] rounded-full bg-[radial-gradient(closest-side,rgba(3,143,47,0.42),rgba(3,143,47,0))]" />
        <FieldIntelligence />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(1,35,44,0.8)_0%,rgba(1,35,44,0.64)_50%,rgba(1,35,44,0.38)_100%)] lg:bg-[linear-gradient(90deg,rgba(1,35,44,0.9)_0%,rgba(1,35,44,0.74)_36%,rgba(1,35,44,0.28)_50%,rgba(1,35,44,0)_60%)]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#01232C] to-transparent" />
        <div className="container relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div data-ai-avoid>
            <p className="text-sm font-semibold text-lime">AI & Data Intelligence</p>
            <h1 className="mt-3 text-h1 text-white">{aiHero.title}</h1>
            <p className="mt-6 text-lead text-white/80">{aiHero.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#voice-ai" className="btn-lime">See our AI in action</a>
              <Link href="/contact/?topic=partner" className="btn-on-dark">Partner with us</Link>
            </div>
          </div>
          <div data-ai-avoid data-ai-node>
            <AIChatDemo />
          </div>
        </div>
        <p className="absolute bottom-3 right-4 text-[0.72rem] font-semibold text-white/40 md:right-6">Illustration: farm plots read from satellite and field data</p>
      </section>

      <nav aria-label="On this page" className="sticky top-[var(--header-h)] z-30 hidden border-b border-ink/[0.06] bg-[#FFFDF5]/90 backdrop-blur md:block">
        <ul className="container flex gap-1 overflow-x-auto py-2.5">
          {anchors.map((a) => (
            <li key={a.id}>
              <a href={`#${a.id}`} className="block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink-soft hover:bg-leaf-50 hover:text-field">
                {a.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="how-it-works">
        <SectionHead title="How it works" intro={aiFlowIntro} />
        <ol className="grid gap-3 md:grid-cols-5">
          {aiFlow.map((s, i) => (
            <li key={s.id} className="relative">
              <div className={`h-full rounded-[1.5rem] p-6 ${i === aiFlow.length - 1 ? 'bg-field text-white' : 'bg-mint'}`}>
                <p className={`text-sm font-semibold ${i === aiFlow.length - 1 ? 'text-lime' : 'text-field'}`}>Step {i + 1}</p>
                <h3 className={`mt-1 text-h3 ${i === aiFlow.length - 1 ? 'text-white' : ''}`}>{s.title}</h3>
                <p className={`mt-2 text-[0.95rem] ${i === aiFlow.length - 1 ? 'text-white/85' : 'text-ink-soft'}`}>{s.body}</p>
              </div>
              {i < aiFlow.length - 1 && (
                <span aria-hidden className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-field ring-1 ring-ink/10 md:flex">
                  ›
                </span>
              )}
            </li>
          ))}
        </ol>
      </Section>

      <Walkthrough id="voice-ai" name="Bangla Voice AI" kicker="Bangla Voice AI, live in daily operations" intro={voiceAI.body} data={voiceWalk} belowNav />

      <Section id="folon-ai">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <StatusTag status="LIVE" />
            <h2 className="mt-4 text-h2">{folonAI.title}</h2>
            <p className="mt-4 text-lead text-ink-soft">{folonAI.body}</p>
            <div className="mt-8">
              <FolonModes />
            </div>
            <Link href="/product-folon/" className="link mt-8 inline-block">About the Folon app</Link>
          </div>
          <div>
            <h3 className="text-h3">How Folon-AI answers</h3>
            <ol className="mt-5 space-y-3">
              {folonAI.steps.map((s, i) => (
                <li key={s.title} className={`flex gap-4 rounded-2xl p-5 ${i === folonAI.steps.length - 1 ? 'bg-lime' : 'bg-mint'}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-bold text-field" aria-hidden>
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-bold">{s.title}</span>
                    <span className="text-ink-soft">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section id="capabilities" tone="mint">
        <SectionHead title="What our AI does today" intro="Every capability carries its status. Live means it runs in daily operations; pilot means a limited group or region." />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((c) => (
            <li
              key={c.id}
              id={c.id === 'credit' ? undefined : c.id === 'voice-ai' || c.id === 'folon-ai' ? undefined : c.id}
              className={`rounded-[1.5rem] p-6 ring-1 ${c.status === 'IN DEVELOPMENT' ? 'bg-ink/[0.04] ring-ink/[0.06]' : 'bg-white ring-ink/[0.07]'}`}
            >
              <StatusTag status={c.status} />
              <h3 className="mt-4 text-h3">{c.title}</h3>
              <p className="mt-2 text-ink-soft">{c.problem}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="credit">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <StatusTag status="LIVE" />
            <h2 className="mt-4 text-h2">What goes into a farmer profile</h2>
            <p className="mt-4 text-lead text-ink-soft">
              Many farmers have little or no formal credit history. We bring together the signals below into a risk insight. The credit team or lending partner makes the decision.
            </p>
            <Link href="/access-to-finance/" className="link mt-6 inline-block">Access to Finance</Link>
          </div>
          <div className="relative rounded-[2.25rem] bg-cream p-6 md:p-8">
            <ul className="grid gap-3 sm:grid-cols-2">
              {profileInputs.map((p) => (
                <li key={p} className="rounded-2xl bg-white px-4 py-3.5 font-semibold ring-1 ring-ink/[0.06]">{p}</li>
              ))}
            </ul>
            <div className="mx-auto my-4 h-8 w-px bg-ink/25" aria-hidden />
            <div className="rounded-2xl bg-field px-5 py-4 text-center font-bold text-white">Farmer profile → risk insight</div>
            <div className="mx-auto my-4 h-8 w-px bg-ink/25" aria-hidden />
            <div className="rounded-2xl bg-lime px-5 py-4 text-center font-bold">People decide: credit team or lending partner</div>
          </div>
        </div>
      </Section>

      <Section id="responsible-ai" tone="teal">
        <SectionHead dark title={responsibleAI.title} intro={responsibleAI.body} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {responsibleAI.pillars.map((p) => (
            <li key={p.title} className="rounded-[1.5rem] bg-white/[0.06] p-6 ring-1 ring-white/10">
              <h3 className="text-h3 text-white">{p.title}</h3>
              {p.body && <p className="mt-2 text-white/75">{p.body}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="work-with-us">
        <SectionHead title="Work with us" />
        <ul className="grid gap-4 md:grid-cols-3">
          {workWithUs.map((w) => (
            <li key={w.title} className="flex flex-col rounded-[1.75rem] bg-mint p-7">
              <h3 className="text-h3">{w.title}</h3>
              <p className="mt-2 text-ink-soft">{w.body}</p>
              <SmartLink href={w.href} className="btn-primary mt-6 self-start">{w.cta}</SmartLink>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
