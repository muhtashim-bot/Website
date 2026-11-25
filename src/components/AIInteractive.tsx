'use client';

import { useState } from 'react';
import { voiceAI, folonAI } from '@/content/ai';

export function VoiceOutcomes() {
  const [sel, setSel] = useState(voiceAI.outcomes[0].id);
  const o = voiceAI.outcomes.find((x) => x.id === sel)!;
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
      {/* one call → five outcomes */}
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
          {voiceAI.outcomes.map((x, i) => {
            const a = (-90 + i * 72) * (Math.PI / 180);
            const on = x.id === sel;
            return (
              <line key={x.id} x1="200" y1="200" x2={200 + Math.cos(a) * 150} y2={200 + Math.sin(a) * 150} stroke={on ? '#038F2F' : 'rgba(27,42,31,0.15)'} strokeWidth={on ? 3 : 2} strokeDasharray={on ? '0' : '4 6'} />
            );
          })}
          <circle cx="200" cy="200" r="62" fill="#038F2F" />
          <circle cx="200" cy="200" r="78" fill="none" stroke="#88BB41" strokeOpacity="0.5" strokeWidth="2" />
          <text x="200" y="194" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">One Bangla</text>
          <text x="200" y="214" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">conversation</text>
        </svg>
        {voiceAI.outcomes.map((x, i) => {
          const a = (-90 + i * 72) * (Math.PI / 180);
          const on = x.id === sel;
          return (
            <button
              key={x.id}
              type="button"
              aria-pressed={on}
              onClick={() => setSel(x.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-colors ${on ? 'bg-field text-white' : 'bg-white text-ink ring-1 ring-ink/10 hover:ring-field'}`}
              style={{ left: `${50 + Math.cos(a) * 37.5}%`, top: `${50 + Math.sin(a) * 37.5}%` }}
            >
              {i + 1}. {x.title}
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="rounded-[2rem] bg-white p-8 ring-1 ring-ink/[0.07]">
        <p className="kicker">Outcome {voiceAI.outcomes.indexOf(o) + 1} of 5</p>
        <h3 className="mt-1 text-h2">{o.title}</h3>
        <p className="mt-3 text-lg text-ink-soft">{o.body}</p>      </div>
    </div>
  );
}

export function FolonModes() {
  const [m, setM] = useState(folonAI.modes[0].id);
  const mode = folonAI.modes.find((x) => x.id === m)!;
  return (
    <div>
      <div role="tablist" aria-label="Ways to ask Folon-AI" className="inline-flex rounded-full bg-white p-1 ring-1 ring-ink/10">
        {folonAI.modes.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={x.id === m}
            onClick={() => setM(x.id)}
            className={`rounded-full px-5 py-2 font-bold ${x.id === m ? 'bg-field text-white' : 'text-ink hover:text-field'}`}
          >
            {x.title}
          </button>
        ))}
      </div>
      <p role="tabpanel" className="mt-4 text-lg text-ink-soft">{mode.body}</p>
    </div>
  );
}
