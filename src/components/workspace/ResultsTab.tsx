import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Info, Loader2, MousePointerClick, Send, Sparkles, TrendingDown, Users } from 'lucide-react';
import ChannelChip from '@/components/ChannelChip';
import { askNextWeek, type CampaignDetail } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { postTypeFor } from '@/lib/postTypes';
import { computeResults, type GoalStatus, type Metric } from '@/lib/results';

type ResultsTabProps = {
  campaign: CampaignDetail;
  isSample: boolean;
  onTarget: (target: number) => void;
  onOpenItem: (id: string) => void;
  onGoToCalendar: () => void;
};

const STATUS: Record<GoalStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  not_started: { label: 'Not started', icon: Clock, className: 'bg-blush text-ink' },
  on_track: { label: 'On track', icon: CheckCircle2, className: 'bg-sage text-white' },
  at_risk: { label: 'At risk', icon: AlertTriangle, className: 'bg-honey text-espresso' },
  behind: { label: 'Behind', icon: TrendingDown, className: 'bg-rose text-on-rose' },
};

const fmt = (n: number) => n.toLocaleString();

export default function ResultsTab({ campaign, isSample, onTarget, onOpenItem, onGoToCalendar }: ResultsTabProps) {
  const r = computeResults(campaign);
  const [metric, setMetric] = useState<Metric>('conversions');
  const [weekTable, setWeekTable] = useState(false);
  const [advice, setAdvice] = useState<string[] | null>(null);
  const [asking, setAsking] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const status = STATUS[r.status];
  const channels = r.byChannel(metric);
  const maxChannel = Math.max(1, ...channels.map((c) => c.value));
  const maxWeek = Math.max(1, ...r.byWeek.map((w) => w.planned));
  const metricLabel = metric === 'conversions' ? r.goalLabel : metric === 'reach' ? 'People reached' : 'Clicks';

  async function ask() {
    setAsking(true);
    setAdviceError(null);
    try {
      setAdvice(
        await askNextWeek(campaign, {
          goal: r.goalLabel,
          target: r.target,
          conversions: r.conversions,
          posted: r.posted,
          total: r.total,
          by_channel: r.byChannel('conversions').map(({ label, value, posts }) => ({ label, value, posts })),
          working: r.working,
        }),
      );
    } catch (err) {
      setAdviceError(err instanceof Error ? err.message : 'Couldn’t reach the AI. Try again.');
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="space-y-6">
      {isSample && (
        <p className="flex items-start gap-2 rounded-2xl border-2 border-honey bg-honey/20 px-4 py-3 text-sm font-semibold">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Sample campaign: these results are made-up examples so you can see how the Results tab works. In your own campaign,
          every number comes from what you type into “How did it do?” on each post.
        </p>
      )}

      <section className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Goal</p>
            <p className="mt-1 font-display text-4xl font-extrabold">
              {fmt(r.conversions)}
              <span className="text-xl text-muted">
                {' '}
                / <TargetInput value={r.target} onChange={onTarget} /> {r.goalLabel.toLowerCase()}
              </span>
            </p>
          </div>
          <span className={`pill self-start !px-3 !py-1.5 !text-sm ${status.className}`}>
            <status.icon className="h-4 w-4" aria-hidden /> {status.label}
          </span>
        </div>
        <div className="relative mt-5">
          <div
            className="h-4 overflow-hidden rounded-full border-2 border-ink bg-blush"
            role="progressbar"
            aria-label={`${r.goalLabel} toward goal`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(r.goalPct * 100)}
          >
            <div className="h-full bg-sage transition-all duration-500" style={{ width: `${Math.min(100, r.goalPct * 100)}%` }} />
          </div>
          <div className="absolute -top-1.5 h-7 w-1 rounded-full bg-ink" style={{ left: `calc(${Math.min(100, r.postsPct * 100)}% - 2px)` }} aria-hidden />
        </div>
        <p className="mt-3 text-sm text-muted">
          {Math.round(r.goalPct * 100)}% of your goal, with {Math.round(r.postsPct * 100)}% of posts done (the upright marker).
          {r.status !== 'not_started' && ' On track means your goal is keeping pace with your posting.'}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Send} label="Posted" value={`${r.posted} of ${r.total}`} />
        <Stat icon={Users} label="People reached" value={fmt(r.reach)} />
        <Stat icon={MousePointerClick} label="Clicks" value={fmt(r.clicks)} />
      </div>

      {r.logged === 0 && (
        <div className="card flex flex-col items-start gap-3 p-6">
          <p className="font-bold">No results logged yet.</p>
          <p className="text-muted">Tick a post as Posted, then open it and fill in “How did it do?” a few days later.</p>
          <button type="button" className="btn-soft" onClick={onGoToCalendar}>
            Go to the calendar
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-extrabold">Planned vs posted, by week</h3>
            <div className="seg" role="group" aria-label="Chart or table">
              <button type="button" aria-pressed={!weekTable} onClick={() => setWeekTable(false)}>
                Chart
              </button>
              <button type="button" aria-pressed={weekTable} onClick={() => setWeekTable(true)}>
                Table
              </button>
            </div>
          </div>
          {weekTable ? (
            <table className="mt-5 w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="py-1.5">Week</th>
                  <th className="py-1.5 text-right">Planned</th>
                  <th className="py-1.5 text-right">Posted</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {r.byWeek.map((w) => (
                  <tr key={w.week} className="border-t border-line">
                    <td className="py-1.5">{w.week}</td>
                    <td className="py-1.5 text-right">{w.planned}</td>
                    <td className="py-1.5 text-right">{w.posted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <>
              <div className="mt-6 flex h-44 items-end gap-2" aria-hidden>
                {r.byWeek.map((w) => (
                  <div key={w.week} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <div className="relative w-full max-w-[3rem] rounded-t-lg bg-muted/20" style={{ height: `${(w.planned / maxWeek) * 100}%` }}>
                      <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-rose" style={{ height: `${w.planned ? (w.posted / w.planned) * 100 : 0}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted">W{w.week}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose" /> Posted
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-muted/20" /> Planned
                </span>
              </p>
            </>
          )}
        </section>

        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-extrabold">{metricLabel} by channel</h3>
            <div className="seg" role="group" aria-label="Metric">
              {(
                [
                  ['conversions', 'Goal'],
                  ['reach', 'Reach'],
                  ['clicks', 'Clicks'],
                ] as [Metric, string][]
              ).map(([m, label]) => (
                <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ul className="mt-6 space-y-4">
            {channels.map((c) => (
              <li key={c.channel}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-bold">{c.label}</span>
                  <span className="font-mono">
                    {fmt(c.value)} <span className="text-xs text-muted">· {c.posts} logged</span>
                  </span>
                </div>
                <div className="mt-1.5 h-3 rounded-full bg-blush">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.value / maxChannel) * 100}%`, backgroundColor: c.color }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <h3 className="px-6 pt-6 text-xl font-extrabold">Top posts</h3>
          {r.topPosts.length === 0 ? (
            <p className="px-6 pb-6 pt-2 text-muted">Log results on a few posts and the winners show up here.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-blush/60 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-6 py-2">Post</th>
                    <th className="px-2 py-2 text-right">{r.goalLabel}</th>
                    <th className="px-2 py-2 text-right">Reach</th>
                    <th className="px-6 py-2 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {r.topPosts.map((p) => (
                    <tr key={p.id} className="border-t border-line">
                      <td className="px-6 py-2.5">
                        <button type="button" onClick={() => onOpenItem(p.id)} className="text-left font-bold hover:underline">
                          {p.title}
                        </button>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <ChannelChip channel={p.channel} small />
                          <span className="text-xs text-muted">{postTypeFor(p.format).label}</span>
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono font-bold">{p.conversions ?? 0}</td>
                      <td className="px-2 py-2.5 text-right font-mono">{fmt(p.reach ?? 0)}</td>
                      <td className="px-6 py-2.5 text-right font-mono">{fmt(p.clicks ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card flex flex-col border-teal/30 p-6">
          <h3 className="flex items-center gap-2 text-xl font-extrabold">
            <Sparkles className="h-5 w-5 text-teal" aria-hidden /> What&apos;s working
          </h3>
          {r.working ? (
            <p className="mt-3">
              <strong>
                {postTypeFor(r.working.type).label} on {channelMeta(r.working.channel).label}
              </strong>{' '}
              brings in the most: about {r.working.avg.toFixed(1)} {r.goalLabel.toLowerCase()} per post across {r.working.posts} logged{' '}
              {r.working.posts === 1 ? 'post' : 'posts'}. Do more of that.
            </p>
          ) : (
            <p className="mt-3 text-muted">Log results on at least 3 posts and Flaunt will tell you which channel and post type is pulling its weight.</p>
          )}
          <button type="button" onClick={ask} disabled={asking || r.logged < 3} className="btn-ghost mt-5 self-start !border-teal !text-teal">
            {asking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
            Ask AI what to change next week
          </button>
          {adviceError && (
            <p role="alert" className="mt-3 text-sm font-semibold text-rose">
              {adviceError}
            </p>
          )}
          {advice && (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
              {advice.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Send; label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-muted">
        <Icon className="h-4 w-4" aria-hidden /> {label}
      </p>
      <p className="mt-1 font-display text-3xl font-extrabold">{value}</p>
    </div>
  );
}

function TargetInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      min={1}
      aria-label="Goal target"
      key={value}
      defaultValue={value}
      onBlur={(e) => {
        const n = Math.round(Number(e.target.value));
        if (n > 0 && n !== value) onChange(n);
        else e.target.value = String(value);
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="w-24 rounded-xl border-2 border-dashed border-line bg-transparent px-2 font-display text-xl font-extrabold text-ink focus:border-teal focus:outline-none"
    />
  );
}
