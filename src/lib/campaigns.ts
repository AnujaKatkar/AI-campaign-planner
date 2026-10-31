import { supabase } from '@/lib/supabase';

export type Goal = 'awareness' | 'leads' | 'sales' | 'launch' | 'event' | 'retention';
export type Workload = 'light' | 'steady' | 'allin';
export type Channel = 'instagram' | 'tiktok' | 'linkedin' | 'email' | 'facebook' | 'google' | 'blog';

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

export type CalendarItem = {
  id: string;
  phase_id: string | null;
  scheduled_on: string;
  channel: string;
  format: string;
  est_minutes: number | null;
  title: string;
  hook: string | null;
  status: ItemStatus;
};

export type CampaignDetail = {
  id: string;
  name: string;
  big_idea: string | null;
  tagline: string | null;
  start_date: string;
  duration_weeks: number;
  phases: Phase[];
  items: CalendarItem[];
};

export const GENERIC_ERROR = 'Something went wrong. Please try again.';

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

export async function generateCampaign(brief: BriefInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke('flaunt-generate', { body: brief });
  if (error) throw new Error(await readFunctionError(error));
  const campaignId = (data as { campaign_id?: unknown } | null)?.campaign_id;
  if (typeof campaignId !== 'string') throw new Error(GENERIC_ERROR);
  return campaignId;
}

export async function getCampaignDetail(id: string): Promise<CampaignDetail> {
  const [campaignRes, phasesRes, itemsRes] = await Promise.all([
    supabase
      .from('campaigns')
      .select('id, name, big_idea, tagline, start_date, duration_weeks')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('campaign_phases')
      .select('id, name, objective, starts_on, ends_on')
      .eq('campaign_id', id)
      .order('sort'),
    supabase
      .from('calendar_items')
      .select('id, phase_id, scheduled_on, channel, format, est_minutes, title, hook, status')
      .eq('campaign_id', id)
      .order('scheduled_on')
      .order('sort'),
  ]);
  if (campaignRes.error || !campaignRes.data) throw new Error(GENERIC_ERROR);
  if (phasesRes.error || !Array.isArray(phasesRes.data)) throw new Error(GENERIC_ERROR);
  if (itemsRes.error || !Array.isArray(itemsRes.data)) throw new Error(GENERIC_ERROR);
  return {
    ...(campaignRes.data as Omit<CampaignDetail, 'phases' | 'items'>),
    phases: phasesRes.data as Phase[],
    items: itemsRes.data as CalendarItem[],
  };
}

export async function setItemStatus(itemId: string, status: ItemStatus): Promise<void> {
  const { error } = await supabase.from('calendar_items').update({ status }).eq('id', itemId);
  if (error) throw new Error(GENERIC_ERROR);
}

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const { data, error } = await supabase
    .from('campaign_summary')
    .select('id, name, goal, start_date, duration_weeks, status, total_items, done_items, updated_at')
    .order('updated_at', { ascending: false });
  if (error || !Array.isArray(data)) throw new Error(GENERIC_ERROR);
  return data as CampaignSummary[];
}
