import type { Phase } from '@/lib/campaigns';
import { phaseStyle } from '@/lib/phases';
import { formatShortDate, toDayNumber, todayIso } from '@/lib/schedule';

type PhaseRibbonProps = {
  phases: Phase[];
  startIso: string;
  weeks: number;
};

export default function PhaseRibbon({ phases, startIso, weeks }: PhaseRibbonProps) {
  const totalDays = weeks * 7;
  const startDay = toDayNumber(startIso);
  const todayOffset = toDayNumber(todayIso()) - startDay;
  const showToday = todayOffset >= 0 && todayOffset < totalDays;

  return (
    <div>
      <div className="relative h-5 w-full overflow-hidden rounded-full border-2 border-ink bg-surface" aria-hidden>
        {phases.map((phase, index) => {
          const from = toDayNumber(phase.starts_on) - startDay;
          const length = toDayNumber(phase.ends_on) - toDayNumber(phase.starts_on) + 1;
          return (
            <div
              key={phase.id}
              className={`absolute inset-y-0 border-r-2 border-ink last:border-r-0 ${phaseStyle(index).dot}`}
              style={{ left: `${(from / totalDays) * 100}%`, width: `${(length / totalDays) * 100}%` }}
            />
          );
        })}
        {showToday && (
          <div className="absolute inset-y-0 w-1 bg-ink" style={{ left: `${(todayOffset / totalDays) * 100}%` }} />
        )}
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {phases.map((phase, index) => (
          <li key={phase.id} className="flex items-start gap-2.5">
            <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border border-ink ${phaseStyle(index).dot}`} aria-hidden />
            <div className="min-w-0">
              <p className="font-bold leading-snug">{phase.name}</p>
              <p className="font-mono text-xs text-muted">
                {formatShortDate(phase.starts_on)} – {formatShortDate(phase.ends_on)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {showToday && <p className="sr-only">Today is day {todayOffset + 1} of {totalDays}.</p>}
    </div>
  );
}
