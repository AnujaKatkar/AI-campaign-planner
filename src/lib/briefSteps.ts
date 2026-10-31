import type { BriefInput, Channel, Goal, StoryRecipe, Workload } from '@/lib/campaigns';

export type StepId =
  | 'business_name'
  | 'business_brief'
  | 'target_audience'
  | 'goal'
  | 'duration'
  | 'workload'
  | 'offer'
  | 'channels'
  | 'tone'
  | 'story_recipe';

export const STEP_IDS: StepId[] = [
  'business_name',
  'business_brief',
  'target_audience',
  'goal',
  'duration',
  'workload',
  'offer',
  'channels',
  'tone',
  'story_recipe',
];

export const STEP_COPY: Record<StepId, { question: string; why: string; placeholder?: string; optional?: boolean }> = {
  business_name: {
    question: "What's the business called?",
    why: 'We use the name in every post and headline.',
    placeholder: 'Maple & Main Bakery',
  },
  business_brief: {
    question: 'What do you sell or offer?',
    why: 'The plan is built around your real product, so be specific.',
    placeholder: 'Fresh sourdough and weekend pastries, delivered locally',
  },
  target_audience: {
    question: 'Who do you want to reach?',
    why: 'Every hook and visual is written for this person.',
    placeholder: 'Busy parents within 10 minutes of the shop',
  },
  goal: {
    question: 'What do you want people to do?',
    why: 'The goal decides the call to action on every post.',
  },
  duration: {
    question: 'How long should the campaign run?',
    why: 'Longer campaigns get more phases and more posts.',
  },
  workload: {
    question: 'How much can you handle?',
    why: 'We only plan the posts you can actually make.',
  },
  offer: {
    question: 'Is there an offer or hook?',
    why: 'One clear thing for people to act on. Leave blank and we will suggest one.',
    placeholder: 'Free pastry with every loaf this month',
    optional: true,
  },
  channels: {
    question: 'Where will you show up?',
    why: 'We only plan posts for the places you pick.',
  },
  tone: {
    question: 'What tone fits your brand?',
    why: 'Every line of copy will match this voice.',
  },
  story_recipe: {
    question: 'Pick a storyline',
    why: 'The shape every post follows. Not sure? Let Flaunt pick.',
    optional: true,
  },
};

export const GOALS: { value: Goal; label: string; hint: string; icon: string }[] = [
  { value: 'awareness', icon: '📣', label: 'Awareness', hint: 'More posts that travel far (videos, shareable tips). Success = new followers.' },
  { value: 'leads', icon: '✉️', label: 'Leads', hint: 'Every post points to a sign-up or enquiry. Success = sign-ups.' },
  { value: 'sales', icon: '🛒', label: 'Sales', hint: 'Product-first posts with a clear offer and deadline. Success = sales.' },
  { value: 'launch', icon: '🚀', label: 'Launch', hint: 'Tease first, reveal big, then prove it. Success = first orders.' },
  { value: 'event', icon: '🎟️', label: 'Event', hint: 'A countdown that builds to the date. Success = RSVPs.' },
  { value: 'retention', icon: '💛', label: 'Retention', hint: 'More email and loyalty posts for people who already know you. Success = repeat orders.' },
];

export const DURATIONS = [2, 4, 6, 8, 12];

export const WORKLOADS: { value: Workload; label: string; hint: string }[] = [
  { value: 'light', label: 'Light', hint: 'About 3 posts a week · roughly 1.5 hr' },
  { value: 'steady', label: 'Steady', hint: 'About 5 posts a week · roughly 2.5 hr' },
  { value: 'allin', label: 'All-in', hint: 'Every channel on a full schedule · 5 hr+' },
];

export const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google Ads' },
  { value: 'blog', label: 'Blog' },
];

export const TONES: { value: string; hint: string; sample: string }[] = [
  { value: 'Bold', hint: 'Short, punchy lines that take a stand.', sample: '“Your mornings deserve better. Fix that.”' },
  { value: 'Playful', hint: 'Light, fun and a little silly. Emojis welcome.', sample: '“Warning: may cause happy dances ☕💃”' },
  { value: 'Premium', hint: 'Calm, confident and polished. Fewer words, more weight.', sample: '“Roasted in small batches. Worth the wait.”' },
  { value: 'Warm', hint: 'Friendly and personal, like a note from a neighbour.', sample: '“We saved you a cup. Come say hi.”' },
  { value: 'Witty', hint: 'Clever wordplay and a wink. Never mean.', sample: '“Espresso yourself. We won’t judge.”' },
];

export const STORY_RECIPES: { value: StoryRecipe; label: string; hint: string }[] = [
  { value: 'auto', label: 'Let Flaunt pick', hint: 'We choose the best shape for your goal.' },
  { value: 'problem', label: 'Problem → fix', hint: 'Name the annoying thing, then show how you solve it.' },
  { value: 'hero', label: 'Customer as hero', hint: 'Your customer is the star; you are the helpful sidekick.' },
  { value: 'backstage', label: 'Behind the scenes', hint: 'Show how it’s made. People trust what they can see.' },
  { value: 'aida', label: 'Hook → want → act', hint: 'Grab attention, build desire, then ask for one action.' },
];

export type BriefStrength = { level: 0 | 1 | 2; label: 'Thin' | 'Good' | 'Strong'; tip: string | null };

/** Scores the brief so far and gives one tip at a time, most useful first. */
export function briefStrength(v: Partial<BriefInput>): BriefStrength {
  const words = (s?: string) => s?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const checks: [boolean, string][] = [
    [words(v.business_brief) >= 6, 'Say what you sell in a full sentence, like “fresh sourdough delivered on weekends”.'],
    [words(v.target_audience) >= 5, 'Describe one real person: their age, where they are, what they care about.'],
    [!!v.goal, 'Pick a goal so every post ends with the right ask.'],
    [!!v.offer?.trim(), 'Add an offer so people have one clear thing to act on.'],
    [(v.channels?.length ?? 0) >= 2, 'Two or more channels gives the plan room to breathe.'],
    [!!v.tone, 'Choose a tone so the copy sounds like you.'],
  ];
  const score = checks.filter(([ok]) => ok).length;
  const tip = checks.find(([ok]) => !ok)?.[1] ?? null;
  if (score >= 5) return { level: 2, label: 'Strong', tip };
  if (score >= 3) return { level: 1, label: 'Good', tip };
  return { level: 0, label: 'Thin', tip };
}

/** Brief fields a brainstorm must settle before the plan can be generated. Duration and workload have defaults. */
export const MUST_HAVES: { key: keyof BriefInput; label: string }[] = [
  { key: 'business_brief', label: 'What you sell' },
  { key: 'business_name', label: 'Business name' },
  { key: 'target_audience', label: 'Who to reach' },
  { key: 'goal', label: 'Goal' },
  { key: 'channels', label: 'Channels' },
  { key: 'tone', label: 'Tone' },
];

export function hasValue(v: Partial<BriefInput>, key: keyof BriefInput): boolean {
  const value = v[key];
  return Array.isArray(value) ? value.length > 0 : typeof value === 'number' ? value > 0 : !!String(value ?? '').trim();
}

/** Keeps only the AI's brief values that match an option the form offers, so a chat can never set something the form can't show. */
export function briefPatchFromAI(raw: unknown): Partial<BriefInput> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const oneOf = <T extends string | number>(v: unknown, options: readonly T[]) => (options.includes(v as T) ? (v as T) : undefined);
  const patch: Partial<BriefInput> = {
    business_name: text(r.business_name),
    business_brief: text(r.business_brief),
    target_audience: text(r.target_audience),
    offer: text(r.offer),
    goal: oneOf(r.goal, GOALS.map((g) => g.value)),
    duration_weeks: oneOf(r.duration_weeks, DURATIONS),
    workload: oneOf(r.workload, WORKLOADS.map((w) => w.value)),
    tone: oneOf(r.tone, TONES.map((t) => t.value)),
    story_recipe: oneOf(r.story_recipe, STORY_RECIPES.map((s) => s.value)),
  };
  if (Array.isArray(r.channels)) {
    const allowed = CHANNELS.map((c) => c.value);
    const channels = [...new Set(r.channels.filter((c): c is Channel => allowed.includes(c as Channel)))];
    if (channels.length) patch.channels = channels;
  }
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<BriefInput>;
}
