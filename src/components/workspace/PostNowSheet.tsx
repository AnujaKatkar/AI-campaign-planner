import { useState, type ReactNode } from 'react';
import { AlertTriangle, Check, Copy, Download, ExternalLink, ImagePlus, Loader2, Share2, Undo2 } from 'lucide-react';
import ChannelChip from '@/components/ChannelChip';
import Drawer from '@/components/Drawer';
import { useToast } from '@/components/Toast';
import type { CalendarItem } from '@/lib/campaigns';
import { flauntCheck } from '@/lib/check';
import { captionOf, photosOf, sharePost } from '@/lib/media';
import { guideFor } from '@/lib/postLinks';
import { postTypeFor } from '@/lib/postTypes';
import { formatDayLabel } from '@/lib/schedule';

type PostNowSheetProps = {
  item: CalendarItem;
  onClose: () => void;
  /** Open the full editor, to fix a problem or add a picture. */
  onEdit: () => void;
  onPosted: () => void;
  onUndo: () => void;
};

type StepDef = { key: string; title: string; done: boolean; body: ReactNode };

/** The hand-off for one post: copy the words, save the pictures, open the app, then say it's posted. */
export default function PostNowSheet({ item, onClose, onEdit, onPosted, onUndo }: PostNowSheetProps) {
  const toast = useToast();
  const guide = guideFor(item.channel);
  const caption = captionOf(item);
  const photos = photosOf(item);
  const posted = item.status === 'done';
  const issues = posted ? [] : flauntCheck(item);
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt('Copy this text:', text);
    }
    setCopied((c) => ({ ...c, [key]: true }));
  }

  async function savePictures() {
    setBusy(true);
    try {
      const how = await sharePost(item);
      if (how === 'cancelled') return;
      setSaved(true);
      if (how === 'downloaded') toast(photos.length ? `Downloaded ${photos.length} picture${photos.length > 1 ? 's' : ''}.` : 'Downloaded the caption.');
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't get the pictures ready. Try again.", 'error');
    } finally {
      setBusy(false);
    }
  }

  const showPictures = guide.pictures || photos.length > 0;
  const subject = guide.extraCopy?.text(item);
  const steps: StepDef[] = [];

  steps.push({
    key: 'caption',
    title: guide.captionLabel,
    done: !!copied.caption,
    body: (
      <>
        {caption ? (
          <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-line rounded-2xl bg-blush px-4 py-3 text-sm">{caption}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">This post has no text yet. Add some in the editor first.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void copy('caption', caption)} disabled={!caption} className="btn-soft !border-teal/40">
            {copied.caption ? <Check className="h-4 w-4 text-sage" aria-hidden /> : <Copy className="h-4 w-4 text-teal" aria-hidden />}
            {copied.caption ? 'Copied' : guide.extraCopy ? 'Copy message' : 'Copy caption'}
          </button>
          {guide.extraCopy && subject && (
            <button type="button" onClick={() => void copy('subject', subject)} className="btn-soft !border-teal/40">
              {copied.subject ? <Check className="h-4 w-4 text-sage" aria-hidden /> : <Copy className="h-4 w-4 text-teal" aria-hidden />}
              {copied.subject ? 'Copied' : `Copy ${guide.extraCopy.label}`}
            </button>
          )}
        </div>
      </>
    ),
  });

  if (showPictures) {
    steps.push({
      key: 'pictures',
      title: photos.length > 1 ? 'Save your pictures' : 'Save your picture',
      done: saved,
      body: photos.length > 0 ? (
        <>
          <p className="mt-2 text-sm text-muted">
            {touch ? 'Opens your share sheet, so you can send them straight to the app.' : `Downloads ${photos.length === 1 ? 'the picture' : `all ${photos.length} pictures`} to your computer.`}
          </p>
          <button type="button" onClick={() => void savePictures()} disabled={busy} className="btn-soft mt-3 !border-teal/40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : touch ? <Share2 className="h-4 w-4 text-teal" aria-hidden /> : <Download className="h-4 w-4 text-teal" aria-hidden />}
            {touch ? 'Share pictures' : 'Download pictures'}
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">{item.visual ? `No picture yet. Shoot: ${item.visual}` : 'No picture yet. A post with a picture gets noticed more.'}</p>
          <button type="button" onClick={onEdit} className="btn-soft mt-3">
            <ImagePlus className="h-4 w-4" aria-hidden /> Add a picture
          </button>
        </>
      ),
    });
  }

  steps.push({
    key: 'open',
    title: guide.link ? `Open ${guide.app}` : `Paste it into ${guide.app}`,
    done: opened,
    body: (
      <>
        {guide.link && (
          <a
            href={guide.link(caption)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpened(true)}
            className="btn-soft mt-2 !border-teal/40"
          >
            <ExternalLink className="h-4 w-4 text-teal" aria-hidden /> Open {guide.app}
          </a>
        )}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          {guide.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        {!guide.link && (
          <button type="button" onClick={() => setOpened(true)} className="btn-soft mt-3">
            <Check className="h-4 w-4" aria-hidden /> Done pasting
          </button>
        )}
      </>
    ),
  });

  steps.push({
    key: 'posted',
    title: posted ? 'Posted' : 'Tick it off',
    done: posted,
    body: posted ? (
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted">Nice one. This post is counted in your Heat.</p>
        <button type="button" onClick={onUndo} className="btn-soft">
          <Undo2 className="h-4 w-4" aria-hidden /> Not posted yet
        </button>
      </div>
    ) : (
      <>
        <p className="mt-2 text-sm text-muted">Once it&apos;s live, tell Flaunt so your Heat and results stay right.</p>
        <button type="button" onClick={onPosted} className="btn-press btn-sm mt-3">
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> I posted it
        </button>
      </>
    ),
  });

  return (
    <Drawer title="Post now" closeLabel="Close" onClose={onClose}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <ChannelChip channel={item.channel} />
        <span className="text-muted">{postTypeFor(item.format).label}</span>
        <span className="font-mono text-xs text-muted">{formatDayLabel(item.scheduled_on)}</span>
      </div>
      <h3 className="mt-2 text-2xl font-extrabold leading-snug">{item.title}</h3>

      {issues.length > 0 && (
        <div className="mt-5 rounded-2xl bg-honey/25 px-4 py-3 text-sm" role="status">
          <p className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {issues.length === 1 ? '1 thing to fix first' : `${issues.length} things to fix first`}
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-9">
            {issues.map((issue) => (
              <li key={issue.id}>{issue.message}</li>
            ))}
          </ul>
          <button type="button" onClick={onEdit} className="btn-soft mt-3">
            Fix it in the editor
          </button>
        </div>
      )}

      <ol className="mt-6 flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step.key} className="card flex gap-4 p-4">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-sm font-extrabold ${
                step.done ? 'bg-sage text-white' : 'bg-surface'
              }`}
              aria-hidden
            >
              {step.done ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold">
                {step.title}
                {step.done && <span className="sr-only"> (done)</span>}
              </h4>
              {step.body}
            </div>
          </li>
        ))}
      </ol>
    </Drawer>
  );
}
