import { ArrowLeft, ArrowRight } from 'lucide-react';
import ChannelChip from '@/components/ChannelChip';
import { SAMPLE_LIST, type SampleId } from '@/lib/sample';

type SamplePickerProps = {
  onBack: () => void;
  onOpen: (id: SampleId) => void;
  onStart: () => void;
};

/** "See a sample": a few example businesses, each with a full ready-made campaign. */
export default function SamplePicker({ onBack, onOpen, onStart }: SamplePickerProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 md:py-14">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </button>
      <p className="eyebrow mt-6">Examples</p>
      <h1 className="mt-2 text-4xl font-extrabold md:text-6xl">Pick a business like yours</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Each example is a full Flaunt campaign: a calendar of posts, video scripts, copy and a brief. Open one, tick posts off and play with it.
        Nothing is saved to an account.
      </p>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_LIST.map((sample) => (
          <li key={sample.id}>
            <button
              type="button"
              onClick={() => onOpen(sample.id)}
              className="card group flex h-full w-full flex-col items-start p-6 text-left transition-colors hover:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <span className="pill bg-honey/30 text-ink">{sample.label}</span>
              <span className="mt-4 font-display text-2xl font-extrabold leading-snug">{sample.business}</span>
              <span className="mt-2 text-muted">{sample.blurb}</span>
              <span className="mt-4 flex flex-wrap items-center gap-1.5">
                {sample.channels.map((channel) => (
                  <ChannelChip key={channel} channel={channel} small />
                ))}
              </span>
              <span className="mt-auto flex w-full items-center justify-between gap-3 pt-5 text-sm">
                <span className="font-mono text-xs text-muted">Goal: {sample.goalLabel}</span>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-bold text-teal">
                  Open example <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="card mt-10 flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-bold">Don&apos;t see your kind of business? Flaunt builds one for yours in about a minute.</p>
        <button type="button" onClick={onStart} className="btn-press btn-sm shrink-0">
          Flaunt my own <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
