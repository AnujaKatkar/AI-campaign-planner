import { useState } from 'react';
import { X } from 'lucide-react';

const KEY = 'flaunt.coachDismissed';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export default function CoachCard() {
  const [hidden, setHidden] = useState(wasDismissed);
  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // It will simply show again next visit.
    }
  }

  const tips = [
    ['The big card', 'Your campaign’s name, big idea and Heat: the share of posts you’ve ticked as Posted.'],
    ['The phase strip', 'Four coloured stages from teasing to closing. The thin line marks today.'],
    ['The tabs', 'Calendar is where you work each week. Results adds up what you log. The rest is ready-made words.'],
  ];

  return (
    <aside className="rise relative mt-6 rounded-card border-2 border-ink bg-teal/10 p-5 shadow-sticker" aria-label="New here?">
      <button type="button" onClick={dismiss} className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-surface" aria-label="Dismiss tips">
        <X className="h-4 w-4" aria-hidden />
      </button>
      <p className="font-display text-xl font-extrabold">New here? Here&apos;s the 20-second tour.</p>
      <ol className="mt-3 grid gap-4 md:grid-cols-3">
        {tips.map(([title, body], i) => (
          <li key={title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal font-mono text-sm font-bold text-cream">{i + 1}</span>
            <p className="text-sm">
              <strong>{title}.</strong> {body}
            </p>
          </li>
        ))}
      </ol>
      <button type="button" onClick={dismiss} className="btn-soft mt-4">
        Got it, let&apos;s post
      </button>
    </aside>
  );
}
