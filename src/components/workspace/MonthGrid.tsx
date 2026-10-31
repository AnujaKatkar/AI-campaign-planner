import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { CalendarItem, Phase } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { phaseForDate, phaseStyle } from '@/lib/phases';
import { addDaysIso, todayIso } from '@/lib/schedule';

type MonthGridProps = {
  startIso: string;
  weeks: number;
  phases: Phase[];
  items: CalendarItem[];
  onOpen: (item: CalendarItem) => void;
  onMove: (item: CalendarItem, iso: string) => void;
  onAdd: (iso: string) => void;
};

export default function MonthGrid({ startIso, weeks, phases, items, onOpen, onMove, onAdd }: MonthGridProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIso, setOverIso] = useState<string | null>(null);
  const today = todayIso();
  const weekdayNames = Array.from({ length: 7 }, (_, d) =>
    new Date(`${addDaysIso(startIso, d)}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
  );

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-line bg-blush/60 text-xs font-bold text-muted">
        <div className="px-2 py-2" />
        {weekdayNames.map((name) => (
          <div key={name} className="px-2 py-2">
            {name}
          </div>
        ))}
      </div>
      {Array.from({ length: weeks }, (_, week) => (
        <div key={week} className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-line last:border-b-0">
          <div className="flex items-start justify-center border-r border-line px-1 py-2 font-mono text-xs font-bold text-muted">
            W{week + 1}
          </div>
          {Array.from({ length: 7 }, (_, day) => {
            const iso = addDaysIso(startIso, week * 7 + day);
            const phase = phaseForDate(phases, iso);
            const style = phase ? phaseStyle(phases.indexOf(phase)) : null;
            const dayItems = items.filter((i) => i.scheduled_on === iso);
            const isOver = overIso === iso && dragId;
            return (
              <div
                key={iso}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setOverIso(iso);
                }}
                onDragLeave={() => setOverIso((v) => (v === iso ? null : v))}
                onDrop={(e) => {
                  e.preventDefault();
                  const item = items.find((i) => i.id === dragId);
                  if (item && item.scheduled_on !== iso) onMove(item, iso);
                  setDragId(null);
                  setOverIso(null);
                }}
                className={`group relative min-h-[6.5rem] border-r border-line p-1.5 last:border-r-0 ${style?.tint ?? ''} ${
                  isOver ? 'ring-2 ring-inset ring-teal' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[11px] ${iso === today ? 'rounded-full bg-rose px-1.5 font-bold text-on-rose' : 'text-muted'}`}
                  >
                    {Number(iso.slice(8))}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdd(iso)}
                    aria-label={`Add a post on ${iso}`}
                    className="rounded-full p-0.5 text-muted opacity-0 transition hover:bg-surface hover:text-ink focus:opacity-100 group-hover:opacity-100"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <ul className="mt-1 space-y-1">
                  {dayItems.map((item) => {
                    const meta = channelMeta(item.channel);
                    const done = item.status === 'done';
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            setDragId(item.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverIso(null);
                          }}
                          onClick={() => onOpen(item)}
                          title={`${meta.label}: ${item.title}`}
                          className={`flex w-full cursor-grab items-center gap-1 truncate rounded-md px-1.5 py-1 text-left text-[11px] font-bold leading-tight text-white active:cursor-grabbing ${
                            done ? 'opacity-55' : ''
                          } ${dragId === item.id ? 'opacity-40' : ''}`}
                          style={{ backgroundColor: meta.color }}
                        >
                          {done && <Check className="h-3 w-3 shrink-0" strokeWidth={3} aria-hidden />}
                          <span className="truncate">{item.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
