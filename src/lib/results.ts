import type { CalendarItem, CampaignDetail } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { DEFAULT_GOAL_TARGET, goalLabelFor } from '@/lib/goals';
import { postTypeFor } from '@/lib/postTypes';
import { weekIndexFor } from '@/lib/schedule';

export type GoalStatus = 'not_started' | 'on_track' | 'at_risk' | 'behind';
export type Metric = 'conversions' | 'reach' | 'clicks';

export function isLogged(item: CalendarItem): boolean {
  return item.reach != null || item.clicks != null || item.conversions != null;
}

export function heatPercent(items: CalendarItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.status === 'done').length / items.length) * 100);
}

export function computeResults(campaign: CampaignDetail) {
  const items = campaign.items;
  const posted = items.filter((i) => i.status === 'done');
  const logged = items.filter(isLogged);
  const sum = (metric: Metric) => items.reduce((total, i) => total + (i[metric] ?? 0), 0);
  const target = campaign.goal_target ?? DEFAULT_GOAL_TARGET;
  const conversions = sum('conversions');
  const goalPct = target > 0 ? conversions / target : 0;
  const postsPct = items.length > 0 ? posted.length / items.length : 0;
  const ratio = postsPct > 0 ? goalPct / postsPct : 0;
  const status: GoalStatus =
    posted.length === 0 ? 'not_started' : ratio >= 0.9 ? 'on_track' : ratio >= 0.6 ? 'at_risk' : 'behind';

  const byWeek = Array.from({ length: campaign.duration_weeks }, (_, week) => {
    const inWeek = items.filter((i) => weekIndexFor(i.scheduled_on, campaign.start_date) === week);
    return { week: week + 1, planned: inWeek.length, posted: inWeek.filter((i) => i.status === 'done').length };
  });

  const byChannel = (metric: Metric) =>
    campaign.channels
      .map((channel) => ({
        channel,
        label: channelMeta(channel).label,
        color: channelMeta(channel).color,
        value: items.filter((i) => i.channel === channel).reduce((t, i) => t + (i[metric] ?? 0), 0),
        posts: logged.filter((i) => i.channel === channel).length,
      }))
      .sort((a, b) => b.value - a.value);

  const topPosts = [...logged]
    .sort((a, b) => (b.conversions ?? 0) - (a.conversions ?? 0) || (b.reach ?? 0) - (a.reach ?? 0))
    .slice(0, 5);

  // What's working: channel + post type with the best average goal result per logged post.
  let working: { channel: string; type: string; avg: number; posts: number } | null = null;
  if (logged.length >= 3) {
    const groups = new Map<string, CalendarItem[]>();
    logged.forEach((i) => {
      const key = `${i.channel}|${postTypeFor(i.format).label}`;
      groups.set(key, [...(groups.get(key) ?? []), i]);
    });
    // Prefer patterns seen on 2+ posts so one lucky post doesn't steer the advice.
    const repeated = [...groups.values()].some((g) => g.length >= 2);
    groups.forEach((group, key) => {
      if (repeated && group.length < 2) return;
      const avg = group.reduce((t, i) => t + (i.conversions ?? 0), 0) / group.length;
      if (!working || avg > working.avg) {
        const [channel, type] = key.split('|');
        working = { channel, type, avg, posts: group.length };
      }
    });
  }

  return {
    goalLabel: goalLabelFor(campaign.goal, campaign.goal_label),
    target,
    conversions,
    reach: sum('reach'),
    clicks: sum('clicks'),
    posted: posted.length,
    total: items.length,
    logged: logged.length,
    goalPct,
    postsPct,
    ratio,
    status,
    byWeek,
    byChannel,
    topPosts,
    working: working as { channel: string; type: string; avg: number; posts: number } | null,
  };
}

export type Results = ReturnType<typeof computeResults>;
