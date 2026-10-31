import { Check } from 'lucide-react';
import type { CalendarItem, ItemStatus } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { formatDayLabel } from '@/lib/schedule';

type PostCardProps = {
  item: CalendarItem;
  onStatusChange: (status: ItemStatus) => void;
};

export default function PostCard({ item, onStatusChange }: PostCardProps) {
  const done = item.status === 'done';
  const channel = channelMeta(item.channel);

  return (
    <li className={`card flex items-start gap-4 p-5 transition-colors ${done ? 'bg-cream' : 'bg-white'}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark "${item.title}" as posted`}
        onClick={() => onStatusChange(done ? 'draft' : 'done')}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink transition-colors ${
          done ? 'bg-sage text-white' : 'bg-white hover:bg-blush'
        }`}
      >
        {done && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono text-muted">{formatDayLabel(item.scheduled_on)}</span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: channel.color }}>
            {channel.label}
          </span>
          <span className="text-muted">
            {item.format}
            {item.est_minutes ? ` · ${item.est_minutes} min` : ''}
          </span>
        </div>
        <h3 className={`mt-2 text-lg font-bold leading-snug ${done ? 'text-muted line-through' : ''}`}>{item.title}</h3>
        {item.hook && <p className="mt-1 text-muted">&ldquo;{item.hook}&rdquo;</p>}
      </div>
    </li>
  );
}
