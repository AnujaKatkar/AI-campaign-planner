import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import CopyButton from '@/components/CopyButton';
import { useToast } from '@/components/Toast';
import { usePhotoUrls } from '@/hooks/usePhotoUrls';
import type { CalendarItem } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { captionOf, photosOf, sharePost } from '@/lib/media';

type PostPreviewProps = {
  item: CalendarItem;
  businessName: string;
};

// Roughly how each app crops a feed photo.
const SHAPE: Record<string, string> = {
  instagram: 'aspect-[4/5]',
  tiktok: 'aspect-[9/16] max-h-[420px]',
};

/** A phone-style look at the finished post, plus the button that gets it out of Flaunt. */
export default function PostPreview({ item, businessName }: PostPreviewProps) {
  const toast = useToast();
  const photos = photosOf(item);
  const { urls } = usePhotoUrls(photos.map((p) => p.path));
  const caption = captionOf(item);
  const [slide, setSlide] = useState(0);
  const [busy, setBusy] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  const photoKey = photos.map((p) => p.path).join('|');
  // Show the cover again whenever photos are added, removed or reordered.
  useEffect(() => {
    strip.current?.scrollTo({ left: 0 });
    setSlide(0);
  }, [photoKey]);
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  function goTo(i: number) {
    const el = strip.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }

  async function handleShare() {
    setBusy(true);
    try {
      const how = await sharePost(item);
      if (how === 'downloaded') toast(photos.length ? `Downloaded ${photos.length} photo${photos.length > 1 ? 's' : ''} and the caption.` : 'Downloaded the caption.');
      if (how === 'shared') toast('Shared. The caption is on your clipboard too.');
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't get the post ready. Try again.", 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="label">Preview</span>
      <div className="mx-auto max-w-sm overflow-hidden rounded-[28px] border-2 border-ink bg-surface shadow-lift">
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose font-display text-sm font-extrabold text-on-rose">
            {businessName.trim().charAt(0).toUpperCase() || 'F'}
          </span>
          <span className="text-sm font-bold">{businessName || 'Your business'}</span>
          <span className="ml-auto text-xs text-muted">{channelMeta(item.channel).label}</span>
        </div>

        {photos.length > 0 ? (
          <div className="relative">
            <div
              ref={strip}
              onScroll={(e) => {
                const el = e.currentTarget;
                setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
              }}
              className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {photos.map((p, i) => (
                <div key={p.path} className={`w-full shrink-0 snap-center bg-blush ${SHAPE[item.channel] ?? 'aspect-square'}`}>
                  {urls[p.path] && <img src={urls[p.path]} alt={`Slide ${i + 1} of ${photos.length}`} className="h-full w-full object-cover" />}
                </div>
              ))}
            </div>
            {photos.length > 1 && (
              <>
                <span className="pill absolute right-2 top-2 bg-ink/80 text-cream">
                  {slide + 1}/{photos.length}
                </span>
                <div className="flex justify-center gap-1.5 py-2">
                  {photos.map((p, i) => (
                    <button
                      key={p.path}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Show slide ${i + 1}`}
                      aria-current={i === slide}
                      className={`h-2 w-2 rounded-full ${i === slide ? 'bg-teal' : 'bg-line'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mx-4 flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-line px-6 text-center text-sm text-muted">
            {item.visual ? `No photo yet. Shoot: ${item.visual}` : 'No photo yet. Add one above.'}
          </div>
        )}

        <p className="whitespace-pre-line px-4 pb-4 pt-3 text-sm">
          {caption ? (
            <>
              <span className="font-bold">{businessName || 'you'}</span> {caption}
            </>
          ) : (
            <span className="text-muted">Write the hook and post text to see the caption here.</span>
          )}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={handleShare} disabled={busy || (!photos.length && !caption)} className="btn-soft !border-teal/40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : touch ? <Share2 className="h-4 w-4 text-teal" aria-hidden /> : <Download className="h-4 w-4 text-teal" aria-hidden />}
          {touch ? 'Share post' : 'Download post'}
        </button>
        {caption && <CopyButton text={caption} label="Copy caption" />}
      </div>
    </div>
  );
}
