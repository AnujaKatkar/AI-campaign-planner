import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, PlayCircle, Plus } from 'lucide-react';
import { GENERIC_ERROR, listCampaigns, type CampaignSummary } from '@/lib/campaigns';
import { GOALS } from '@/lib/briefSteps';

type CampaignLibraryProps = {
  onStart: () => void;
  onSample: () => void;
  onOpen: (campaignId: string) => void;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; campaigns: CampaignSummary[] };

function formatStart(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function goalLabel(goal: CampaignSummary['goal']): string {
  return GOALS.find((g) => g.value === goal)?.label ?? goal;
}

export default function CampaignLibrary({ onStart, onSample, onOpen }: CampaignLibraryProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    listCampaigns()
      .then((campaigns) => {
        if (active) setState({ status: 'ready', campaigns });
      })
      .catch(() => {
        if (active) setState({ status: 'error', message: GENERIC_ERROR });
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Your library</p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-6xl">Your campaigns</h1>
        </div>
        <button type="button" onClick={onStart} className="btn-press self-start md:self-auto">
          <Plus className="h-5 w-5" aria-hidden /> New campaign
        </button>
      </div>

      {state.status === 'loading' && (
        <div className="mt-16 flex items-center justify-center gap-3 text-muted" role="status">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Loading your campaigns...
        </div>
      )}

      {state.status === 'error' && (
        <div className="mt-12 card flex flex-col items-start gap-4 p-8">
          <p role="alert" className="flex items-start gap-2 font-semibold text-rose-deep">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {state.message}
          </p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn-ghost">
            Try again
          </button>
        </div>
      )}

      {state.status === 'ready' && state.campaigns.length === 0 && (
        <div className="mt-12 card flex flex-col items-start gap-4 p-10">
          <span className="sticker -rotate-2">Empty, for now</span>
          <h2 className="text-3xl font-extrabold">Nothing saved yet. Let&apos;s fix that.</h2>
          <p className="max-w-md text-muted">Answer a few questions and your first campaign will show up here, ready to post.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onStart} className="btn-press">
              Flaunt your first campaign
            </button>
            <button type="button" onClick={onSample} className="btn-ghost">
              <PlayCircle className="h-5 w-5" aria-hidden /> Peek at a sample
            </button>
          </div>
        </div>
      )}

      {state.status === 'ready' && state.campaigns.length > 0 && (
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {state.campaigns.map((campaign) => {
            const percent = campaign.total_items > 0 ? Math.round((campaign.done_items / campaign.total_items) * 100) : 0;
            const pill = statusPill(campaign, percent);
            return (
              <li key={campaign.id}>
                <button
                  type="button"
                  onClick={() => onOpen(campaign.id)}
                  className="card flex h-full w-full items-start gap-5 p-6 text-left transition hover:-translate-y-0.5 hover:border-muted hover:shadow-lift"
                >
                  <ProgressRing percent={percent} label={`${campaign.name}: ${percent}% posted`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`pill ${pill.className}`}>{pill.label}</span>
                      <span className="pill bg-blush text-ink">{goalLabel(campaign.goal)}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-extrabold leading-snug">{campaign.name}</h2>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {formatStart(campaign.start_date)} · {campaign.duration_weeks} weeks
                    </p>
                    <p className="mt-3 text-sm font-semibold">
                      {campaign.done_items} of {campaign.total_items} posted
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function statusPill(c: CampaignSummary, percent: number): { label: string; className: string } {
  const end = new Date(`${c.start_date}T00:00:00`);
  end.setDate(end.getDate() + c.duration_weeks * 7);
  const now = new Date();
  if (percent === 100 || c.status === 'complete') return { label: 'Flaunted', className: 'bg-sage text-white' };
  if (now < new Date(`${c.start_date}T00:00:00`)) return { label: 'Starts soon', className: 'bg-teal/15 text-teal' };
  if (now > end) return { label: 'Wrapped', className: 'bg-ink text-cream' };
  return { label: 'Live', className: 'bg-rose text-on-rose' };
}

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0" role="img" aria-label={label}>
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8" className="stroke-blush" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (percent / 100) * c}
          className="stroke-honey transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">{percent}%</span>
    </div>
  );
}
