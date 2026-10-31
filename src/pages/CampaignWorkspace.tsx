import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Flame, Loader2, PartyPopper, RotateCcw, Sparkles } from 'lucide-react';
import { useToast } from '@/components/Toast';
import AssistantPanel from '@/components/workspace/AssistantPanel';
import BriefTab from '@/components/workspace/BriefTab';
import CalendarView from '@/components/workspace/CalendarView';
import CoachCard from '@/components/workspace/CoachCard';
import CopyTab from '@/components/workspace/CopyTab';
import IdeasTab, { type IdeaAsset } from '@/components/workspace/IdeasTab';
import ItemEditor from '@/components/workspace/ItemEditor';
import PhaseRibbon from '@/components/workspace/PhaseRibbon';
import RecapModal from '@/components/workspace/RecapModal';
import ResultsTab from '@/components/workspace/ResultsTab';
import ScriptsTab from '@/components/workspace/ScriptsTab';
import {
  GENERIC_ERROR,
  getCampaignDetail,
  moreCopy,
  remoteStore,
  touchStreak,
  type Asset,
  type CalendarItem,
  type Campaign,
  type CampaignDetail,
  type CopyBank,
  type CopyGroup,
  type Idea,
  type ItemPatch,
  type ItemStatus,
  type NewItem,
} from '@/lib/campaigns';
import type { ChatMessage, PlanOp } from '@/lib/assistant';
import { celebrate } from '@/lib/confetti';
import { phaseForDate } from '@/lib/phases';
import { postTypeFor } from '@/lib/postTypes';
import { heatPercent } from '@/lib/results';
import { loadSample, resetSample, sampleStore, saveSample } from '@/lib/sample';
import { addDaysIso, currentWeekIndex, todayIso, weekIndexFor } from '@/lib/schedule';

export type WorkspaceSource = { kind: 'remote'; id: string; userId?: string } | { kind: 'sample' };

type CampaignWorkspaceProps = {
  source: WorkspaceSource;
  celebrateOnOpen?: boolean;
  onBack: () => void;
  onHowItWorks: () => void;
  onStartOwn: () => void;
};

type Tab = 'calendar' | 'results' | 'ideas' | 'scripts' | 'copy' | 'brief';

const TABS: { id: Tab; label: string; blurb: string }[] = [
  { id: 'calendar', label: 'Calendar', blurb: 'Your posts, week by week. Tick “Posted” as you go; click any post to edit it.' },
  { id: 'results', label: 'Results', blurb: 'Adds up the numbers you log on each post, and shows if you’re on track for your goal.' },
  { id: 'ideas', label: 'Ideas', blurb: 'Spare ideas to swipe through. Keep the good ones and drop them onto the calendar.' },
  { id: 'scripts', label: 'Video scripts', blurb: 'Shot-by-shot scripts for 6, 15 and 30 second video ads.' },
  { id: 'copy', label: 'Copy', blurb: 'Headlines, ad text, subject lines and hashtags, ready to paste.' },
  { id: 'brief', label: 'Creative brief', blurb: 'The one-page plan to hand to anyone helping you: designer, freelancer, nephew.' },
];

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' };

export default function CampaignWorkspace({ source, celebrateOnOpen, onBack, onHowItWorks, onStartOwn }: CampaignWorkspaceProps) {
  const toast = useToast();
  const isSample = source.kind === 'sample';
  const [campaign, setCampaign] = useState<CampaignDetail | null>(() => (isSample ? loadSample() : null));
  const [load, setLoad] = useState<LoadState>(isSample ? { status: 'ready' } : { status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [weekIndex, setWeekIndex] = useState(() => (campaign ? currentWeekIndex(campaign.start_date, campaign.duration_weeks) : 0));
  const [tab, setTab] = useState<Tab>('calendar');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantFocus, setAssistantFocus] = useState<string | null>(null);
  const chatKey = `flaunt.askChat.${source.kind === 'remote' ? source.id : 'sample'}`;
  const [chat, setChat] = useState<ChatMessage[]>(() => loadChat(chatKey));
  const campaignRef = useRef(campaign);
  campaignRef.current = campaign;

  const remoteId = source.kind === 'remote' ? source.id : null;
  const userId = source.kind === 'remote' ? source.userId : undefined;
  const store = useMemo(() => (remoteId ? remoteStore(remoteId) : sampleStore), [remoteId]);

  useEffect(() => {
    if (!remoteId) return;
    let active = true;
    setLoad({ status: 'loading' });
    getCampaignDetail(remoteId)
      .then((detail) => {
        if (!active) return;
        setCampaign(detail);
        setWeekIndex(currentWeekIndex(detail.start_date, detail.duration_weeks));
        setLoad({ status: 'ready' });
        if (celebrateOnOpen) window.setTimeout(() => celebrate(true), 300);
      })
      .catch(() => active && setLoad({ status: 'error', message: GENERIC_ERROR }));
    return () => {
      active = false;
    };
  }, [remoteId, reloadKey, celebrateOnOpen]);

  useEffect(() => {
    if (userId) touchStreak(userId).catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    if (isSample && campaign) saveSample(campaign);
  }, [isSample, campaign]);

  useEffect(() => {
    try {
      if (chat.length) localStorage.setItem(chatKey, JSON.stringify(chat.slice(-MAX_SAVED_MESSAGES)));
      else localStorage.removeItem(chatKey);
    } catch {
      // The chat just won't survive a reload.
    }
  }, [chat, chatKey]);

  const apply = useCallback((fn: (c: CampaignDetail) => CampaignDetail) => setCampaign((c) => (c ? fn(c) : c)), []);

  /** Optimistic save: update the screen now, roll back if the database says no. */
  async function save(run: () => Promise<unknown>, rollback: CampaignDetail, message = 'Saved') {
    try {
      await run();
      if (message) toast(message);
    } catch (err) {
      setCampaign(rollback);
      toast(err instanceof Error ? err.message : GENERIC_ERROR, 'error');
    }
  }

  function celebrateProgress(before: CampaignDetail, after: CampaignDetail) {
    const heatBefore = heatPercent(before.items);
    const heatAfter = heatPercent(after.items);
    if (heatAfter === 100 && heatBefore < 100) {
      celebrate(true);
      toast(`Flaunted. ${after.items.length} posts, zero excuses.`);
      window.setTimeout(() => setShowRecap(true), 900);
      return true;
    }
    const finished = after.phases.find((p) => {
      const was = before.items.filter((i) => i.phase_id === p.id);
      const now = after.items.filter((i) => i.phase_id === p.id);
      return now.length > 0 && now.every((i) => i.status === 'done') && !was.every((i) => i.status === 'done');
    });
    if (finished) {
      celebrate();
      toast(`${finished.name} phase: done. Look at you.`);
      return true;
    }
    return false;
  }

  function updateItem(id: string, patch: ItemPatch) {
    const before = campaignRef.current;
    if (!before) return;
    const fullPatch: ItemPatch = { ...patch };
    if (patch.scheduled_on) fullPatch.phase_id = phaseForDate(before.phases, patch.scheduled_on)?.id ?? null;
    const after = { ...before, items: before.items.map((i) => (i.id === id ? { ...i, ...fullPatch } : i)) };
    setCampaign(after);
    const celebrated = patch.status ? celebrateProgress(before, after) : false;
    save(() => store.updateItem(id, fullPatch), before, celebrated ? '' : 'Saved');
  }

  async function addItem(iso: string, seed?: Partial<CalendarItem>) {
    const before = campaignRef.current;
    if (!before) return;
    const channel = seed?.channel && before.channels.includes(seed.channel) ? seed.channel : before.channels[0] ?? 'instagram';
    const format = seed?.format ?? 'Photo post';
    const draft: Omit<CalendarItem, 'id'> = {
      phase_id: phaseForDate(before.phases, iso)?.id ?? null,
      scheduled_on: iso,
      channel,
      format,
      est_minutes: postTypeFor(format).minutes,
      title: seed?.title ?? 'New post',
      hook: seed?.hook ?? null,
      body: seed?.body ?? null,
      cta: null,
      visual: null,
      why: null,
      status: 'draft',
      reach: null,
      clicks: null,
      conversions: null,
      sort: before.items.length,
    };
    try {
      const created = await store.createItem(draft);
      apply((c) => ({ ...c, items: [...c.items, created].sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on) || a.sort - b.sort) }));
      setEditingId(created.id);
      toast('Added. Make it yours.');
    } catch (err) {
      toast(err instanceof Error ? err.message : GENERIC_ERROR, 'error');
    }
  }

  function deleteItem(id: string) {
    const before = campaignRef.current;
    if (!before) return;
    setEditingId(null);
    setCampaign({ ...before, items: before.items.filter((i) => i.id !== id) });
    save(() => store.deleteItem(id), before, 'Gone. Never liked it anyway.');
  }

  function updateCampaign(patch: Partial<Campaign>) {
    const before = campaignRef.current;
    if (!before) return;
    setCampaign({ ...before, ...patch });
    save(() => store.updateCampaign(patch), before);
  }

  function updateAsset(id: string, patch: { kept?: boolean; content?: unknown }, message = '') {
    const before = campaignRef.current;
    if (!before) return;
    setCampaign({ ...before, assets: before.assets.map((a) => (a.id === id ? ({ ...a, ...patch } as Asset) : a)) });
    save(() => store.updateAsset(id, patch), before, message);
  }

  /**
   * Applies assistant edits one by one, then updates the screen once, so a batch can't overwrite itself.
   * Returns the opposite edit for each (for undo), or null where saving failed.
   */
  async function applyPlanOps(ops: PlanOp[]): Promise<(PlanOp | null)[]> {
    const start = campaignRef.current;
    if (!start) return ops.map(() => null);
    let items = start.items;
    let assets = start.assets;
    let details: Partial<Campaign> = {};
    const undos: (PlanOp | null)[] = [];
    let failed = 0;
    // Campaign details go first, so posts in newly added weeks land inside the campaign.
    const ordered = ops.map((op, i) => ({ op, i })).sort((a, b) => Number(b.op.kind === 'campaign') - Number(a.op.kind === 'campaign'));
    for (const { op, i } of ordered) {
      try {
        if (op.kind === 'campaign') {
          const current = { ...start, ...details };
          await store.updateCampaign(op.patch);
          undos[i] = { kind: 'campaign', patch: Object.fromEntries(Object.keys(op.patch).map((k) => [k, current[k as keyof Campaign]])) };
          details = { ...details, ...op.patch };
        } else if (op.kind === 'update') {
          const current = items.find((i) => i.id === op.id);
          if (!current) throw new Error('missing');
          const patch: ItemPatch = { ...op.patch };
          if (patch.scheduled_on) patch.phase_id = phaseForDate(start.phases, patch.scheduled_on)?.id ?? null;
          await store.updateItem(op.id, patch);
          const previous = Object.fromEntries(Object.keys(patch).map((k) => [k, current[k as keyof CalendarItem]])) as ItemPatch;
          items = items.map((it) => (it.id === op.id ? { ...it, ...patch } : it));
          undos[i] = { kind: 'update', id: op.id, patch: previous };
        } else if (op.kind === 'create') {
          const draft = { ...op.item, phase_id: phaseForDate(start.phases, op.item.scheduled_on)?.id ?? null, sort: items.length };
          const created = await store.createItem(draft);
          items = [...items, created];
          undos[i] = { kind: 'delete', id: created.id };
        } else if (op.kind === 'script_update') {
          const current = assets.find((a) => a.id === op.id);
          if (current?.kind !== 'ad_script') throw new Error('missing');
          await store.updateAsset(op.id, { content: op.script, title: op.script.title });
          assets = assets.map((a) => (a.id === op.id ? { ...current, content: op.script, title: op.script.title } : a));
          undos[i] = { kind: 'script_update', id: op.id, script: current.content };
        } else if (op.kind === 'script_create') {
          const created = await store.createAsset({ kind: 'ad_script', title: op.script.title, content: op.script, kept: true });
          assets = [...assets, created];
          undos[i] = { kind: 'script_delete', id: created.id };
        } else if (op.kind === 'script_delete') {
          const current = assets.find((a) => a.id === op.id);
          if (current?.kind !== 'ad_script') throw new Error('missing');
          await store.deleteAsset(op.id);
          assets = assets.filter((a) => a.id !== op.id);
          undos[i] = { kind: 'script_create', script: current.content };
        } else {
          const current = items.find((i) => i.id === op.id);
          if (!current) throw new Error('missing');
          await store.deleteItem(op.id);
          items = items.filter((it) => it.id !== op.id);
          const rest: Partial<CalendarItem> = { ...current };
          delete rest.id;
          undos[i] = { kind: 'create', item: rest as NewItem };
        }
      } catch {
        failed += 1;
        undos[i] = null;
      }
    }
    const touched = new Set(ops.flatMap((op) => (op.kind === 'update' || op.kind === 'delete' ? [op.id] : [])));
    const created = items.filter((i) => !start.items.some((s) => s.id === i.id));
    const removed = new Set(start.items.filter((s) => !items.some((i) => i.id === s.id)).map((s) => s.id));
    const touchedAssets = new Set(ops.flatMap((op) => (op.kind === 'script_update' ? [op.id] : [])));
    const createdAssets = assets.filter((a) => !start.assets.some((s) => s.id === a.id));
    const removedAssets = new Set(start.assets.filter((s) => !assets.some((a) => a.id === s.id)).map((s) => s.id));
    apply((c) => ({
      ...c,
      ...details,
      items: [
        ...c.items.filter((i) => !removed.has(i.id)).map((i) => (touched.has(i.id) ? items.find((n) => n.id === i.id) ?? i : i)),
        ...created,
      ].sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on) || a.sort - b.sort),
      // Merged like posts, so two batches saving at once (say, two quick Undo clicks) don't overwrite each other.
      assets: [
        ...c.assets.filter((a) => !removedAssets.has(a.id)).map((a) => (touchedAssets.has(a.id) ? assets.find((n) => n.id === a.id) ?? a : a)),
        ...createdAssets,
      ],
    }));
    if (failed) toast(`${failed} change${failed === 1 ? '' : 's'} couldn't be saved. Try again.`, 'error');
    else toast(ops.length === 1 ? 'Done.' : `${ops.length} changes applied.`);
    return undos;
  }

  function decideIdea(asset: IdeaAsset, kept: boolean) {
    updateAsset(asset.id, { kept, content: { ...asset.content, decided: true } }, kept ? 'Kept.' : 'Gone. Never liked it anyway.');
  }

  function scheduleIdea(idea: Idea, iso: string) {
    addItem(iso, { title: idea.title, body: idea.description, channel: idea.channel?.toLowerCase(), format: idea.format });
    setTab('calendar');
    if (campaign) setWeekIndex(Math.min(campaign.duration_weeks - 1, Math.max(0, weekIndexFor(iso, campaign.start_date))));
  }

  async function handleMoreCopy(group: CopyGroup) {
    const c = campaignRef.current;
    const asset = c?.assets.find((a) => a.kind === 'copy');
    if (!c || !asset) return;
    const bank = asset.content as CopyBank;
    try {
      const lines = await moreCopy(c, group, bank[group]);
      const fresh = lines.filter((l) => !bank[group].includes(l));
      updateAsset(asset.id, { content: { ...bank, [group]: [...bank[group], ...fresh] } }, `${fresh.length} more added.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : GENERIC_ERROR, 'error');
    }
  }

  if (load.status === 'loading' || (load.status === 'ready' && !campaign)) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-5 py-24 text-muted" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Opening your campaign...
      </div>
    );
  }

  if (load.status === 'error' || !campaign) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <BackLink onBack={onBack} label="All campaigns" />
        <div className="card mt-8 flex flex-col items-start gap-4 p-8">
          <p role="alert" className="flex items-start gap-2 font-semibold text-rose-deep">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            We couldn&apos;t open this campaign. {load.status === 'error' ? load.message : ''}
          </p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn-ghost">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const total = campaign.items.length;
  const done = campaign.items.filter((item) => item.status === 'done').length;
  const heat = heatPercent(campaign.items);
  const thisWeekItems = campaign.items.filter((item) => weekIndexFor(item.scheduled_on, campaign.start_date) === weekIndex);
  const weekDone = thisWeekItems.filter((item) => item.status === 'done').length;
  const ended = todayIso() > addDaysIso(campaign.start_date, campaign.duration_weeks * 7 - 1);
  const editing = campaign.items.find((i) => i.id === editingId);
  const activeTab = TABS.find((t) => t.id === tab)!;

  function toggleItem(item: CalendarItem) {
    updateItem(item.id, { status: item.status === 'done' ? 'draft' : 'done' });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink onBack={onBack} label={isSample ? 'Home' : 'All campaigns'} />
        {isSample && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill bg-honey/30 !py-1 text-ink">Sample campaign · saved in this browser only</span>
            <button
              type="button"
              className="btn-soft"
              onClick={() => {
                const fresh = resetSample();
                setChat([]);
                setCampaign(fresh);
                setWeekIndex(currentWeekIndex(fresh.start_date, fresh.duration_weeks));
                toast('Sample reset.');
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
            </button>
            <button type="button" className="btn-press btn-sm" onClick={onStartOwn}>
              Flaunt your own
            </button>
          </div>
        )}
      </div>

      <header className="card relative mt-4 overflow-hidden p-6 md:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-honey/20 blur-3xl" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_17rem]">
          <div className="min-w-0">
            <p className="eyebrow">{campaign.business_name}</p>
            <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">{campaign.name}</h1>
            {campaign.big_idea && <p className="mt-3 max-w-2xl text-lg">{campaign.big_idea}</p>}
            {campaign.tagline && (
              <p className="mt-3 inline-block -rotate-1 rounded-lg bg-espresso px-3 py-1 font-display font-bold text-honey">
                &ldquo;{campaign.tagline}&rdquo;
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <span className="flex items-center gap-1.5 font-display text-lg font-extrabold">
                <Flame className="h-5 w-5 text-honey" aria-hidden /> Heat
              </span>
              <span className="font-mono text-2xl font-bold">{heat}%</span>
            </div>
            <div
              className="h-4 overflow-hidden rounded-full border-2 border-ink bg-blush"
              role="progressbar"
              aria-label="Heat: share of posts marked Posted"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={heat}
            >
              <div className="h-full rounded-full bg-gradient-to-r from-honey to-rose transition-all duration-700" style={{ width: `${heat}%` }} />
            </div>
            <p className="text-xs text-muted">
              {done} of {total} posts ticked as Posted
            </p>
            <p className="self-start rounded-full border-2 border-ink bg-surface px-3 py-1 text-sm font-bold">
              Week {weekIndex + 1}: {weekDone} of {thisWeekItems.length} posted
            </p>
            {(ended || heat >= 50) && (
              <button type="button" onClick={() => setShowRecap(true)} className="btn-soft self-start">
                <PartyPopper className="h-4 w-4 text-rose" aria-hidden /> {ended || heat === 100 ? 'See your Flaunted recap' : 'Sneak peek: your recap'}
              </button>
            )}
          </div>
        </div>
        <div className="relative mt-8">
          <PhaseRibbon phases={campaign.phases} startIso={campaign.start_date} weeks={campaign.duration_weeks} />
        </div>
      </header>

      <CoachCard />

      <nav className="sticky top-[57px] z-20 -mx-4 mt-8 border-b border-line bg-cream/95 px-4 backdrop-blur sm:mx-0 sm:px-0" aria-label="Campaign sections">
        <div className="flex gap-1 overflow-x-auto" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="tab-panel"
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 whitespace-nowrap px-4 py-3 font-display text-base font-bold transition-colors ${
                tab === t.id ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-3 -bottom-px h-1 rounded-full bg-rose" aria-hidden />}
            </button>
          ))}
        </div>
      </nav>
      <p className="mt-3 text-sm text-muted">{activeTab.blurb}</p>

      <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === 'calendar' && (
          <CalendarView
            campaign={campaign}
            weekIndex={weekIndex}
            onWeekChange={setWeekIndex}
            onOpen={(item) => setEditingId(item.id)}
            onToggle={toggleItem}
            onMove={(item, iso) => updateItem(item.id, { scheduled_on: iso })}
            onStatus={(item, status: ItemStatus) => updateItem(item.id, { status })}
            onAdd={addItem}
            onHowItWorks={onHowItWorks}
          />
        )}
        {tab === 'results' && (
          <ResultsTab
            campaign={campaign}
            isSample={isSample}
            onTarget={(goal_target) => updateCampaign({ goal_target })}
            onOpenItem={setEditingId}
            onGoToCalendar={() => setTab('calendar')}
          />
        )}
        {tab === 'ideas' && (
          <IdeasTab
            campaign={campaign}
            onDecide={decideIdea}
            onUndo={(a) => updateAsset(a.id, { kept: true, content: { ...a.content, decided: false } })}
            onSchedule={scheduleIdea}
          />
        )}
        {tab === 'scripts' && <ScriptsTab campaign={campaign} />}
        {tab === 'copy' && <CopyTab campaign={campaign} onMore={handleMoreCopy} />}
        {tab === 'brief' && <BriefTab campaign={campaign} />}
      </div>

      {editing && (
        <ItemEditor
          campaign={campaign}
          item={editing}
          onChange={(patch) => updateItem(editing.id, patch)}
          onDelete={() => deleteItem(editing.id)}
          onClose={() => setEditingId(null)}
          onAsk={() => {
            setAssistantFocus(editing.id);
            setEditingId(null);
            setAssistantOpen(true);
          }}
        />
      )}
      {assistantOpen && (
        <AssistantPanel
          campaign={campaign}
          messages={chat}
          setMessages={setChat}
          focusId={assistantFocus}
          onClearFocus={() => setAssistantFocus(null)}
          onApply={applyPlanOps}
          onOpenItem={(id) => {
            setAssistantOpen(false);
            setEditingId(id);
          }}
          onClose={() => setAssistantOpen(false)}
        />
      )}
      {!assistantOpen && !editing && !showRecap && (
        <button
          type="button"
          onClick={() => {
            setAssistantFocus(null);
            setAssistantOpen(true);
          }}
          className="btn-press fixed bottom-5 right-5 z-40 shadow-lift"
        >
          <Sparkles className="h-5 w-5" aria-hidden /> Ask Flaunt
        </button>
      )}
      {showRecap && <RecapModal campaign={campaign} onClose={() => setShowRecap(false)} />}
    </div>
  );
}

const MAX_SAVED_MESSAGES = 60;

/** Each campaign keeps its own Ask Flaunt chat in this browser. */
function loadChat(key: string): ChatMessage[] {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '[]') as ChatMessage[];
    // A save cut off mid-way may or may not have landed, so it's not offered again.
    return saved.map((m) =>
      m.changes ? { ...m, changes: m.changes.map((c) => (c.state === 'applying' ? { ...c, state: 'failed' as const } : c)) } : m,
    );
  } catch {
    return [];
  }
}

function BackLink({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" aria-hidden /> {label}
    </button>
  );
}
