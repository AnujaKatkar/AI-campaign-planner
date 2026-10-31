import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PostCard from '@/components/workspace/PostCard';
import type { CalendarItem, ItemStatus, Phase } from '@/lib/campaigns';
import { addDaysIso, formatMinutes, formatShortDate, weekIndexFor } from '@/lib/schedule';

type CalendarViewProps = {
  startIso: string;
  weeks: number;
  phases: Phase[];
  items: CalendarItem[];
  weekIndex: number;
  onWeekChange: (index: number) => void;
  onStatusChange: (item: CalendarItem, status: ItemStatus) => void;
};

type ViewMode = 'week' | 'list';

function initialMode(): ViewMode {
  return window.matchMedia('(max-width: 639px)').matches ? 'list' : 'week';
}

function phaseForWeek(phases: Phase[], weekStartIso: string): Phase | undefined {
  return phases.find((phase) => phase.starts_on <= weekStartIso && weekStartIso <= phase.ends_on);
}

export default function CalendarView({
  startIso,
  weeks,
  phases,
  items,
  weekIndex,
  onWeekChange,
  onStatusChange,
}: CalendarViewProps) {
  const [mode, setMode] = useState<ViewMode>(initialMode);

  const itemsByWeek = (index: number) => items.filter((item) => weekIndexFor(item.scheduled_on, startIso) === index);
  const weekStart = addDaysIso(startIso, weekIndex * 7);
  const weekEnd = addDaysIso(weekStart, 6);
  const currentPhase = phaseForWeek(phases, weekStart);
  const thisWeek = itemsByWeek(weekIndex);
  const weekMinutes = thisWeek.reduce((sum, item) => sum + (item.est_minutes ?? 0), 0);

  return (
    <section aria-labelledby="calendar-heading" className="mt-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="calendar-heading" className="text-2xl font-extrabold md:text-3xl">
            Your calendar
          </h2>
          <p className="mt-1 text-muted">Tick a post off once it&apos;s live. Each week shows the phase you&apos;re in.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-line bg-white p-1" role="group" aria-label="Calendar view">
          {(['week', 'list'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                mode === value ? 'bg-ink text-white' : 'text-ink hover:bg-blush'
              }`}
            >
              {value === 'week' ? 'This week' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'week' && (
        <div className="mt-8">
          <div className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-sm text-muted">
                Week {weekIndex + 1} of {weeks} · {formatShortDate(weekStart)} to {formatShortDate(weekEnd)}
              </p>
              {currentPhase && (
                <p className="mt-2 text-lg font-bold">
                  {currentPhase.name}
                  {currentPhase.objective && <span className="font-medium text-muted"> · {currentPhase.objective}</span>}
                </p>
              )}
              <p className="mt-1 text-sm text-muted">
                {thisWeek.length} {thisWeek.length === 1 ? 'post' : 'posts'}
                {weekMinutes > 0 && ` · about ${formatMinutes(weekMinutes)} of work`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onWeekChange(weekIndex - 1)}
                disabled={weekIndex === 0}
                aria-label="Previous week"
                className="btn-ghost !px-3"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onWeekChange(weekIndex + 1)}
                disabled={weekIndex >= weeks - 1}
                aria-label="Next week"
                className="btn-ghost !px-3"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>

          {thisWeek.length === 0 ? (
            <div className="mt-6 card p-8 text-center">
              <p className="font-semibold">Nothing scheduled this week.</p>
              <p className="mt-1 text-muted">Use the arrows to find your next post.</p>
            </div>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {thisWeek.map((item) => (
                <PostCard key={item.id} item={item} onStatusChange={(status) => onStatusChange(item, status)} />
              ))}
            </ul>
          )}
        </div>
      )}

      {mode === 'list' && (
        <div className="mt-8 flex flex-col gap-10">
          {Array.from({ length: weeks }, (_, index) => index)
            .filter((index) => itemsByWeek(index).length > 0)
            .map((index) => {
              const start = addDaysIso(startIso, index * 7);
              const phase = phaseForWeek(phases, start);
              return (
                <div key={index}>
                  <h3 className="text-xl font-extrabold">
                    Week {index + 1}
                    <span className="ml-2 font-mono text-sm font-medium text-muted">
                      {formatShortDate(start)} to {formatShortDate(addDaysIso(start, 6))}
                    </span>
                  </h3>
                  {phase && <p className="mt-1 text-muted">{phase.name}</p>}
                  <ul className="mt-4 flex flex-col gap-4">
                    {itemsByWeek(index).map((item) => (
                      <PostCard key={item.id} item={item} onStatusChange={(status) => onStatusChange(item, status)} />
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
