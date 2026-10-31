import type { CampaignDetail } from '@/lib/campaigns';
import { STATUS_LABELS } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { postTypeFor } from '@/lib/postTypes';

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function usDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'flaunt-campaign';
}

export function exportGoogleCalendar(c: CampaignDetail) {
  const rows = c.items.map((i) => [
    `${channelMeta(i.channel).label}: ${i.title}`,
    usDate(i.scheduled_on),
    'True',
    [i.hook, i.body, i.cta && `CTA: ${i.cta}`].filter(Boolean).join('\n\n'),
  ]);
  download(`${slug(c.name)}-google-calendar.csv`, toCsv([['Subject', 'Start Date', 'All Day Event', 'Description'], ...rows]));
}

export function exportPlanCsv(c: CampaignDetail) {
  const phaseName = (id: string | null) => c.phases.find((p) => p.id === id)?.name ?? '';
  const rows = c.items.map((i) => [
    i.scheduled_on,
    phaseName(i.phase_id),
    channelMeta(i.channel).label,
    postTypeFor(i.format).label,
    STATUS_LABELS[i.status],
    i.title,
    i.hook,
    i.body,
    i.cta,
    i.visual,
    i.est_minutes,
    i.reach,
    i.clicks,
    i.conversions,
  ]);
  const header = ['Date', 'Phase', 'Channel', 'Post type', 'Status', 'Title', 'Hook', 'Body', 'Call to action', 'What to shoot', 'Minutes', 'People reached', 'Clicks', 'Goal results'];
  download(`${slug(c.name)}-plan.csv`, toCsv([header, ...rows]));
}

export function planAsText(c: CampaignDetail): string {
  const lines = [`${c.name}`, c.big_idea ?? '', c.tagline ? `"${c.tagline}"` : '', ''];
  c.phases.forEach((phase) => {
    lines.push(`== ${phase.name} (${phase.starts_on} to ${phase.ends_on})`, phase.objective ?? '', '');
    c.items
      .filter((i) => i.phase_id === phase.id)
      .forEach((i) => {
        lines.push(`${i.scheduled_on} · ${channelMeta(i.channel).label} · ${postTypeFor(i.format).label}`, `  ${i.title}`);
        if (i.hook) lines.push(`  Hook: ${i.hook}`);
        if (i.body) lines.push(`  ${i.body}`);
        if (i.cta) lines.push(`  CTA: ${i.cta}`);
        lines.push('');
      });
  });
  const loose = c.items.filter((i) => !c.phases.some((p) => p.id === i.phase_id));
  loose.forEach((i) => lines.push(`${i.scheduled_on} · ${channelMeta(i.channel).label} · ${i.title}`));
  return lines.join('\n').trim();
}
