import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import StepFields from '@/components/brief/StepFields';
import { generateCampaign, type BriefInput } from '@/lib/campaigns';
import { STEP_COPY, STEP_IDS, type StepId } from '@/lib/briefSteps';

type BriefWizardProps = {
  onCreated: (campaignId: string) => void;
  onExit: () => void;
};

const GENERATING_LINES = [
  'Finding your big idea...',
  'Mapping the four phases...',
  'Writing hooks that stop the scroll...',
  'Drafting ad scripts and copy...',
  'Writing the creative brief...',
];

const INITIAL_VALUES: Partial<BriefInput> = {
  duration_weeks: 4,
  workload: 'steady',
  start_date: new Date(Date.now() + 7 * 86_400_000).toLocaleDateString('en-CA'),
  channels: [],
};

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
  };
}

export default function BriefWizard({ onCreated, onExit }: BriefWizardProps) {
  const [values, setValues] = useState<Partial<BriefInput>>(INITIAL_VALUES);
  const [index, setIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const step = STEP_IDS[index];
  const copy = STEP_COPY[step];
  const isLast = index === STEP_IDS.length - 1;
  const canContinue = isStepComplete(step, values);
  const progress = ((index + (canContinue ? 1 : 0)) / STEP_IDS.length) * 100;

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % GENERATING_LINES.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [generating]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canContinue) return;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const campaignId = await generateCampaign(toBrief(values));
      onCreated(campaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center" role="status" aria-live="polite">
        <Loader2 className="h-10 w-10 animate-spin text-rose" aria-hidden />
        <h1 className="mt-8 text-4xl font-extrabold">Flaunting your campaign</h1>
        <p className="mt-4 min-h-[1.5rem] text-lg text-muted">{GENERATING_LINES[lineIndex]}</p>
        <div className="mt-10 h-3 w-full overflow-hidden rounded-full bg-blush">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-honey" />
        </div>
        <p className="mt-4 text-sm text-muted">This usually takes 10 to 30 seconds.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={onExit} className="text-sm font-semibold text-muted hover:text-ink">
          Cancel
        </button>
        <p className="font-mono text-sm text-muted">
          {index + 1} of {STEP_IDS.length}
        </p>
      </div>
      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-blush"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div className="h-full rounded-full bg-honey transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <form onSubmit={handleSubmit} className="mt-12 card p-8">
        <h1 className="text-3xl font-extrabold md:text-4xl">
          {copy.question}
          {!copy.optional && <span className="text-rose" aria-hidden> *</span>}
        </h1>
        <p className="mt-3 text-muted">{copy.why}</p>
        <div className="mt-8">
          <StepFields step={step} values={values} onChange={(patch) => setValues((v) => ({ ...v, ...patch }))} />
        </div>

        {error && (
          <p role="alert" className="mt-6 flex items-start gap-2 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose-deep">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink hover:bg-blush disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </button>
          <button type="submit" disabled={!canContinue} className="btn-press">
            {isLast ? 'Flaunt it' : 'Continue'} <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}
