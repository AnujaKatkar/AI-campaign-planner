import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { GENERIC_ERROR, listCampaigns, type CampaignSummary } from '@/lib/campaigns';
import { GOALS } from '@/lib/briefSteps';

type CampaignLibraryProps = {
  onStart: () => void;
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

export default function CampaignLibrary({ onStart, onOpen }: CampaignLibraryProps) {
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
          <p className="font-mono text-sm uppercase tracking-wide text-muted">Your library</p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">Your campaigns</h1>
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
          <h2 className="text-2xl font-extrabold">Nothing saved yet.</h2>
          <p className="max-w-md text-muted">Answer a few questions and your first campaign will show up here.</p>
          <button type="button" onClick={onStart} className="btn-press">
            Flaunt your first campaign
          </button>
        </div>
      )}

      {state.status === 'ready' && state.campaigns.length > 0 && (
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {state.campaigns.map((campaign) => {
            const percent = campaign.total_items > 0 ? Math.round((campaign.done_items / campaign.total_items) * 100) : 0;
            return (
              <li key={campaign.id}>
                <button
                  type="button"
                  onClick={() => onOpen(campaign.id)}
                  className="card flex h-full w-full flex-col gap-5 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold leading-snug">{campaign.name}</h2>
                  <span className="shrink-0 rounded-full bg-blush px-3 py-1 text-xs font-bold text-ink">
                    {goalLabel(campaign.goal)}
                  </span>
                </div>
                <p className="font-mono text-sm text-muted">
                  {formatStart(campaign.start_date)} · {campaign.duration_weeks} weeks
                </p>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {campaign.done_items} of {campaign.total_items} posted
                    </span>
                    <span className="font-mono text-muted">{percent}%</span>
                  </div>
                  <div
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-blush"
                    role="progressbar"
                    aria-label={`${campaign.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                  >
                    <div className="h-full rounded-full bg-sage transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
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
