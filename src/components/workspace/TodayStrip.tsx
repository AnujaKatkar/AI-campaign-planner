import { Send } from 'lucide-react';
import ChannelChip from '@/components/ChannelChip';
import type { CalendarItem } from '@/lib/campaigns';
import { addDaysIso, formatDayLabel, todayIso } from '@/lib/schedule';

type TodayStripProps = {
  items: CalendarItem[];
  onPostNow: (item: CalendarItem) => void;
  onOpen: (item: CalendarItem) => void;
};

const SHOWN = 4;
// Older than this and a post is probably abandoned, so it stops nagging.
const STALE_AFTER_DAYS = 14;

/** What to post today, plus anything from the last two weeks that is still waiting. Hidden when there is nothing due. */
export default function TodayStrip({ items, onPostNow, onOpen }: TodayStripProps) {
  const today = todayIso();
  const oldest = addDaysIso(today, -STALE_AFTER_DAYS);
  const due = items
    .filter((i) => (i.status === 'draft' || i.status === 'ready') && i.scheduled_on <= today && i.scheduled_on >= oldest)
    .sort((a, b) => {
      const aToday = a.scheduled_on === today ? 0 : 1;
      const bToday = b.scheduled_on === today ? 0 : 1;
      return aToday - bToday || a.scheduled_on.localeCompare(b.scheduled_on) || a.sort - b.sort;
    });
  if (due.length === 0) return null;

  const todayCount = due.filter((i) => i.scheduled_on === today).length;
  const waiting = due.length - todayCount;
  const heading =
    todayCount > 0
      ? `Today: ${todayCount} ${todayCount === 1 ? 'post' : 'posts'} to put out`
      : `${waiting} ${waiting === 1 ? 'post is' : 'posts are'} still waiting for you`;

  return (
    <section aria-label="Post today" className="card mt-6 border-2 border-honey/60 p-5">
      <p className="eyebrow">Today</p>
      <h2 className="mt-1 text-xl font-extrabold">{heading}</h2>
      {todayCount > 0 && waiting > 0 && (
        <p className="mt-0.5 text-sm text-muted">
          Plus {waiting} from earlier. No stress, just pick one.
        </p>
      )}
      <ul className="mt-3 divide-y divide-line">
        {due.slice(0, SHOWN).map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <ChannelChip channel={item.channel} />
            <button type="button" onClick={() => onOpen(item)} className="min-w-0 flex-1 truncate text-left font-bold underline-offset-4 hover:underline">
              {item.title}
            </button>
            {item.scheduled_on !== today && <span className="text-xs text-muted">was {formatDayLabel(item.scheduled_on)}</span>}
            <button type="button" onClick={() => onPostNow(item)} className="btn-soft !border-teal/40">
              <Send className="h-4 w-4 text-teal" aria-hidden /> Post now
            </button>
          </li>
        ))}
      </ul>
      {due.length > SHOWN && <p className="mt-1 text-sm text-muted">And {due.length - SHOWN} more in the calendar below.</p>}
    </section>
  );
}
