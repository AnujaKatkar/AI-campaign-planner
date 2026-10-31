import { useEffect, useRef, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react';
import { AlertCircle, ArrowRight, CalendarRange, Check, Clapperboard, Info, Loader2, Mic, Pencil, Plus, RotateCcw, Send, Sparkles, Square, Trash2, Undo2, X } from 'lucide-react';
import ChannelChip from '@/components/ChannelChip';
import Drawer from '@/components/Drawer';
import { appendSpoken, useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { FIELD_LABELS, askFlaunt, changedFields, newKey, type CampaignPatch, type ChatMessage, type PlanOp, type ProposedChange } from '@/lib/assistant';
import type { AdScript, CampaignDetail, NewItem } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { addDaysIso, formatShortDate } from '@/lib/schedule';

type AssistantPanelProps = {
  campaign: CampaignDetail;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  focusId: string | null;
  onClearFocus: () => void;
  /** Applies the edits in order and returns, for each, the edit that undoes it (null if it failed). */
  onApply: (ops: PlanOp[]) => Promise<(PlanOp | null)[]>;
  onOpenItem: (id: string) => void;
  onClose: () => void;
};

const STARTERS = [
  'Make the hooks in week 1 punchier',
  'Move all TikTok posts to weekends',
  'Add 2 email posts before the big reveal',
  'Make the 15-second video script funnier',
  'Which post should I make first this week?',
];

const FOCUS_STARTERS = ['Rewrite this hook so it stops the scroll', 'Move this post to Friday', 'Turn this into a swipe post (Carousel)'];

export default function AssistantPanel({ campaign, messages, setMessages, focusId, onClearFocus, onApply, onOpenItem, onClose }: AssistantPanelProps) {
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef(input);
  inputRef.current = input;
  const speech = useSpeechRecognition((spoken) => setInput(appendSpoken(inputRef.current, spoken)));
  const endRef = useRef<HTMLDivElement>(null);
  const focusItem = campaign.items.find((i) => i.id === focusId) ?? null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, thinking]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || thinking) return;
    speech.stop();
    const userMsg: ChatMessage = { key: newKey(), role: 'user', text: message };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);
    try {
      const reply = await askFlaunt(campaign, messages, message, focusId);
      setMessages((m) => [...m, reply]);
    } catch (err) {
      const text = err instanceof Error ? err.message : 'The AI is busy. Try again in a moment.';
      setMessages((m) => [...m, { key: newKey(), role: 'assistant', text, error: true }]);
    } finally {
      setThinking(false);
    }
  }

  function setChanges(msgKey: string, keys: string[], update: (c: ProposedChange) => ProposedChange) {
    setMessages((all) =>
      all.map((m) => (m.key === msgKey && m.changes ? { ...m, changes: m.changes.map((c) => (keys.includes(c.key) ? update(c) : c)) } : m)),
    );
  }

  async function accept(msgKey: string, picked: ProposedChange[]) {
    // A post in weeks the campaign doesn't have yet needs that reply's length change too.
    const lastDay = addDaysIso(campaign.start_date, campaign.duration_weeks * 7 - 1);
    const outside = picked.some((c) => (c.op.kind === 'create' ? c.op.item.scheduled_on : c.op.kind === 'update' ? c.op.patch.scheduled_on : '')! > lastDay);
    const details = messages.find((m) => m.key === msgKey)?.changes?.find((c) => c.op.kind === 'campaign' && c.state === 'pending');
    const changes = outside && details && !picked.includes(details) ? [details, ...picked] : picked;
    const keys = changes.map((c) => c.key);
    setChanges(msgKey, keys, (c) => ({ ...c, state: 'applying' }));
    const undos = await onApply(changes.map((c) => c.op));
    const byKey = new Map(keys.map((k, i) => [k, undos[i]]));
    setChanges(msgKey, keys, (c) => {
      const undo = byKey.get(c.key);
      return undo ? { ...c, state: 'accepted', undo } : { ...c, state: 'failed' };
    });
  }

  async function undo(msgKey: string, change: ProposedChange) {
    if (!change.undo) return;
    setChanges(msgKey, [change.key], (c) => ({ ...c, state: 'applying' }));
    const [redo] = await onApply([change.undo]);
    // A deleted post comes back with a new id, so the original edit can't be re-applied; it just goes back to pending as a suggestion.
    setChanges(msgKey, [change.key], (c) =>
      redo ? { ...c, state: change.op.kind === 'delete' ? 'rejected' : 'pending', undo: undefined } : { ...c, state: 'accepted' },
    );
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const starters = focusItem ? FOCUS_STARTERS : STARTERS;

  return (
    <Drawer
      title="Ask Flaunt"
      onClose={onClose}
      footer={
        <div className="space-y-2">
          {focusItem && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">About:</span>
              <span className="pill min-w-0 bg-blush !py-1 text-ink">
                <span className="truncate">{focusItem.title}</span>
                <button type="button" onClick={onClearFocus} aria-label="Ask about the whole plan instead" className="ml-1 rounded-full hover:text-rose">
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            </div>
          )}
          {speech.listening && (
            <p className="text-sm italic text-muted" aria-live="polite">
              {speech.interim ? `“${speech.interim}…”` : 'Listening… tap the mic again when you’re done.'}
            </p>
          )}
          {speech.error && <p className="text-sm text-rose-deep">{speech.error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={focusItem ? 'What should change about this post?' : 'Ask a question or tell Flaunt what to change…'}
              aria-label="Message Flaunt"
              className="field resize-none py-2 text-base"
              autoFocus
            />
            {speech.supported && (
              <button
                type="button"
                onClick={speech.toggle}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? 'Stop voice typing' : 'Speak your message'}
                className={`btn-soft !p-2.5 ${speech.listening ? 'border-rose bg-rose/10 text-rose-deep' : ''}`}
              >
                {speech.listening ? <Square className="h-4 w-4 fill-current" aria-hidden /> : <Mic className="h-4 w-4 text-teal" aria-hidden />}
              </button>
            )}
            <button type="button" onClick={() => send(input)} disabled={thinking || !input.trim()} aria-label="Send" className="btn-press !p-2.5">
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {messages.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                speech.stop();
                setMessages([]);
              }}
              disabled={thinking}
              className="btn-soft text-muted"
              title="Clears the conversation. Changes you already accepted stay in your plan."
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Clear chat
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <div className="rounded-2xl bg-blush/50 p-5">
            <p className="flex items-center gap-2 font-display text-lg font-extrabold">
              <Sparkles className="h-5 w-5 text-teal" aria-hidden /> Your plan, on request
            </p>
            <p className="mt-2 text-sm text-muted">
              Ask about your campaign, or tell Flaunt what to change. You'll see every edit before it happens, and nothing changes until you accept it.
            </p>
            <div className="mt-4 flex flex-col items-start gap-2">
              {starters.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="btn-soft text-left">
                  {s} <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.key} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-cream">{m.text}</p>
            </div>
          ) : (
            <div key={m.key} className="space-y-3">
              <p
                className={`max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md border px-4 py-2.5 ${
                  m.error ? 'border-rose/40 bg-rose/10 text-rose-deep' : 'border-line bg-surface'
                }`}
                role={m.error ? 'alert' : undefined}
              >
                {m.error && <AlertCircle className="mr-1.5 inline h-4 w-4 align-[-2px]" aria-hidden />}
                {m.text}
              </p>
              {m.changes && m.changes.length > 0 && (
                <ChangeList
                  changes={m.changes}
                  onAccept={(cs) => accept(m.key, cs)}
                  onReject={(cs) => setChanges(m.key, cs.map((c) => c.key), (c) => ({ ...c, state: 'rejected' }))}
                  onUndo={(c) => undo(m.key, c)}
                  onOpenItem={onOpenItem}
                />
              )}
              {!!m.skipped && (
                <p className="flex items-start gap-2 text-sm text-muted">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {m.skipped === 1 ? '1 suggestion was' : `${m.skipped} suggestions were`} left out because {m.skipped === 1 ? 'it' : 'they'} didn&apos;t
                  fit the plan (a date outside the campaign, an unknown post or channel). Try asking again more specifically.
                </p>
              )}
            </div>
          ),
        )}

        {thinking && (
          <p className="inline-flex items-center gap-2 text-sm text-muted" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Flaunt is looking at your plan…
          </p>
        )}
        <div ref={endRef} />
      </div>
    </Drawer>
  );
}

type ChangeListProps = {
  changes: ProposedChange[];
  onAccept: (changes: ProposedChange[]) => void;
  onReject: (changes: ProposedChange[]) => void;
  onUndo: (change: ProposedChange) => void;
  onOpenItem: (id: string) => void;
};

function ChangeList({ changes, onAccept, onReject, onUndo, onOpenItem }: ChangeListProps) {
  const pending = changes.filter((c) => c.state === 'pending');
  return (
    <div className="space-y-2">
      {pending.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">{pending.length} suggested changes</span>
          <button type="button" onClick={() => onAccept(pending)} className="btn-soft !border-teal !text-teal">
            <Check className="h-4 w-4" aria-hidden /> Accept all
          </button>
          <button type="button" onClick={() => onReject(pending)} className="btn-soft">
            Reject all
          </button>
        </div>
      )}
      {changes.map((c) => (
        <ChangeCard key={c.key} change={c} onAccept={() => onAccept([c])} onReject={() => onReject([c])} onUndo={() => onUndo(c)} onOpenItem={onOpenItem} />
      ))}
    </div>
  );
}

const OP_STYLE = {
  update: { icon: Pencil, label: 'Edit', tone: 'text-teal' },
  create: { icon: Plus, label: 'New post', tone: 'text-sage' },
  delete: { icon: Trash2, label: 'Remove', tone: 'text-rose' },
  campaign: { icon: CalendarRange, label: 'Campaign details', tone: 'text-honey' },
  script_update: { icon: Clapperboard, label: 'Edit video script', tone: 'text-teal' },
  script_create: { icon: Clapperboard, label: 'New video script', tone: 'text-sage' },
  script_delete: { icon: Trash2, label: 'Remove video script', tone: 'text-rose' },
};

function ChangeCard({
  change,
  onAccept,
  onReject,
  onUndo,
  onOpenItem,
}: {
  change: ProposedChange;
  onAccept: () => void;
  onReject: () => void;
  onUndo: () => void;
  onOpenItem: (id: string) => void;
}) {
  const { op, before, state } = change;
  const style = OP_STYLE[op.kind];
  const created: NewItem | null = op.kind === 'create' ? op.item : null;
  const channel = created?.channel ?? before?.channel ?? '';
  const date = created?.scheduled_on ?? before?.scheduled_on ?? '';
  const script = op.kind === 'script_update' || op.kind === 'script_create' ? op.script : null;
  const title =
    op.kind === 'campaign'
      ? 'Change your campaign'
      : script
        ? `${script.title} · ${script.length_seconds}s`
        : op.kind === 'script_delete'
          ? `${change.beforeScript?.title ?? 'Script'} · ${change.beforeScript?.length_seconds ?? '?'}s`
          : (created?.title ?? before?.title ?? '');
  const fields = changedFields(change);
  const muted = state === 'rejected';

  return (
    <div className={`rounded-2xl border bg-surface p-4 transition-opacity ${state === 'accepted' ? 'border-sage/60' : 'border-line'} ${muted ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={`inline-flex items-center gap-1 font-bold ${style.tone}`}>
          <style.icon className="h-4 w-4" aria-hidden /> {style.label}
        </span>
        {channel && <ChannelChip channel={channel} small />}
        {date && <span className="font-mono text-xs text-muted">{formatShortDate(date)}</span>}
      </div>
      {before && op.kind !== 'create' ? (
        <button type="button" onClick={() => onOpenItem(before.id)} className="mt-1.5 text-left font-bold hover:underline">
          {title}
        </button>
      ) : (
        <p className="mt-1.5 font-bold">{title}</p>
      )}
      {change.reason && <p className="mt-1 text-sm text-muted">{change.reason}</p>}

      {op.kind === 'update' && (
        <dl className="mt-3 space-y-2 text-sm">
          {fields.map((f) => (
            <div key={f}>
              <dt className="eyebrow">{FIELD_LABELS[f]}</dt>
              <dd className="mt-0.5">
                {before?.[f] && <span className="block text-muted line-through decoration-rose/60">{display(f, before[f] as string)}</span>}
                <span className="block font-medium">{display(f, op.patch[f] as string)}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {script && (
        <div className="mt-3 space-y-3">
          <ScriptScenes script={script} />
          {op.kind === 'script_update' && change.beforeScript && (
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-muted">See the current version</summary>
              <div className="mt-2 opacity-70">
                <ScriptScenes script={change.beforeScript} />
              </div>
            </details>
          )}
        </div>
      )}
      {op.kind === 'campaign' && (
        <dl className="mt-3 space-y-2 text-sm">
          {(Object.keys(op.patch) as (keyof CampaignPatch)[]).map((k) => (
            <div key={k}>
              <dt className="eyebrow">{CAMPAIGN_LABELS[k]}</dt>
              <dd className="mt-0.5">
                {change.beforeCampaign?.[k] != null && (
                  <span className="block text-muted line-through decoration-rose/60">{campaignValue(k, change.beforeCampaign[k])}</span>
                )}
                <span className="block font-medium">{campaignValue(k, op.patch[k])}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {created && (
        <dl className="mt-3 space-y-2 text-sm">
          {fields
            .filter((f) => !['title', 'channel', 'scheduled_on'].includes(f))
            .map((f) => (
              <div key={f}>
                <dt className="eyebrow">{FIELD_LABELS[f]}</dt>
                <dd className="mt-0.5">{created[f] as string}</dd>
              </div>
            ))}
        </dl>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {state === 'pending' && (
          <>
            <button type="button" onClick={onAccept} className="btn-soft !border-teal !text-teal">
              <Check className="h-4 w-4" aria-hidden /> Accept
            </button>
            <button type="button" onClick={onReject} className="btn-soft">
              Reject
            </button>
          </>
        )}
        {state === 'applying' && (
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving…
          </span>
        )}
        {state === 'accepted' && (
          <>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-sage">
              <Check className="h-4 w-4" aria-hidden /> Applied
            </span>
            {change.undo && (
              <button type="button" onClick={onUndo} className="btn-soft text-muted">
                <Undo2 className="h-4 w-4" aria-hidden /> Undo
              </button>
            )}
          </>
        )}
        {state === 'rejected' && <span className="text-sm text-muted">Skipped</span>}
        {state === 'failed' && <span className="text-sm font-semibold text-rose-deep">Couldn't apply this one. The post may have been changed or removed.</span>}
      </div>
    </div>
  );
}

function ScriptScenes({ script }: { script: AdScript }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted">
        {script.platform}
        {script.cta && <> · ends with &ldquo;{script.cta}&rdquo;</>}
      </p>
      <ol className="space-y-2">
        {script.scenes.map((sc, i) => (
          <li key={i} className="rounded-xl bg-blush/40 px-3 py-2">
            <span className="font-mono text-xs font-bold">{sc.time}</span>
            {sc.visual && <p><span className="font-semibold">Visual:</span> {sc.visual}</p>}
            {sc.voiceover && <p><span className="font-semibold">Voiceover:</span> {sc.voiceover}</p>}
            {sc.on_screen_text && <p><span className="font-semibold">On screen:</span> {sc.on_screen_text}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

const CAMPAIGN_LABELS: Record<keyof CampaignPatch, string> = {
  name: 'Campaign name',
  tagline: 'Tagline',
  big_idea: 'Big idea',
  offer: 'Offer',
  duration_weeks: 'Length',
};

function campaignValue(key: keyof CampaignPatch, value: unknown): string {
  return key === 'duration_weeks' ? `${value} weeks` : String(value ?? '');
}

function display(field: string, value: string): string {
  if (field === 'scheduled_on') return formatShortDate(value);
  if (field === 'channel') return channelMeta(value).label;
  return value;
}
