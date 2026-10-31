import type { Phase } from '@/lib/campaigns';
import { formatShortDate, toDayNumber } from '@/lib/schedule';

const PHASE_COLORS = ['bg-rose', 'bg-honey', 'bg-teal', 'bg-sage'];

type PhaseRibbonProps = {
  phases: Phase[];
  startIso: string;
  weeks: number;
};

export default function PhaseRibbon({ phases, startIso, weeks }: PhaseRibbonProps) {
  const totalDays = weeks * 7;
  const startDay = toDayNumber(startIso);

  return (
    <div>
      <div className="relative h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-white" aria-hidden>
        {phases.map((phase, index) => {
          const from = toDayNumber(phase.starts_on) - startDay;
          const length = toDayNumber(phase.ends_on) - toDayNumber(phase.starts_on) + 1;
          return (
            <div
              key={phase.id}
              className={`absolute inset-y-0 ${PHASE_COLORS[index % PHASE_COLORS.length]}`}
              style={{ left: `${(from / totalDays) * 100}%`, width: `${(length / totalDays) * 100}%` }}
            />
          );
        })}
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {phases.map((phase, index) => (
          <li key={phase.id} className="flex items-start gap-3">
            <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${PHASE_COLORS[index % PHASE_COLORS.length]}`} aria-hidden />
            <div>
              <p className="font-bold leading-snug">{phase.name}</p>
              <p className="font-mono text-xs text-muted">
                {formatShortDate(phase.starts_on)} to {formatShortDate(phase.ends_on)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
