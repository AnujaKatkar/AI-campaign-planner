import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import CalendarView from '@/components/workspace/CalendarView';
import PhaseRibbon from '@/components/workspace/PhaseRibbon';
import {
  GENERIC_ERROR,
  getCampaignDetail,
  setItemStatus,
  type CalendarItem,
  type CampaignDetail,
  type ItemStatus,
} from '@/lib/campaigns';
import { currentWeekIndex, weekIndexFor } from '@/lib/schedule';

type CampaignWorkspaceProps = {
  campaignId: string;
  onBack: () => void;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; campaign: CampaignDetail };

export default function CampaignWorkspace({ campaignId, onBack }: CampaignWorkspaceProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [weekIndex, setWeekIndex] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getCampaignDetail(campaignId)
      .then((campaign) => {
        if (!active) return;
        setWeekIndex(currentWeekIndex(campaign.start_date, campaign.duration_weeks));
        setState({ status: 'ready', campaign });
      })
      .catch(() => {
        if (active) setState({ status: 'error', message: GENERIC_ERROR });
      });
    return () => {
      active = false;
    };
  }, [campaignId, reloadKey]);

  function patchItem(itemId: string, status: ItemStatus) {
    setState((prev) =>
      prev.status === 'ready'
        ? {
            status: 'ready',
            campaign: {
              ...prev.campaign,
              items: prev.campaign.items.map((item) => (item.id === itemId ? { ...item, status } : item)),
            },
          }
        : prev,
    );
  }

  async function handleStatusChange(item: CalendarItem, status: ItemStatus) {
    setSaveError(null);
    patchItem(item.id, status);
    try {
      await setItemStatus(item.id, status);
    } catch {
      patchItem(item.id, item.status);
      setSaveError("Couldn't save that change. Check your connection and try again.");
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-5 py-24 text-muted" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Opening your campaign...
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <BackLink onBack={onBack} />
        <div className="mt-8 card flex flex-col items-start gap-4 p-8">
          <p role="alert" className="flex items-start gap-2 font-semibold text-rose-deep">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {state.message}
          </p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn-ghost">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { campaign } = state;
  const total = campaign.items.length;
  const done = campaign.items.filter((item) => item.status === 'done').length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const thisWeekItems = campaign.items.filter(
    (item) => weekIndexFor(item.scheduled_on, campaign.start_date) === weekIndex,
  );
  const weekDone = thisWeekItems.filter((item) => item.status === 'done').length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <BackLink onBack={onBack} />

      <header className="mt-6 card p-6 md:p-10">
        <p className="font-mono text-sm uppercase tracking-wide text-muted">Campaign</p>
        <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">{campaign.name}</h1>
        {campaign.big_idea && <p className="mt-4 max-w-3xl text-lg">{campaign.big_idea}</p>}
        {campaign.tagline && <p className="mt-2 text-muted">&ldquo;{campaign.tagline}&rdquo;</p>}

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <PhaseRibbon phases={campaign.phases} startIso={campaign.start_date} weeks={campaign.duration_weeks} />
          </div>
          <div className="flex flex-col gap-3 md:w-72">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold">Heat</span>
              <span className="font-mono text-muted">{percent}% posted</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-blush"
              role="progressbar"
              aria-label="Campaign posted progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div className="h-full rounded-full bg-honey transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="self-start rounded-full bg-blush px-3 py-1 text-sm font-semibold">
              Week {weekIndex + 1}: {weekDone} of {thisWeekItems.length} posted
            </p>
          </div>
        </div>
      </header>

      {saveError && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose-deep">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {saveError}
        </p>
      )}

      <CalendarView
        startIso={campaign.start_date}
        weeks={campaign.duration_weeks}
        phases={campaign.phases}
        items={campaign.items}
        weekIndex={weekIndex}
        onWeekChange={setWeekIndex}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" aria-hidden /> All campaigns
    </button>
  );
}
