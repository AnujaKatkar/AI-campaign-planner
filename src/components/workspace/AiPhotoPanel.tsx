import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { usePhotoUrls } from '@/hooks/usePhotoUrls';

type AiPhotoPanelProps = {
  /** How many more photos this post can take. */
  room: number;
  /** Draws pictures for the post; resolves with their storage paths. */
  make: (instruction: string) => Promise<string[]>;
  /** Adds the chosen picture to the post. Resolves true once it is stored. */
  onUse: (path: string) => Promise<boolean>;
  /** Deletes pictures that weren't chosen. */
  discard: (paths: string[]) => Promise<void>;
};

/** "Make with AI": draws two pictures from the post's "What to shoot" line and lets the owner pick one. */
export default function AiPhotoPanel({ room, make, onUse, discard }: AiPhotoPanelProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [picks, setPicks] = useState<string[]>([]);
  const { urls } = usePhotoUrls(picks);

  async function handleMake() {
    setBusy(true);
    try {
      // Anything still on screen from the last try is thrown away.
      if (picks.length) discard(picks).catch(() => undefined);
      setPicks([]);
      setPicks(await make(instruction));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't make a picture. Try again.", 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleUse(path: string) {
    const saved = await onUse(path);
    if (!saved) return;
    discard(picks.filter((p) => p !== path)).catch(() => undefined);
    setPicks([]);
    setOpen(false);
    setInstruction('');
  }

  function handleClose() {
    if (picks.length) discard(picks).catch(() => undefined);
    setPicks([]);
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} disabled={room <= 0} className="btn-soft mt-2 !border-teal/40">
        <Sparkles className="h-4 w-4 text-teal" aria-hidden /> Make with AI
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-teal/30 bg-teal/[0.07] p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold text-teal">
          <Sparkles className="h-4 w-4" aria-hidden /> Make a picture with AI
        </p>
        <button type="button" onClick={handleClose} className="text-sm font-semibold text-muted underline-offset-2 hover:underline">
          Close
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">Flaunt draws it from “What to shoot” above. A real photo of your own product will usually look better.</p>

      <label className="label mt-3" htmlFor="ai-photo-extra">
        Anything to change? <span className="font-normal text-muted">(optional)</span>
      </label>
      <input
        id="ai-photo-extra"
        className="field !py-2"
        placeholder="e.g. morning light, wooden table, no people"
        value={instruction}
        maxLength={300}
        onChange={(e) => setInstruction(e.target.value)}
        disabled={busy}
      />
      <button type="button" onClick={handleMake} disabled={busy} className="btn-press btn-sm mt-3">
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Drawing… about 30 seconds
          </>
        ) : picks.length ? (
          'Try again'
        ) : (
          'Make 2 pictures'
        )}
      </button>

      {picks.length > 0 && !busy && (
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {picks.map((path, i) => (
            <li key={path}>
              <div className="aspect-[2/3] overflow-hidden rounded-xl border border-line bg-blush">
                {urls[path] ? (
                  <img src={urls[path]} alt={`AI picture option ${i + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-teal" aria-label="Loading" />
                  </div>
                )}
              </div>
              <button type="button" onClick={() => handleUse(path)} disabled={room <= 0} className="btn-soft mt-2 w-full">
                Use this one
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
