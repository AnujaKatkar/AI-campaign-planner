import type { CalendarItem } from '@/lib/campaigns';

export type CheckIssue = { id: string; message: string };

const RISKY = /\b(best|guaranteed?|guarantees|number one|no\.? ?1)\b|#1\b|\d+(\.\d+)?\s?%/i;

/** The Flaunt check: catches the things that get small businesses in trouble or get ignored. */
export function flauntCheck(item: Pick<CalendarItem, 'title' | 'hook' | 'body' | 'cta'>): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const text = [item.title, item.hook, item.body, item.cta].filter(Boolean).join(' ');
  const risky = text.match(RISKY);
  if (risky) issues.push({ id: 'claim', message: `"${risky[0].trim()}" is a big claim. Back it up or soften it.` });
  const placeholder = text.match(/\[[^\]]+\]/);
  if (placeholder) issues.push({ id: 'placeholder', message: `Fill in ${placeholder[0]} before you post.` });
  if (!item.hook?.trim()) issues.push({ id: 'hook', message: 'Add a hook. It is the first line people see.' });
  else if (item.hook.length > 125)
    issues.push({ id: 'long', message: `Hook is ${item.hook.length} characters. Keep it under 125 so it isn't cut off.` });
  if (!item.cta?.trim()) issues.push({ id: 'cta', message: 'Add a call to action so people know what to do next.' });
  const tags = text.match(/#[\p{L}\d_]+/gu) ?? [];
  if (tags.length > 8) issues.push({ id: 'tags', message: `${tags.length} hashtags looks spammy. Keep it to 8 or fewer.` });
  return issues;
}
