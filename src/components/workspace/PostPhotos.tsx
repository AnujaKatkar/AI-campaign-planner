import { useRef, useState, type DragEvent } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import AiPhotoPanel from '@/components/workspace/AiPhotoPanel';
import { usePhotoUrls } from '@/hooks/usePhotoUrls';
import type { CampaignStore, PostPhoto } from '@/lib/campaigns';
import { MAX_PHOTOS, preparePhoto } from '@/lib/media';

type PostPhotosProps = {
  photos: PostPhoto[];
  store: Pick<CampaignStore, 'kind' | 'uploadPhoto' | 'deletePhotos'>;
  /** Saves the new photo list. Resolves true once it is stored. */
  onChange: (photos: PostPhoto[]) => Promise<boolean>;
  /** Draws AI pictures for this post; resolves with their storage paths. */
  makeAi: (instruction: string) => Promise<string[]>;
};

/** Add, reorder and remove the photos on one post. The first photo is the cover. */
export default function PostPhotos({ photos, store, onChange, makeAi }: PostPhotosProps) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const { urls, failed } = usePhotoUrls(photos.map((p) => p.path));
  // Uploads finish after the list may have changed, so always build on the latest list.
  const latest = useRef(photos);
  latest.current = photos;

  const room = MAX_PHOTOS - photos.length - uploading;

  async function addFiles(list: FileList | File[]) {
    const files = [...list].filter((f) => f.type.startsWith('image/'));
    if (!files.length) {
      toast('Pick a photo: JPEG, PNG or WebP.', 'error');
      return;
    }
    const picked = files.slice(0, Math.max(0, room));
    if (picked.length < files.length) toast(`A post can have up to ${MAX_PHOTOS} photos, so ${files.length - picked.length} were left out.`, 'error');
    if (!picked.length) return;

    setUploading((n) => n + picked.length);
    // The sample is saved in this browser's storage, which is small, so its photos are kept smaller.
    const [maxSide, quality] = store.kind === 'sample' ? [1080, 0.75] : [2048, 0.85];
    const results = await Promise.allSettled(picked.map(async (f) => store.uploadPhoto(await preparePhoto(f, maxSide, quality))));
    setUploading((n) => n - picked.length);

    const added = results.flatMap((r) => (r.status === 'fulfilled' ? [{ path: r.value }] : []));
    const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (firstError) toast(firstError.reason instanceof Error ? firstError.reason.message : "Couldn't add that photo.", 'error');
    if (added.length) {
      const saved = await onChange([...latest.current, ...added]);
      if (!saved) store.deletePhotos(added.map((p) => p.path)).catch(() => undefined);
    }
  }

  async function remove(path: string) {
    const saved = await onChange(latest.current.filter((p) => p.path !== path));
    if (saved) store.deletePhotos([path]).catch(() => undefined);
  }

  function move(index: number, by: -1 | 1) {
    const next = [...latest.current];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="label !mb-0" id="photos-label">
          Photos
        </span>
        <span className="font-mono text-xs text-muted">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>

      <div
        role="group"
        aria-labelledby="photos-label"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-3 transition-colors ${dragging ? 'border-teal bg-teal/10' : 'border-line'}`}
      >
        {photos.length === 0 && uploading === 0 ? (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex w-full flex-col items-center gap-1 rounded-xl py-6 text-center hover:bg-blush"
          >
            <ImagePlus className="h-6 w-6 text-teal" aria-hidden />
            <span className="font-bold">Add photos</span>
            <span className="text-sm text-muted">Drop them here or tap to pick. Up to {MAX_PHOTOS}; the first one is the cover.</span>
          </button>
        ) : (
          <ol className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p, i) => (
              <li key={p.path} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-blush">
                {urls[p.path] ? (
                  <img src={urls[p.path]} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">{failed ? "Couldn't load" : <Loader2 className="h-4 w-4 animate-spin" aria-label="Loading" />}</div>
                )}
                {i === 0 && <span className="pill absolute left-1 top-1 bg-ink text-cream">Cover</span>}
                <button
                  type="button"
                  onClick={() => remove(p.path)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/80 text-cream hover:bg-ink"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
                {photos.length > 1 && (
                  <div className="absolute inset-x-1 bottom-1 flex justify-between">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move photo ${i + 1} earlier`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/80 text-cream hover:bg-ink disabled:invisible"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === photos.length - 1}
                      aria-label={`Move photo ${i + 1} later`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/80 text-cream hover:bg-ink disabled:invisible"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            ))}
            {Array.from({ length: uploading }, (_, i) => (
              <li key={`up-${i}`} className="flex aspect-square items-center justify-center rounded-xl border border-line bg-blush">
                <Loader2 className="h-5 w-5 animate-spin text-teal" aria-label="Uploading" />
              </li>
            ))}
            {room > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-line text-sm font-semibold hover:bg-blush"
                >
                  <ImagePlus className="h-5 w-5 text-teal" aria-hidden /> Add
                </button>
              </li>
            )}
          </ol>
        )}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      <AiPhotoPanel
        room={room}
        make={makeAi}
        onUse={(path) => onChange([...latest.current, { path }])}
        discard={(paths) => store.deletePhotos(paths)}
      />
      {store.kind === 'sample' && photos.length > 0 && (
        <p className="mt-1.5 text-xs text-muted">Sample photos stay in this browser only. Sign in and make your own campaign to keep them.</p>
      )}
    </div>
  );
}
