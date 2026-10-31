import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Lock } from 'lucide-react';
import StepFields from '@/components/brief/StepFields';
import { generateCampaign, type BriefInput } from '@/lib/campaigns';
import { STEP_COPY, STEP_IDS, briefStrength, type StepId } from '@/lib/briefSteps';

type BriefWizardProps = {
  signedIn: boolean;
  onNeedAuth: () => void;
  onCreated: (campaignId: string) => void;
  onExit: () => void;
};

const GENERATING_STEPS = [
  'Reading your brief',
  'Finding your big idea',
  'Mapping the four phases',
  'Writing hooks that stop the scroll',
  'Drafting video scripts and copy',
  'Writing the creative brief',
  'Saving it all to your account',
];

const DRAFT_KEY = 'flaunt.briefDraft';

const INITIAL_VALUES: Partial<BriefInput> = {
  duration_weeks: 4,
  workload: 'steady',
  start_date: new Date(Date.now() + 7 * 86_400_000).toLocaleDateString('en-CA'),
  channels: [],
  story_recipe: 'auto',
};

function loadDraft(): { values: Partial<BriefInput>; index: number } {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Start fresh.
  }
  return { values: INITIAL_VALUES, index: 0 };
}

function isStepComplete(step: StepId, values: Partial<BriefInput>): boolean {
  switch (step) {
    case 'business_name':
      return !!values.business_name?.trim();
    case 'business_brief':
      return !!values.business_brief?.trim();
    case 'target_audience':
      return !!values.target_audience?.trim();
    case 'goal':
      return !!values.goal;
    case 'duration':
      return !!values.duration_weeks && !!values.start_date;
    case 'workload':
      return !!values.workload;
    case 'offer':
    case 'story_recipe':
      return true;
    case 'channels':
      return (values.channels?.length ?? 0) > 0;
    case 'tone':
      return !!values.tone;
  }
}

function toBrief(values: Partial<BriefInput>): BriefInput {
  return {
    business_name: values.business_name!.trim(),
    business_brief: values.business_brief!.trim(),
    target_audience: values.target_audience!.trim(),
    goal: values.goal!,
    duration_weeks: values.duration_weeks!,
    start_date: values.start_date!,
    workload: values.workload!,
    offer: values.offer?.trim() || undefined,
    channels: values.channels!,
    tone: values.tone!,
    story_recipe: values.story_recipe ?? 'auto',
  };
}

const STRENGTH_STYLES = ['bg-rose', 'bg-honey', 'bg-sage'];

export default function BriefWizard({ signedIn, onNeedAuth, onCreated, onExit }: BriefWizardProps) {
  const [{ values, index }, setDraft] = useState(loadDraft);
  const [generating, setGenerating] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const setValues = (patch: Partial<BriefInput>) => setDraft((d) => ({ ...d, values: { ...d.values, ...patch } }));
  const setIndex = (fn: (i: number) => number) => setDraft((d) => ({ ...d, index: fn(d.index) }));

  const step = STEP_IDS[index];
  const copy = STEP_COPY[step];
  const isLast = index === STEP_IDS.length - 1;
  const canContinue = isStepComplete(step, values);
  const progress = ((index + (canContinue ? 1 : 0)) / STEP_IDS.length) * 100;
  const strength = briefStrength(values);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, index }));
    } catch {
      // The draft just won't survive a reload.
    }
  }, [values, index]);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => setLineIndex((i) => Math.min(i + 1, GENERATING_STEPS.length - 1)), 2200);
    return () => window.clearInterval(timer);
  }, [generating]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canContinue) return;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    if (!signedIn) {
      onNeedAuth();
      return;
    }
    setError(null);
    setLineIndex(0);
    setGenerating(true);
    try {
      const campaignId = await generateCampaign(toBrief(values));
      sessionStorage.removeItem(DRAFT_KEY);
      onCreated(campaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Your brief is safe; try again.');
      setGenerating(false);
    }
  }

  // Enter advances, even from a multi-line field. Shift+Enter still adds a new line.
  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement).tagName === 'TEXTAREA') {
      e.preventDefault();
      e.currentTarget.requestSubmit();
    }
  }

  if (generating) {
    return (
      <div className="mx-auto flex max-w-xl flex-col px-5 py-16 md:py-24" role="status" aria-live="polite">
        <span className="sticker self-start -rotate-2">Cooking</span>
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Flaunting {values.business_name}…</h1>
        <div className="mt-8 h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-blush">
          <div className="fill-bar h-full rounded-full bg-honey" />
        </div>
        <ol className="mt-8 space-y-3">
          {GENERATING_STEPS.map((line, i) => (
            <li key={line} className={`flex items-center gap-3 transition-opacity ${i > lineIndex ? 'opacity-30' : ''}`}>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  i < lineIndex ? 'border-sage bg-sage text-white' : i === lineIndex ? 'border-honey' : 'border-line'
                }`}
              >
                {i < lineIndex ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : i === lineIndex ? <span className="h-2 w-2 animate-ping rounded-full bg-honey" /> : null}
              </span>
              <span className={i === lineIndex ? 'font-bold' : ''}>{line}…</span>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-muted">Usually 10 to 30 seconds. Good time to stretch.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-5 md:py-12">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={onExit} className="text-sm font-semibold text-muted hover:text-ink">
          Cancel
        </button>
        <p className="font-mono text-sm text-muted">
          {index + 1} of {STEP_IDS.length}
        </p>
      </div>
      <div
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-blush"
        role="progressbar"
        aria-label="Brief progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div className="h-full rounded-full bg-honey transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="card mt-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          <span className="eyebrow">Brief strength</span>
          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((n) => (
              <span key={n} className={`h-2 w-10 rounded-full ${n <= strength.level ? STRENGTH_STYLES[strength.level] : 'bg-blush'}`} />
            ))}
          </div>
          <span className="text-sm font-bold">{strength.label}</span>
        </div>
        {strength.tip && <p className="mt-1.5 text-sm text-teal">Tip: {strength.tip}</p>}

        <h1 className="mt-6 text-3xl font-extrabold md:text-4xl">
          {copy.question}
          {!copy.optional && (
            <span className="text-rose" aria-label="required">
              {' '}
              *
            </span>
          )}
        </h1>
        <p className="mt-2 text-muted">
          <span className="font-semibold text-ink">Why we ask:</span> {copy.why}
        </p>
        <div className="mt-7" key={step}>
          <StepFields step={step} values={values} onChange={setValues} />
        </div>

        {error && (
          <p role="alert" className="mt-6 flex items-start gap-2 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose-deep">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        {isLast && !signedIn && (
          <p className="mt-6 flex items-start gap-2 rounded-2xl bg-blush px-4 py-3 text-sm">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Last step: create a free account so we can save your plan. Your answers stay right here.
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink hover:bg-blush disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">or press Enter</span>
            <button type="submit" disabled={!canContinue} className="btn-press">
              {isLast ? (signedIn ? 'Flaunt it' : 'Save & flaunt it') : copy.optional && !values[step as keyof BriefInput] ? 'Skip' : 'Continue'}{' '}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
