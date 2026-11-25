'use client';

import { useState } from 'react';
import { folonAI } from '@/content/ai';

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
