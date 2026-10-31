import type { Goal } from '@/lib/campaigns';

export const GOAL_LABELS: Record<Goal, string> = {
  awareness: 'New followers',
  leads: 'Sign-ups',
  sales: 'Sales',
  launch: 'First orders',
  event: 'RSVPs',
  retention: 'Repeat orders',
};

export const DEFAULT_GOAL_TARGET = 150;

export function goalLabelFor(goal: Goal, custom?: string | null): string {
  return custom?.trim() || GOAL_LABELS[goal];
}

/** Where to find each number, per channel, for the "How did it do?" box. */
export const RESULT_HINTS: Record<string, string> = {
  instagram: 'Open the post → View insights. People reached = "Accounts reached". Clicks = "Link taps" or profile visits.',
  tiktok: 'Open the video → ⋯ → Analytics. People reached = "Viewers". Clicks = profile views or link clicks.',
  linkedin: 'Open the post → View analytics. People reached = "Members reached". Clicks = "Clicks".',
  email: 'Your email tool’s report. People reached = "Opens". Clicks = "Clicks".',
  facebook: 'Open the post → See insights. People reached = "Reach". Clicks = "Link clicks".',
  google: 'Google Ads → Campaigns. People reached = "Impressions". Clicks = "Clicks".',
  blog: 'Your site analytics. People reached = "Page views". Clicks = clicks on your call to action.',
};
