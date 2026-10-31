import { supabase, supabaseConfigured } from '@/lib/supabase';
import { todayIso } from '@/lib/schedule';

export type Goal = 'awareness' | 'leads' | 'sales' | 'launch' | 'event' | 'retention';
export type Workload = 'light' | 'steady' | 'allin';
export type Channel = 'instagram' | 'tiktok' | 'linkedin' | 'email' | 'facebook' | 'google' | 'blog';
export type StoryRecipe = 'auto' | 'problem' | 'hero' | 'backstage' | 'aida';

export type BriefInput = {
  business_name: string;
  business_brief: string;
  target_audience: string;
  goal: Goal;
  duration_weeks: number;
  start_date: string;
  workload: Workload;
  offer?: string;
  channels: Channel[];
  tone: string;
  story_recipe: StoryRecipe;
};

export type CampaignSummary = {
  id: string;
  name: string;
  goal: Goal;
  start_date: string;
  duration_weeks: number;
  status: string;
  total_items: number;
  done_items: number;
};

export type Phase = {
  id: string;
  name: string;
  objective: string | null;
  starts_on: string;
  ends_on: string;
};

export type ItemStatus = 'idea' | 'draft' | 'ready' | 'done';

export const STATUS_LABELS: Record<ItemStatus, string> = {
  idea: 'Idea',
  draft: 'To do',
  ready: 'Ready to post',
  done: 'Posted',
};

export type CalendarItem = {
  id: string;
  phase_id: string | null;
  scheduled_on: string;
  channel: string;
  format: string;
  est_minutes: number | null;
  title: string;
  hook: string | null;
  body: string | null;
  cta: string | null;
  visual: string | null;
  why: string | null;
  status: ItemStatus;
  reach: number | null;
  clicks: number | null;
  conversions: number | null;
  sort: number;
};

export type Idea = { title: string; description: string; channel: string; format: string };
export type Scene = { time: string; visual: string; voiceover: string; on_screen_text: string };
export type AdScript = { title: string; platform: string; length_seconds: number; cta: string; scenes: Scene[] };
export type CopyBank = {
  headlines: string[];
  primary_texts: string[];
  email_subjects: string[];
  ctas: string[];
  hashtags: string[];
};
export type CreativeBrief = {
  background: string;
  objective: string;
  audience: string;
  insight: string;
  single_minded_proposition: string;
  reasons_to_believe: string[];
  tone: string;
  mandatories: string[];
  deliverables: string[];
  kpis: string[];
};

export type Asset =
  | { id: string; kind: 'idea'; title: string | null; content: Idea; kept: boolean }
  | { id: string; kind: 'ad_script'; title: string | null; content: AdScript; kept: boolean }
  | { id: string; kind: 'copy'; title: string | null; content: CopyBank; kept: boolean }
  | { id: string; kind: 'creative_brief'; title: string | null; content: CreativeBrief; kept: boolean };

export type Campaign = {
  id: string;
  name: string;
  big_idea: string | null;
  tagline: string | null;
  business_name: string;
  business_brief: string;
  target_audience: string;
  goal: Goal;
  offer: string | null;
  start_date: string;
  duration_weeks: number;
  channels: string[];
  tone: string | null;
  workload: Workload;
  story_recipe: StoryRecipe;
  goal_label: string | null;
  goal_target: number | null;
  status: string;
};

export type CampaignDetail = Campaign & {
  phases: Phase[];
  items: CalendarItem[];
  assets: Asset[];
};

export type ItemPatch = Partial<Omit<CalendarItem, 'id'>>;
export type NewItem = Omit<CalendarItem, 'id'>;

export type RewriteStyle = 'fresh' | 'shorter' | 'spanish';
export type CopyGroup = keyof CopyBank;

/** Everything the workspace can change. The sample campaign and saved campaigns implement it differently. */
export type CampaignStore = {
  kind: 'remote' | 'sample';
  updateItem: (id: string, patch: ItemPatch) => Promise<void>;
  createItem: (item: NewItem) => Promise<CalendarItem>;
  deleteItem: (id: string) => Promise<void>;
  updateCampaign: (patch: Partial<Campaign>) => Promise<void>;
  updateAsset: (id: string, patch: { kept?: boolean; content?: unknown }) => Promise<void>;
};

export const GENERIC_ERROR = 'Something went wrong on our side. Check your connection and try again.';
export const SAVE_ERROR = "Couldn't save that change. Check your connection and try again.";
export const NOT_CONNECTED = 'Flaunt is not connected to its backend yet, so saving and AI are off. The sample campaign still works.';

async function readFunctionError(error: unknown): Promise<string> {
  const response = (error as { context?: unknown } | null)?.context;
  if (response instanceof Response) {
    try {
      const body = await response.json();
      if (typeof body?.error === 'string') return body.error;
    } catch {
      return GENERIC_ERROR;
    }
  }
  return GENERIC_ERROR;
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabaseConfigured) throw new Error(NOT_CONNECTED);
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Sign in to use AI. Your plan stays right where it is.');
  const { data, error } = await supabase.functions.invoke('flaunt-generate', { body });
  if (error) throw new Error(await readFunctionError(error));
  return data as T;
}

export async function generateCampaign(brief: BriefInput): Promise<string> {
  const data = await invoke<{ campaign_id?: unknown }>(brief);
  if (typeof data?.campaign_id !== 'string') throw new Error(GENERIC_ERROR);
  return data.campaign_id;
}

type CampaignContext = Pick<Campaign, 'business_name' | 'target_audience' | 'goal' | 'tone' | 'offer'>;

function contextOf(c: CampaignContext) {
  return {
    business_name: c.business_name,
    target_audience: c.target_audience,
    goal: c.goal,
    tone: c.tone,
    offer: c.offer,
  };
}

export async function rewriteItem(
  campaign: CampaignContext,
  item: CalendarItem,
  style: RewriteStyle,
): Promise<Pick<CalendarItem, 'title' | 'hook' | 'body' | 'cta'>> {
  const data = await invoke<{ item?: { title: string; hook: string; body: string; cta: string } }>({
    task: 'rewrite_item',
    style,
    campaign: contextOf(campaign),
    item: { channel: item.channel, format: item.format, title: item.title, hook: item.hook, body: item.body, cta: item.cta },
  });
  if (!data?.item) throw new Error(GENERIC_ERROR);
  return data.item;
}

export async function moreCopy(campaign: CampaignContext, group: CopyGroup, examples: string[]): Promise<string[]> {
  const data = await invoke<{ lines?: string[] }>({ task: 'more_copy', group, examples, campaign: contextOf(campaign) });
  if (!Array.isArray(data?.lines)) throw new Error(GENERIC_ERROR);
  return data.lines;
}

export async function askNextWeek(campaign: CampaignContext, stats: unknown): Promise<string[]> {
  const data = await invoke<{ suggestions?: string[] }>({ task: 'next_week', stats, campaign: contextOf(campaign) });
  if (!Array.isArray(data?.suggestions)) throw new Error(GENERIC_ERROR);
  return data.suggestions;
}

const ITEM_COLUMNS =
  'id, phase_id, scheduled_on, channel, format, est_minutes, title, hook, body, cta, visual, why, status, reach, clicks, conversions, sort';

export async function getCampaignDetail(id: string): Promise<CampaignDetail> {
  const [campaignRes, phasesRes, itemsRes, assetsRes] = await Promise.all([
    supabase
      .from('campaigns')
      .select(
        'id, name, big_idea, tagline, business_name, business_brief, target_audience, goal, offer, start_date, duration_weeks, channels, tone, workload, story_recipe, goal_label, goal_target, status',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('campaign_phases').select('id, name, objective, starts_on, ends_on').eq('campaign_id', id).order('sort'),
    supabase.from('calendar_items').select(ITEM_COLUMNS).eq('campaign_id', id).order('scheduled_on').order('sort'),
    supabase.from('campaign_assets').select('id, kind, title, content, kept').eq('campaign_id', id).order('created_at'),
  ]);
  if (campaignRes.error || !campaignRes.data) throw new Error(GENERIC_ERROR);
  if (phasesRes.error || !Array.isArray(phasesRes.data)) throw new Error(GENERIC_ERROR);
  if (itemsRes.error || !Array.isArray(itemsRes.data)) throw new Error(GENERIC_ERROR);
  if (assetsRes.error || !Array.isArray(assetsRes.data)) throw new Error(GENERIC_ERROR);
  return {
    ...(campaignRes.data as Campaign),
    phases: phasesRes.data as Phase[],
    items: itemsRes.data as CalendarItem[],
    assets: assetsRes.data as Asset[],
  };
}

export function remoteStore(campaignId: string): CampaignStore {
  return {
    kind: 'remote',
    async updateItem(id, patch) {
      const { error } = await supabase.from('calendar_items').update(patch).eq('id', id);
      if (error) throw new Error(SAVE_ERROR);
    },
    async createItem(item) {
      const { data, error } = await supabase
        .from('calendar_items')
        .insert({ ...item, campaign_id: campaignId })
        .select(ITEM_COLUMNS)
        .single();
      if (error || !data) throw new Error(SAVE_ERROR);
      return data as CalendarItem;
    },
    async deleteItem(id) {
      const { error } = await supabase.from('calendar_items').delete().eq('id', id);
      if (error) throw new Error(SAVE_ERROR);
    },
    async updateCampaign(patch) {
      const { error } = await supabase.from('campaigns').update(patch).eq('id', campaignId);
      if (error) throw new Error(SAVE_ERROR);
    },
    async updateAsset(id, patch) {
      const { error } = await supabase.from('campaign_assets').update(patch).eq('id', id);
      if (error) throw new Error(SAVE_ERROR);
    },
  };
}

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const { data, error } = await supabase
    .from('campaign_summary')
    .select('id, name, goal, start_date, duration_weeks, status, total_items, done_items, updated_at')
    .order('updated_at', { ascending: false });
  if (error || !Array.isArray(data)) throw new Error(GENERIC_ERROR);
  return data as CampaignSummary[];
}

const FREEZE_KEY = 'flaunt.streakFreezeWeek';

function isoWeekKey(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

/** Bumps the "showing up" streak once per day. One missed day per week is forgiven (the streak freeze). */
export async function touchStreak(userId: string): Promise<number | null> {
  const { data } = await supabase.from('profiles').select('heat_streak, last_active_on').eq('id', userId).maybeSingle();
  if (!data) return null;
  const today = todayIso();
  if (data.last_active_on === today) return data.heat_streak;

  const gap = data.last_active_on
    ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${data.last_active_on}T00:00:00Z`)) / 86_400_000)
    : Infinity;
  let streak = 1;
  if (gap === 1) streak = data.heat_streak + 1;
  else if (gap === 2) {
    let usedWeek: string | null = null;
    try {
      usedWeek = localStorage.getItem(FREEZE_KEY);
    } catch {
      usedWeek = null;
    }
    if (usedWeek !== isoWeekKey(today)) {
      streak = data.heat_streak + 1;
      try {
        localStorage.setItem(FREEZE_KEY, isoWeekKey(today));
      } catch {
        // Without storage the freeze is simply not remembered.
      }
    }
  }
  await supabase.from('profiles').update({ heat_streak: streak, last_active_on: today }).eq('id', userId);
  return streak;
}
