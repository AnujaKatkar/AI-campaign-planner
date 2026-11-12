import type { CalendarItem, PostPhoto } from '@/lib/campaigns';
import { supabase } from '@/lib/supabase';

export const MEDIA_BUCKET = 'post-media';
/** Carousels on Instagram, TikTok and LinkedIn top out at 10 images. */
export const MAX_PHOTOS = 10;

export function photosOf(item: Pick<CalendarItem, 'media'>): PostPhoto[] {
  return Array.isArray(item.media) ? item.media : [];
}

/** Sample-campaign photos are kept inline as data URLs; saved campaigns keep a path in the storage bucket. */
export function isInlinePhoto(path: string) {
  return path.startsWith('data:');
}

/**
 * Shrinks a photo in the browser before it is stored, so uploads are quick and phones don't send 12 MB files.
 * Returns a JPEG no larger than `maxSide` on its longest edge.
 */
export async function preparePhoto(file: File, maxSide = 2048, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} isn't a photo. Pick a JPEG, PNG or WebP image.`);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Couldn't open ${file.name}. Try a JPEG or PNG instead.`);
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("This browser can't prepare photos. Try another browser.");
  ctx.fillStyle = '#fff'; // transparent PNGs would turn black as JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(`Couldn't prepare ${file.name}.`))), 'image/jpeg', quality),
  );
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read that photo."));
    reader.readAsDataURL(blob);
  });
}

// Signed links last an hour; reuse them for 50 minutes so the screen doesn't ask again on every render.
const SIGNED_FOR_SECONDS = 3600;
const REUSE_FOR_MS = 50 * 60 * 1000;
const urlCache = new Map<string, { url: string; at: number }>();

/** Turns stored photo paths into links the browser can show. */
export async function photoUrls(paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const path of paths) {
    if (isInlinePhoto(path)) out[path] = path;
    else {
      const hit = urlCache.get(path);
      if (hit && Date.now() - hit.at < REUSE_FOR_MS) out[path] = hit.url;
      else missing.push(path);
    }
  }
  if (missing.length) {
    const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(missing, SIGNED_FOR_SECONDS);
    if (error) throw new Error("Couldn't load this post's photos. Check your connection.");
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) {
        out[row.path] = row.signedUrl;
        urlCache.set(row.path, { url: row.signedUrl, at: Date.now() });
      }
    }
  }
  return out;
}

/** The caption to paste under the post: hook, then body, then the call to action if the body doesn't already end with it. */
export function captionOf(item: Pick<CalendarItem, 'hook' | 'body' | 'cta'>): string {
  const body = item.body?.trim() ?? '';
  const cta = item.cta?.trim() ?? '';
  const parts = [item.hook?.trim(), body];
  if (cta && !body.toLowerCase().includes(cta.toLowerCase())) parts.push(cta);
  return parts.filter(Boolean).join('\n\n');
}

function fileSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'flaunt-post';
}

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Gets a finished post out of Flaunt. On a phone this opens the share sheet with the photos and caption,
 * so the owner can send them straight to Instagram or TikTok. Elsewhere it downloads the photos plus a caption file.
 * Returns which of the two happened.
 */
export async function sharePost(item: CalendarItem): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const photos = photosOf(item);
  const caption = captionOf(item);
  const urls = await photoUrls(photos.map((p) => p.path));
  const base = fileSlug(item.title);
  const files = await Promise.all(
    photos.map(async (p, i) => {
      const res = await fetch(urls[p.path]);
      if (!res.ok) throw new Error("Couldn't fetch the photos. Check your connection and try again.");
      const blob = await res.blob();
      return new File([blob], `${base}-${i + 1}.jpg`, { type: blob.type || 'image/jpeg' });
    }),
  );

  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  if (touch && files.length && navigator.canShare?.({ files })) {
    try {
      // Many apps drop the text when files are shared, so the caption also goes on the clipboard.
      await navigator.clipboard?.writeText(caption).catch(() => undefined);
      await navigator.share({ files, text: caption, title: item.title });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Share failed for another reason: fall back to downloading.
    }
  }

  files.forEach((f, i) => window.setTimeout(() => saveFile(f, f.name), i * 250));
  saveFile(new Blob([caption + '\n'], { type: 'text/plain;charset=utf-8' }), `${base}-caption.txt`);
  return 'downloaded';
}
