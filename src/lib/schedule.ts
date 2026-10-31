const DAY_MS = 86_400_000;

export function toDayNumber(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

export function todayIso(): string {
  return new Date().toLocaleDateString('en-CA');
}

export function formatDayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

export function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function weekIndexFor(iso: string, startIso: string): number {
  return Math.floor((toDayNumber(iso) - toDayNumber(startIso)) / 7);
}

export function addDaysIso(iso: string, days: number): string {
  return new Date((toDayNumber(iso) + days) * DAY_MS).toISOString().slice(0, 10);
}

export function currentWeekIndex(startIso: string, weeks: number): number {
  const index = weekIndexFor(todayIso(), startIso);
  return Math.min(Math.max(index, 0), weeks - 1);
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}
