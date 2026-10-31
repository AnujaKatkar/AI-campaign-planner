import { GENERIC_ERROR, planChat, type CalendarItem, type CampaignDetail, type ItemPatch, type NewItem } from '@/lib/campaigns';
import { postTypeFor } from '@/lib/postTypes';
import { addDaysIso } from '@/lib/schedule';

/** One edit to the plan. The workspace applies these and hands back the opposite edit for undo. */
export type PlanOp =
  | { kind: 'update'; id: string; patch: ItemPatch }
  | { kind: 'create'; item: NewItem }
  | { kind: 'delete'; id: string };

export type ChangeState = 'pending' | 'applying' | 'accepted' | 'rejected' | 'failed';

export type ProposedChange = {
  key: string;
  op: PlanOp;
  reason: string;
  /** The post as it was when the AI suggested this; shown as "before". */
  before: CalendarItem | null;
  state: ChangeState;
  undo?: PlanOp;
};

export type ChatMessage = {
  key: string;
  role: 'user' | 'assistant';
  text: string;
  error?: boolean;
  changes?: ProposedChange[];
};

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
  const data = await planChat({
    plan: {
      campaign: {
        name: campaign.name,
        big_idea: campaign.big_idea,
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
    },
    history: history.filter((m) => !m.error).slice(-10).map((m) => ({ role: m.role, text: m.text })),
    message,
    focus: focusId ? refFor(campaign.items.findIndex((i) => i.id === focusId)) : null,
  });
  if (typeof data?.reply !== 'string') throw new Error(GENERIC_ERROR);
  const raw = Array.isArray(data.changes) ? data.changes : [];
  const changes = raw.slice(0, 20).flatMap((c) => {
    const change = toChange(c, refs, campaign);
    return change ? [change] : [];
  });
  return { key: newKey(), role: 'assistant', text: data.reply, changes };
}

type RawChange = { op?: unknown; ref?: unknown; reason?: unknown; fields?: Record<string, unknown> };

function toChange(value: unknown, refs: Map<string, CalendarItem>, campaign: CampaignDetail): ProposedChange | null {
  const c = (value ?? {}) as RawChange;
  const reason = typeof c.reason === 'string' ? c.reason : '';
  const fields = cleanFields(c.fields ?? {}, campaign);
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
function cleanFields(raw: Record<string, unknown>, campaign: CampaignDetail): Partial<Record<EditableField, string>> {
  const out: Partial<Record<EditableField, string>> = {};
  const lastDay = addDaysIso(campaign.start_date, campaign.duration_weeks * 7 - 1);
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
