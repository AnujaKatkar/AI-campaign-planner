import { GENERIC_ERROR, planChat, type AdScript, type CalendarItem, type CampaignDetail, type ItemPatch, type NewItem } from '@/lib/campaigns';

/** Campaign details the assistant may change. */
export type CampaignPatch = Partial<Pick<CampaignDetail, 'name' | 'tagline' | 'big_idea' | 'offer' | 'duration_weeks'>>;
import { postTypeFor } from '@/lib/postTypes';
import { addDaysIso } from '@/lib/schedule';

/** One edit to the plan. The workspace applies these and hands back the opposite edit for undo. */
export type PlanOp =
  | { kind: 'update'; id: string; patch: ItemPatch }
  | { kind: 'create'; item: NewItem }
  | { kind: 'delete'; id: string }
  | { kind: 'campaign'; patch: CampaignPatch }
  | { kind: 'script_update'; id: string; script: AdScript }
  | { kind: 'script_create'; script: AdScript }
  | { kind: 'script_delete'; id: string };

export type ChangeState = 'pending' | 'applying' | 'accepted' | 'rejected' | 'failed';

export type ProposedChange = {
  key: string;
  op: PlanOp;
  reason: string;
  /** The post as it was when the AI suggested this; shown as "before". */
  before: CalendarItem | null;
  /** For a campaign change, the details as they were. */
  beforeCampaign?: CampaignPatch;
  /** For a script change, the script as it was. */
  beforeScript?: AdScript;
  state: ChangeState;
  undo?: PlanOp;
};

export type ChatMessage = {
  key: string;
  role: 'user' | 'assistant';
  text: string;
  error?: boolean;
  changes?: ProposedChange[];
  /** How many of the AI's suggestions were dropped because they didn't fit the plan. */
  skipped?: number;
};

/** The database allows campaigns of 1 to 26 weeks. */
const MAX_WEEKS = 26;

const EDITABLE = ['title', 'hook', 'body', 'cta', 'visual', 'format', 'channel', 'scheduled_on'] as const;
type EditableField = (typeof EDITABLE)[number];

export const FIELD_LABELS: Record<EditableField, string> = {
  title: 'Title',
  hook: 'Hook',
  body: 'Text',
  cta: 'Call to action',
  visual: 'What to shoot',
  format: 'Post type',
  channel: 'Channel',
  scheduled_on: 'Date',
};

let counter = 0;
export const newKey = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;

const refFor = (index: number) => `p${index + 1}`;

/** Asks the assistant and returns its reply with every proposed change checked against the real plan. */
export async function askFlaunt(
  campaign: CampaignDetail,
  history: ChatMessage[],
  message: string,
  focusId: string | null,
): Promise<ChatMessage> {
  const refs = new Map(campaign.items.map((item, i) => [refFor(i), item]));
  const scripts = campaign.assets.flatMap((a) => (a.kind === 'ad_script' ? [{ id: a.id, script: a.content }] : []));
  const scriptRefs = new Map(scripts.map((s, i) => [`s${i + 1}`, s]));
  const data = await planChat({
    plan: {
      campaign: {
        name: campaign.name,
        big_idea: campaign.big_idea,
        tagline: campaign.tagline,
        business_name: campaign.business_name,
        target_audience: campaign.target_audience,
        goal: campaign.goal,
        tone: campaign.tone,
        offer: campaign.offer,
        start_date: campaign.start_date,
        duration_weeks: campaign.duration_weeks,
        channels: campaign.channels,
      },
      phases: campaign.phases.map((p) => ({ name: p.name, starts_on: p.starts_on, ends_on: p.ends_on })),
      items: campaign.items.map((item, i) => ({
        ref: refFor(i),
        date: item.scheduled_on,
        channel: item.channel,
        format: item.format,
        status: item.status,
        title: item.title,
        hook: item.hook,
        body: item.body,
        cta: item.cta,
        visual: item.visual,
        reach: item.reach,
        clicks: item.clicks,
        results: item.conversions,
      })),
      scripts: scripts.map((s, i) => ({ ref: `s${i + 1}`, ...s.script })),
    },
    history: history.filter((m) => !m.error).slice(-10).map((m) => ({ role: m.role, text: m.text })),
    message,
    focus: focusId ? refFor(campaign.items.findIndex((i) => i.id === focusId)) : null,
  });
  if (typeof data?.reply !== 'string') throw new Error(GENERIC_ERROR);
  const details = campaignChange(data.campaign, campaign);
  // New posts may use dates up to the new end, so a longer campaign and its new posts arrive together.
  const planWeeks = Math.max(campaign.duration_weeks, details?.op.kind === 'campaign' ? details.op.patch.duration_weeks ?? 0 : 0);
  const raw = Array.isArray(data.changes) ? data.changes.slice(0, 20) : [];
  const changes = raw.flatMap((c) => {
    const change = toChange(c, refs, campaign, planWeeks);
    return change ? [change] : [];
  });
  const rawScripts = Array.isArray(data.scripts) ? data.scripts.slice(0, 10) : [];
  const scriptChanges = rawScripts.flatMap((c) => {
    const change = toScriptChange(c, scriptRefs);
    return change ? [change] : [];
  });
  return {
    key: newKey(),
    role: 'assistant',
    text: data.reply,
    changes: [...(details ? [details] : []), ...changes, ...scriptChanges],
    skipped: raw.length - changes.length + rawScripts.length - scriptChanges.length,
  };
}

function campaignChange(raw: unknown, campaign: CampaignDetail): ProposedChange | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const patch: CampaignPatch = {};
  const before: CampaignPatch = {};
  for (const key of ['name', 'tagline', 'big_idea', 'offer'] as const) {
    const v = typeof r[key] === 'string' ? (r[key] as string).trim() : '';
    if (v && v !== (campaign[key] ?? '')) {
      Object.assign(patch, { [key]: v });
      Object.assign(before, { [key]: campaign[key] });
    }
  }
  const weeks = r.duration_weeks;
  if (typeof weeks === 'number' && Number.isInteger(weeks) && weeks >= 1 && weeks <= MAX_WEEKS && weeks !== campaign.duration_weeks) {
    patch.duration_weeks = weeks;
    before.duration_weeks = campaign.duration_weeks;
  }
  if (Object.keys(patch).length === 0) return null;
  return { key: newKey(), op: { kind: 'campaign', patch }, reason: '', before: null, beforeCampaign: before, state: 'pending' };
}

function toScriptChange(value: unknown, refs: Map<string, { id: string; script: AdScript }>): ProposedChange | null {
  const c = (value ?? {}) as { op?: unknown; ref?: unknown; reason?: unknown; script?: unknown };
  const reason = typeof c.reason === 'string' ? c.reason : '';
  const target = typeof c.ref === 'string' ? refs.get(c.ref) : undefined;
  const script = cleanScript(c.script);
  if (c.op === 'delete' && target) {
    return { key: newKey(), op: { kind: 'script_delete', id: target.id }, reason, before: null, beforeScript: target.script, state: 'pending' };
  }
  if (c.op === 'update' && target && script) {
    return { key: newKey(), op: { kind: 'script_update', id: target.id, script }, reason, before: null, beforeScript: target.script, state: 'pending' };
  }
  if (c.op === 'create' && script) {
    return { key: newKey(), op: { kind: 'script_create', script }, reason, before: null, state: 'pending' };
  }
  return null;
}

/** A script needs a title, a sensible length and at least one complete scene. */
function cleanScript(raw: unknown): AdScript | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const seconds = r.length_seconds;
  if (!text(r.title) || typeof seconds !== 'number' || seconds < 1 || seconds > 180 || !Array.isArray(r.scenes)) return null;
  const scenes = r.scenes
    .map((s) => (s ?? {}) as Record<string, unknown>)
    .map((s) => ({ time: text(s.time), visual: text(s.visual), voiceover: text(s.voiceover), on_screen_text: text(s.on_screen_text) }))
    .filter((s) => s.time && (s.visual || s.voiceover));
  if (scenes.length === 0) return null;
  return { title: text(r.title), platform: text(r.platform) || 'Any', length_seconds: Math.round(seconds), cta: text(r.cta), scenes };
}

type RawChange = { op?: unknown; ref?: unknown; reason?: unknown; fields?: Record<string, unknown> };

function toChange(value: unknown, refs: Map<string, CalendarItem>, campaign: CampaignDetail, weeks: number): ProposedChange | null {
  const c = (value ?? {}) as RawChange;
  const reason = typeof c.reason === 'string' ? c.reason : '';
  const fields = cleanFields(c.fields ?? {}, campaign, weeks);
  const target = typeof c.ref === 'string' ? refs.get(c.ref) : undefined;

  if (c.op === 'delete' && target) {
    return { key: newKey(), op: { kind: 'delete', id: target.id }, reason, before: target, state: 'pending' };
  }
  if (c.op === 'update' && target) {
    const patch: ItemPatch = {};
    for (const field of EDITABLE) {
      const next = fields[field];
      if (next !== undefined && next !== (target[field] ?? '')) patch[field] = next;
    }
    if (Object.keys(patch).length === 0) return null;
    return { key: newKey(), op: { kind: 'update', id: target.id, patch }, reason, before: target, state: 'pending' };
  }
  if (c.op === 'create' && fields.title && fields.scheduled_on) {
    const format = fields.format ?? 'Photo post';
    const item: NewItem = {
      phase_id: null,
      scheduled_on: fields.scheduled_on,
      channel: fields.channel ?? campaign.channels[0] ?? 'instagram',
      format,
      est_minutes: postTypeFor(format).minutes,
      title: fields.title,
      hook: fields.hook ?? null,
      body: fields.body ?? null,
      cta: fields.cta ?? null,
      visual: fields.visual ?? null,
      why: reason || null,
      status: 'draft',
      reach: null,
      clicks: null,
      conversions: null,
      sort: campaign.items.length,
    };
    return { key: newKey(), op: { kind: 'create', item }, reason, before: null, state: 'pending' };
  }
  return null;
}

/** Keeps only sensible values: real text, a known channel, a date inside the campaign. */
function cleanFields(raw: Record<string, unknown>, campaign: CampaignDetail, weeks: number): Partial<Record<EditableField, string>> {
  const out: Partial<Record<EditableField, string>> = {};
  const lastDay = addDaysIso(campaign.start_date, weeks * 7 - 1);
  for (const field of EDITABLE) {
    const value = raw[field];
    if (typeof value !== 'string' || !value.trim()) continue;
    const v = value.trim();
    if (field === 'channel') {
      const channel = v.toLowerCase();
      if (campaign.channels.includes(channel)) out.channel = channel;
    } else if (field === 'scheduled_on') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v) && v >= campaign.start_date && v <= lastDay) out.scheduled_on = v;
    } else {
      out[field] = v;
    }
  }
  return out;
}

/** Which fields an update touches, for the before/after view. */
export function changedFields(change: ProposedChange): EditableField[] {
  if (change.op.kind === 'update') return EDITABLE.filter((f) => f in (change.op as { patch: ItemPatch }).patch);
  if (change.op.kind === 'create') return EDITABLE.filter((f) => !!(change.op as { item: NewItem }).item[f]);
  return [];
}
