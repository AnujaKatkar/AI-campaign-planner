import { AlertTriangle, Check, Clock, Images } from 'lucide-react';
import ChannelChip from '@/components/ChannelChip';
import { usePhotoUrls } from '@/hooks/usePhotoUrls';
import { STATUS_LABELS, type CalendarItem } from '@/lib/campaigns';
import { flauntCheck } from '@/lib/check';
import { photosOf } from '@/lib/media';
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
  const photos = photosOf(item);
  const cover = photos[0]?.path;
  const { urls } = usePhotoUrls(cover ? [cover] : []);

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

      {cover && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${item.title} (${photos.length} photo${photos.length > 1 ? 's' : ''})`}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-blush sm:h-20 sm:w-20"
        >
          {urls[cover] && <img src={urls[cover]} alt="" className={`h-full w-full object-cover ${done ? 'opacity-60' : ''}`} />}
          {photos.length > 1 && (
            <span className="pill absolute bottom-1 right-1 bg-ink/80 !px-1.5 text-cream">
              <Images className="h-3 w-3" aria-hidden />
              {photos.length}
            </span>
          )}
        </button>
      )}
    </li>
  );
}
