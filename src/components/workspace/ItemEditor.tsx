import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Languages, Lightbulb, Loader2, Scissors, Sparkles, Trash2 } from 'lucide-react';
import Drawer from '@/components/Drawer';
import { useToast } from '@/components/Toast';
import {
  STATUS_LABELS,
  rewriteItem,
  type CalendarItem,
  type CampaignDetail,
  type ItemPatch,
  type ItemStatus,
  type RewriteStyle,
} from '@/lib/campaigns';
import { CHANNEL_META } from '@/lib/channels';
import { flauntCheck } from '@/lib/check';
import { RESULT_HINTS, goalLabelFor } from '@/lib/goals';
import { postTypesUsed } from '@/lib/postTypes';

type ItemEditorProps = {
  campaign: CampaignDetail;
  item: CalendarItem;
  onChange: (patch: ItemPatch) => void;
  onDelete: () => void;
  onClose: () => void;
};

type TextField = 'title' | 'hook' | 'body' | 'cta' | 'visual' | 'format';
type NumberField = 'reach' | 'clicks' | 'conversions';

const REWRITES: { style: RewriteStyle; label: string; icon: typeof Sparkles }[] = [
  { style: 'fresh', label: 'Fresh take', icon: Sparkles },
  { style: 'shorter', label: 'Shorter', icon: Scissors },
  { style: 'spanish', label: 'En español', icon: Languages },
];

export default function ItemEditor({ campaign, item, onChange, onDelete, onClose }: ItemEditorProps) {
  const toast = useToast();
  const [draft, setDraft] = useState(item);
  const [rewriting, setRewriting] = useState<RewriteStyle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Pick up changes made elsewhere (status from the board, a rewrite) without losing typing in progress.
  useEffect(() => {
    setDraft((d) => ({ ...item, ...pickDirty(d, item) }));
  }, [item]);

  const issues = flauntCheck(draft);
  const goalLabel = goalLabelFor(campaign.goal, campaign.goal_label);

  function commitText(field: TextField) {
    const value = draft[field]?.trim() ?? '';
    if (value === (item[field] ?? '')) return;
    if (field === 'title' && !value) {
      setDraft((d) => ({ ...d, title: item.title }));
      return;
    }
    onChange({ [field]: value || null });
  }

  function commitNumber(field: NumberField, raw: string) {
    const value = raw === '' ? null : Math.max(0, Math.round(Number(raw)));
    if (value !== null && Number.isNaN(value)) return;
    if (value === item[field]) return;
    onChange({ [field]: value });
  }

  async function handleRewrite(style: RewriteStyle) {
    setRewriting(style);
    try {
      const next = await rewriteItem(campaign, draft, style);
      setDraft((d) => ({ ...d, ...next }));
      onChange(next);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'The rewrite failed. Try again.', 'error');
    } finally {
      setRewriting(null);
    }
  }

  const textInput = (field: TextField) => ({
    value: draft[field] ?? '',
    onChange: (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [field]: e.target.value })),
    onBlur: () => commitText(field),
  });

  return (
    <Drawer
      title="Edit post"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Delete this post?</span>
              <button type="button" onClick={onDelete} className="btn-soft !border-rose !text-rose">
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn-soft">
                Keep it
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn-soft !text-rose">
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-press btn-sm">
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <span className="label" id="status-label">
            Status
          </span>
          <div className="seg flex-wrap" role="group" aria-labelledby="status-label">
            {(Object.keys(STATUS_LABELS) as ItemStatus[]).map((s) => (
              <button key={s} type="button" aria-pressed={draft.status === s} onClick={() => onChange({ status: s })}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="ed-title">
            Title
          </label>
          <input id="ed-title" className="field font-bold" {...textInput('title')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="ed-channel">
              Channel
            </label>
            <select id="ed-channel" className="field" value={draft.channel} onChange={(e) => onChange({ channel: e.target.value })}>
              {Object.entries(CHANNEL_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ed-format">
              Post type
            </label>
            <input id="ed-format" list="post-types" className="field" {...textInput('format')} />
            <datalist id="post-types">
              {postTypesUsed(['reel', 'carousel', 'poll', 'photo', 'stitch', 'trend', 'email', 'google', 'blog', 'linkedin', 'group', 'facebook']).map((t) => (
                <option key={t.key} value={t.label} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="ed-date">
              Date
            </label>
            <input
              id="ed-date"
              type="date"
              className="field font-mono text-sm"
              value={draft.scheduled_on}
              onChange={(e) => e.target.value && onChange({ scheduled_on: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label flex items-baseline justify-between" htmlFor="ed-hook">
            Hook <span className={`font-mono text-xs ${(draft.hook?.length ?? 0) > 125 ? 'text-rose' : 'text-muted'}`}>{draft.hook?.length ?? 0}/125</span>
          </label>
          <input id="ed-hook" className="field" placeholder="The first line people see" {...textInput('hook')} />
        </div>

        <div>
          <label className="label" htmlFor="ed-body">
            Post text
          </label>
          <textarea id="ed-body" rows={5} className="field" {...textInput('body')} />
        </div>

        <div>
          <label className="label" htmlFor="ed-cta">
            Call to action
          </label>
          <input id="ed-cta" className="field" placeholder="What should people do next?" {...textInput('cta')} />
        </div>

        <div>
          <label className="label" htmlFor="ed-visual">
            What to shoot
          </label>
          <textarea id="ed-visual" rows={2} className="field" placeholder="One sentence on what to film or photograph" {...textInput('visual')} />
        </div>

        <div>
          <span className="label">Rewrite with AI</span>
          <div className="flex flex-wrap gap-2">
            {REWRITES.map(({ style, label, icon: Icon }) => (
              <button key={style} type="button" disabled={!!rewriting} onClick={() => handleRewrite(style)} className="btn-soft !border-teal/40">
                {rewriting === style ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Icon className="h-4 w-4 text-teal" aria-hidden />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {item.why && (
          <div className="rounded-2xl border border-teal/30 bg-teal/[0.07] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-teal">
              <Lightbulb className="h-4 w-4" aria-hidden /> Why this works
            </p>
            <p className="mt-1 text-sm">{item.why}</p>
          </div>
        )}

        <div className={`rounded-2xl border p-4 ${issues.length ? 'border-honey/60 bg-honey/10' : 'border-sage/40 bg-sage/10'}`}>
          <p className="flex items-center gap-2 text-sm font-bold">
            {issues.length ? (
              <>
                <AlertTriangle className="h-4 w-4 text-honey" aria-hidden /> Flaunt check: {issues.length} to fix
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-sage" aria-hidden /> Flaunt check: ready to post
              </>
            )}
          </p>
          {issues.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
              {issues.map((issue) => (
                <li key={issue.id}>{issue.message}</li>
              ))}
            </ul>
          )}
        </div>

        <fieldset className="rounded-2xl border border-line bg-surface p-4">
          <legend className="px-1 font-display text-lg font-extrabold">How did it do?</legend>
          <p className="text-sm text-muted">
            {draft.status === 'done'
              ? 'A few days after posting, copy 3 numbers from the app. The Results tab adds them up.'
              : 'Once this is live and ticked Posted, come back and log 3 numbers here.'}
          </p>
          <p className="mt-2 rounded-xl bg-blush/60 px-3 py-2 text-xs">{RESULT_HINTS[draft.channel] ?? 'Use the numbers from the app you posted on.'}</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {(
              [
                ['reach', 'People reached'],
                ['clicks', 'Clicks'],
                ['conversions', goalLabel],
              ] as [NumberField, string][]
            ).map(([field, label]) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-bold" htmlFor={`ed-${field}`}>
                  {label}
                </label>
                <input
                  id={`ed-${field}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="field !px-3 !py-2 font-mono"
                  defaultValue={item[field] ?? ''}
                  key={`${item.id}-${field}-${item[field]}`}
                  onBlur={(e) => commitNumber(field, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Tip: give each post its own discount code or tracked link so you know which one made the sale.
          </p>
        </fieldset>
      </div>
    </Drawer>
  );
}

function pickDirty(draft: CalendarItem, item: CalendarItem): Partial<CalendarItem> {
  const active = document.activeElement?.id?.replace('ed-', '') as keyof CalendarItem | undefined;
  return active && active in draft && draft[active] !== item[active] ? { [active]: draft[active] } : {};
}
