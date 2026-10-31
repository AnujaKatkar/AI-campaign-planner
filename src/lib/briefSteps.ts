import type { Channel, Goal, Workload } from '@/lib/campaigns';

export type StepId =
  | 'business_name'
  | 'business_brief'
  | 'target_audience'
  | 'goal'
  | 'duration'
  | 'workload'
  | 'offer'
  | 'channels'
  | 'tone';

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
    question: 'How do you sound?',
    why: 'Every line of copy will match this voice.',
  },
};

export const GOALS: { value: Goal; label: string; hint: string }[] = [
  { value: 'awareness', label: 'Awareness', hint: 'Get more people to know you exist.' },
  { value: 'leads', label: 'Leads', hint: 'Collect enquiries or emails from interested people.' },
  { value: 'sales', label: 'Sales', hint: 'Turn attention into orders this month.' },
  { value: 'launch', label: 'Launch', hint: 'Build buzz for something new.' },
  { value: 'event', label: 'Event', hint: 'Fill seats or get people through the door.' },
  { value: 'retention', label: 'Retention', hint: 'Bring past customers back.' },
];

export const DURATIONS = [2, 4, 6, 8, 12];

export const WORKLOADS: { value: Workload; label: string; hint: string }[] = [
  { value: 'light', label: 'Light', hint: 'About 3 posts a week' },
  { value: 'steady', label: 'Steady', hint: 'About 5 posts a week' },
  { value: 'allin', label: 'All-in', hint: 'Every channel on a full schedule' },
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

export const TONES = ['Bold', 'Playful', 'Premium', 'Warm', 'Witty'];
