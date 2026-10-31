import type { BriefInput, Channel, Goal, StoryRecipe, Workload } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { CHANNELS, DURATIONS, GOALS, STEP_COPY, STORY_RECIPES, TONES, WORKLOADS, type StepId } from '@/lib/briefSteps';

type StepFieldsProps = {
  step: StepId;
  values: Partial<BriefInput>;
  onChange: (patch: Partial<BriefInput>) => void;
};

const TILE_BASE =
  'flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal';

function tileClass(selected: boolean) {
  return `${TILE_BASE} ${selected ? 'border-rose bg-blush shadow-[0_3px_0_rgb(var(--rose-deep))]' : 'border-line bg-surface hover:border-muted'}`;
}

function pillClass(selected: boolean) {
  return `rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
    selected ? 'border-ink bg-ink text-cream' : 'border-line bg-surface text-ink hover:border-muted'
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
                <span className="text-2xl" aria-hidden>
                  {goal.icon}
                </span>
                <span className="mt-1 font-display text-lg font-bold">{goal.label}</span>
              </button>
            ))}
          </div>
          {values.goal && (
            <p className="rise rounded-2xl bg-teal/10 px-4 py-3 text-sm">
              <strong className="text-teal">What this does to your plan:</strong> {GOALS.find((g) => g.value === values.goal)?.hint}
            </p>
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
                className={`${pillClass(on)} inline-flex items-center gap-2`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: channelMeta(channel.value).color }} aria-hidden />
                {channel.label}
              </button>
            );
          })}
        </div>
      );
    }

    case 'tone': {
      const chosen = TONES.find((t) => t.value === values.tone);
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={copy.question}>
            {TONES.map((tone) => (
              <button
                key={tone.value}
                type="button"
                role="radio"
                aria-checked={values.tone === tone.value}
                onClick={() => onChange({ tone: tone.value })}
                className={pillClass(values.tone === tone.value)}
              >
                {tone.value}
              </button>
            ))}
          </div>
          {chosen && (
            <p className="rise rounded-2xl bg-teal/10 px-4 py-3 text-sm">
              <strong className="text-teal">{chosen.hint}</strong> <span className="text-muted">Sounds like: {chosen.sample}</span>
            </p>
          )}
        </div>
      );
    }

    case 'story_recipe': {
      const chosen = STORY_RECIPES.find((r) => r.value === (values.story_recipe ?? 'auto'));
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={copy.question}>
            {STORY_RECIPES.map((recipe) => (
              <button
                key={recipe.value}
                type="button"
                role="radio"
                aria-checked={(values.story_recipe ?? 'auto') === recipe.value}
                onClick={() => onChange({ story_recipe: recipe.value as StoryRecipe })}
                className={pillClass((values.story_recipe ?? 'auto') === recipe.value)}
              >
                {recipe.label}
              </button>
            ))}
          </div>
          {chosen && <p className="rounded-2xl bg-teal/10 px-4 py-3 text-sm">{chosen.hint}</p>}
        </div>
      );
    }
  }
}
