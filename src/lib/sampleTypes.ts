import type { AdScript, CopyBank, CreativeBrief, Goal } from '@/lib/campaigns';

export type SampleId = 'coffee' | 'yoga' | 'salon' | 'plumber' | 'boutique' | 'bookkeeper';

/** What the picker shows for each example business. */
export type SampleMeta = {
  id: SampleId;
  /** The kind of business, as a person would say it. */
  label: string;
  business: string;
  goalLabel: string;
  channels: string[];
  blurb: string;
};

/** day, channel, title, format, hook, body, visual, why, optional call to action. */
export type SamplePost = [day: number, channel: string, title: string, format: string, hook: string, body: string, visual: string, why: string, cta?: string];

/**
 * Everything one example campaign needs. The campaign starts 11 days ago, so "today" lands in week 2:
 * posts up to day 8 are done, days 9 and 10 are ready, later ones are drafts, and the last are ideas.
 */
export type SampleSpec = {
  meta: SampleMeta;
  name: string;
  big_idea: string;
  tagline: string;
  business_name: string;
  business_brief: string;
  target_audience: string;
  goal: Goal;
  offer: string;
  tone: string;
  story_recipe: 'auto' | 'problem' | 'hero' | 'backstage' | 'aida';
  goal_label: string;
  goal_target: number;
  duration_weeks: number;
  channels: string[];
  phases: [name: string, objective: string, from: number, to: number][];
  posts: SamplePost[];
  /** conversions, reach, clicks for each done post, in date order. */
  logged: [number, number, number][];
  defaultCta: Record<string, string>;
  ideas: [title: string, description: string, channel: string, format: string][];
  scripts: AdScript[];
  copy: CopyBank;
  brief: CreativeBrief;
};
