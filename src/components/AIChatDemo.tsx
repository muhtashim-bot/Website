'use client';

/*
 * AI & Data hero: a farmer's question being resolved, step by step. A voice note in Bangla comes
 * in, the AI works through it (what was asked, the farmer's field, weather and satellite, the
 * agronomist-reviewed knowledge base) and answers in Bangla, and the conversation turns into
 * services. Two conversations alternate. Illustrative, not a product screenshot.
 */
import { useEffect, useState } from 'react';

type Step = { label: string; chips: string[] };
type Convo = {
  id: string;
  question: { bn: string; en: string };
  steps: Step[];
  answer: { bn: string; en: string };
  outcomes: string[];
};

const convos: Convo[] = [
  {
    id: 'advice',
    question: { bn: 'ধানের পাতায় বাদামি দাগ পড়েছে, কী করব?', en: 'There are brown spots on my rice leaves. What should I do?' },
    steps: [
      { label: 'Understood the question', chips: ['Crop: rice', 'Stage: tillering', 'Issue: brown leaf spots'] },
      { label: 'Checked the farmer’s profile and field', chips: ['Field on record', 'Sown five weeks ago'] },
      { label: 'Read weather and satellite for the field', chips: ['Rain expected', 'Patchy crop stress'] },
      { label: 'Searched the agronomist-reviewed knowledge base', chips: ['Brown spot guidance'] },
    ],
    answer: {
      bn: 'এটি সম্ভবত বাদামি দাগ রোগ। জমির জন্য সঠিক মাত্রায় পটাশ সার দিন। তিন দিনে না কমলে ছবি পাঠান।',
      en: 'This is likely brown spot. Apply potash at the right rate for your field. If it has not eased in three days, send a photo.',
    },
    outcomes: ['Advice sent in Bangla', 'Potash at the nearest KriShop shop', 'Agronomist follow-up if needed'],
  },
  {
    id: 'sell',
    question: { bn: 'এবার চল্লিশ মণ আলু বিক্রি করতে চাই।', en: 'This season I want to sell forty maunds of potatoes.' },
    steps: [
      { label: 'Understood the intent', chips: ['Crop: potato', 'Volume: 40 maunds', 'Intent: sell'] },
      { label: 'Checked the farmer’s profile and field', chips: ['Harvest in three weeks', 'Location on record'] },
      { label: 'Matched buyer demand', chips: ['Open buyer orders', 'Quality standard'] },
      { label: 'Planned collection', chips: ['Nearest iFarmer Center'] },
    ],
    answer: {
      bn: 'ধন্যবাদ! ফসল তোলার আগে ক্রেতার অফার আপনার ফলন অ্যাপে পাঠানো হবে।',
      en: 'Thank you! A buyer offer will reach your Folon app before harvest.',
    },
    outcomes: ['Added to the procurement plan', 'Buyer match on Supplier Connect', 'Farmer profile updated'],
  },
];

// timeline of one conversation, in steps of the `phase` counter
const PHASES = { listen: 0, transcript: 1, think: 2, step0: 3, answer: 7, outcomes: 8, hold: 9 };
const DELAYS = [1300, 900, 600, 800, 800, 800, 800, 900, 4800, 500];

export function AIChatDemo() {
  const [c, setC] = useState(0);
  const [phase, setPhase] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true);
      setPhase(PHASES.hold);
      return;
    }
    const t = window.setTimeout(() => {
      if (phase >= PHASES.hold) {
        setPhase(0);
        setC((x) => (x + 1) % convos.length);
      } else setPhase((p) => p + 1);
    }, DELAYS[phase] ?? 800);
    return () => window.clearTimeout(t);
  }, [phase]);

  const convo = convos[c];
  const status = phase < PHASES.think ? 'Listening' : phase < PHASES.answer ? 'Resolving' : 'Answered';
  const stepState = (i: number) => (phase > PHASES.step0 + i ? 'done' : phase === PHASES.step0 + i ? 'working' : 'waiting');

  return (
    <figure className="relative">
      <div aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_60%_40%,rgba(221,255,128,0.14),transparent)]" />
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#06323c] ring-1 ring-lime/20 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8),0_0_0_6px_rgba(221,255,128,0.04)]">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime text-[0.72rem] font-bold text-teal">AI</span>
          <div className="min-w-0">
            <p className="text-[0.95rem] font-bold leading-tight text-white">Folon-AI with Bangla Voice AI</p>
            <p className="text-[0.75rem] font-semibold text-white/55">A farmer’s question, resolved</p>
          </div>
          <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${status === 'Answered' ? 'bg-lime text-teal' : 'bg-white/10 text-lime'}`} aria-live="polite">
            {status !== 'Answered' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />}
            {status}
          </span>
        </div>

        <div key={convo.id + (reduced ? 'r' : '')} className="min-h-[540px] space-y-3.5 p-5 sm:min-h-[590px]">
          {/* the farmer's voice note */}
          <div className="ai-in flex justify-end">
            <div className="max-w-[86%] rounded-2xl rounded-br-md bg-white/10 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path d="M3 1.8v8.4L10.2 6z" fill="#022B36" />
                  </svg>
                </span>
                <span className="flex h-6 items-center gap-[3px]" aria-hidden>
                  {Array.from({ length: 22 }, (_, i) => (
                    <span key={i} className={`w-[3px] rounded-full bg-lime/80 ${phase <= PHASES.transcript && !reduced ? 'ai-wave' : ''}`} style={{ height: `${30 + ((i * 37) % 60)}%`, animationDelay: `${(i % 7) * 90}ms` }} />
                  ))}
                </span>
                <span className="text-[0.72rem] font-semibold text-white/60">0:06</span>
              </div>
              {phase >= PHASES.transcript && (
                <div className="ai-in mt-2.5">
                  <p lang="bn" className="text-[0.98rem] font-semibold leading-snug text-white">{convo.question.bn}</p>
                  <p className="mt-1 text-[0.78rem] leading-snug text-white/60">{convo.question.en}</p>
                </div>
              )}
            </div>
          </div>

          {/* the AI resolving it */}
          {phase >= PHASES.think && (
            <div className="ai-in rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <ol className="space-y-2.5">
                {convo.steps.map((s, i) => {
                  const st = stepState(i);
                  return (
                    <li key={s.label} className={`transition-opacity duration-300 ${st === 'waiting' ? 'opacity-35' : 'opacity-100'}`}>
                      <div className="flex items-center gap-2.5">
                        {st === 'done' ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime">
                            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                              <path d="m2 5.2 2 2L8 3" stroke="#022B36" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        ) : st === 'working' ? (
                          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-lime/25 border-t-lime" aria-hidden />
                        ) : (
                          <span className="h-5 w-5 shrink-0 rounded-full border-2 border-white/20" aria-hidden />
                        )}
                        <span className="text-[0.86rem] font-semibold text-white/90">{s.label}</span>
                      </div>
                      {st === 'done' && (
                        <div className="ai-in ml-[30px] mt-1.5 flex flex-wrap gap-1.5">
                          {s.chips.map((ch) => (
                            <span key={ch} className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[0.72rem] font-semibold text-lime/90">
                              {ch}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* the answer, in Bangla */}
          {phase >= PHASES.answer && (
            <div className="ai-in max-w-[90%] rounded-2xl rounded-bl-md bg-lime px-4 py-3 text-teal">
              <p lang="bn" className="text-[0.95rem] font-semibold leading-snug">{convo.answer.bn}</p>
              <p className="mt-1 text-[0.78rem] leading-snug text-teal/70">{convo.answer.en}</p>
            </div>
          )}

          {/* what the conversation turned into */}
          {phase >= PHASES.outcomes && (
            <ul className="ai-in flex flex-wrap gap-2">
              {convo.outcomes.map((o) => (
                <li key={o} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[0.75rem] font-bold text-teal">
                  <span className="h-1.5 w-1.5 rounded-full bg-field" />
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[0.75rem] text-white/45">Illustrative conversation</figcaption>
    </figure>
  );
}
