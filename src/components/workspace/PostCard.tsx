import { AlertTriangle, Check, Clock } from 'lucide-react';
import ChannelChip from '@/components/ChannelChip';
import { STATUS_LABELS, type CalendarItem } from '@/lib/campaigns';
import { flauntCheck } from '@/lib/check';
import { postTypeFor } from '@/lib/postTypes';
import { formatDayLabel } from '@/lib/schedule';

type PostCardProps = {
  item: CalendarItem;
  onToggle: () => void;
  onOpen: () => void;
};

export default function PostCard({ item, onToggle, onOpen }: PostCardProps) {
  const done = item.status === 'done';
  const issues = done ? [] : flauntCheck(item);
  const type = postTypeFor(item.format);

  return (
    <li className={`card group flex items-start gap-4 p-4 transition-colors sm:p-5 ${done ? '!bg-blush/50' : 'hover:border-muted'}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Posted: ${item.title}`}
        onClick={onToggle}
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-ink transition-all active:scale-95 ${
          done ? 'bg-sage text-white' : 'bg-surface hover:bg-blush'
        }`}
      >
        <Check className={`h-5 w-5 ${done ? '' : 'opacity-20'}`} strokeWidth={3} aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-mono text-xs text-muted">{formatDayLabel(item.scheduled_on)}</span>
          <ChannelChip channel={item.channel} />
          <span className="text-muted">{type.label}</span>
          {item.est_minutes ? (
            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted">
              <Clock className="h-3 w-3" aria-hidden />
              {item.est_minutes} min
            </span>
          ) : null}
          {item.status === 'ready' && <span className="pill bg-teal/15 text-teal">{STATUS_LABELS.ready}</span>}
          {issues.length > 0 && (
            <span className="pill bg-honey/25 text-ink" title={issues.map((i) => i.message).join('\n')}>
              <AlertTriangle className="h-3 w-3" aria-hidden /> {issues.length} to fix
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className={`mt-1.5 block text-left text-lg font-bold leading-snug underline-offset-4 hover:underline ${done ? 'text-muted line-through' : ''}`}
        >
          {item.title}
        </button>
        {item.hook && <p className="mt-1 text-muted">&ldquo;{item.hook}&rdquo;</p>}
      </div>
    </li>
  );
}
