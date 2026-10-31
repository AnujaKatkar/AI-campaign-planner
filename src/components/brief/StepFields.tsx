import type { BriefInput, Channel, Goal, Workload } from '@/lib/campaigns';
import { CHANNELS, DURATIONS, GOALS, STEP_COPY, TONES, WORKLOADS, type StepId } from '@/lib/briefSteps';

type StepFieldsProps = {
  step: StepId;
  values: Partial<BriefInput>;
  onChange: (patch: Partial<BriefInput>) => void;
};

const TILE_BASE =
  'flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal';

function tileClass(selected: boolean) {
  return `${TILE_BASE} ${selected ? 'border-rose bg-blush' : 'border-line bg-white hover:border-muted'}`;
}

function pillClass(selected: boolean) {
  return `rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
    selected ? 'border-ink bg-ink text-cream' : 'border-line bg-white text-ink hover:border-muted'
  }`;
}

export default function StepFields({ step, values, onChange }: StepFieldsProps) {
  const copy = STEP_COPY[step];

  switch (step) {
    case 'business_name':
    case 'offer':
      return (
        <input
          type="text"
          autoFocus
          value={(values[step] as string | undefined) ?? ''}
          onChange={(e) => onChange({ [step]: e.target.value })}
          placeholder={copy.placeholder}
          aria-label={copy.question}
          className="field text-lg"
        />
      );

    case 'business_brief':
    case 'target_audience':
      return (
        <textarea
          autoFocus
          rows={3}
          value={(values[step] as string | undefined) ?? ''}
          onChange={(e) => onChange({ [step]: e.target.value })}
          placeholder={copy.placeholder}
          aria-label={copy.question}
          className="field text-lg"
        />
      );

    case 'goal':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3" role="radiogroup" aria-label={copy.question}>
            {GOALS.map((goal) => (
              <button
                key={goal.value}
                type="button"
                role="radio"
                aria-checked={values.goal === goal.value}
                onClick={() => onChange({ goal: goal.value as Goal })}
                className={tileClass(values.goal === goal.value)}
              >
                <span className="font-display text-lg font-bold">{goal.label}</span>
              </button>
            ))}
          </div>
          {values.goal && (
            <p className="text-muted">{GOALS.find((g) => g.value === values.goal)?.hint}</p>
          )}
        </div>
      );

    case 'duration':
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Campaign length in weeks">
            {DURATIONS.map((weeks) => (
              <button
                key={weeks}
                type="button"
                role="radio"
                aria-checked={values.duration_weeks === weeks}
                onClick={() => onChange({ duration_weeks: weeks })}
                className={pillClass(values.duration_weeks === weeks)}
              >
                {weeks} weeks
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="start-date" className="mb-2 block text-sm font-semibold">
              Start date
            </label>
            <input
              id="start-date"
              type="date"
              value={values.start_date ?? ''}
              onChange={(e) => onChange({ start_date: e.target.value })}
              className="field max-w-xs font-mono"
            />
          </div>
        </div>
      );

    case 'workload':
      return (
        <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label={copy.question}>
          {WORKLOADS.map((level) => (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={values.workload === level.value}
              onClick={() => onChange({ workload: level.value as Workload })}
              className={tileClass(values.workload === level.value)}
            >
              <span className="font-display text-lg font-bold">{level.label}</span>
              <span className="mt-1 text-sm text-muted">{level.hint}</span>
            </button>
          ))}
        </div>
      );

    case 'channels': {
      const selected = values.channels ?? [];
      return (
        <div className="flex flex-wrap gap-2" role="group" aria-label={copy.question}>
          {CHANNELS.map((channel) => {
            const on = selected.includes(channel.value);
            return (
              <button
                key={channel.value}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const next = on
                    ? selected.filter((c) => c !== channel.value)
                    : [...selected, channel.value as Channel];
                  onChange({ channels: next });
                }}
                className={pillClass(on)}
              >
                {channel.label}
              </button>
            );
          })}
        </div>
      );
    }

    case 'tone':
      return (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={copy.question}>
          {TONES.map((tone) => (
            <button
              key={tone}
              type="button"
              role="radio"
              aria-checked={values.tone === tone}
              onClick={() => onChange({ tone })}
              className={pillClass(values.tone === tone)}
            >
              {tone}
            </button>
          ))}
        </div>
      );
  }
}
