import { useEffect, useRef, useState } from 'react';
import { CalendarPlus, Heart, RotateCcw, X } from 'lucide-react';
import ChannelChip from '@/components/ChannelChip';
import type { Asset, CampaignDetail, Idea } from '@/lib/campaigns';
import { addDaysIso, todayIso } from '@/lib/schedule';

type IdeaAsset = Extract<Asset, { kind: 'idea' }> & { content: Idea & { decided?: boolean } };

type IdeasTabProps = {
  campaign: CampaignDetail;
  onDecide: (asset: IdeaAsset, kept: boolean) => void;
  onUndo: (asset: IdeaAsset) => void;
  onSchedule: (idea: Idea, iso: string) => void;
};

const SWIPE_DISTANCE = 110;

export default function IdeasTab({ campaign, onDecide, onUndo, onSchedule }: IdeasTabProps) {
  const ideas = campaign.assets.filter((a): a is IdeaAsset => a.kind === 'idea');
  const stack = ideas.filter((a) => !a.content.decided);
  const kept = ideas.filter((a) => a.content.decided && a.kept);
  const tossed = ideas.filter((a) => a.content.decided && !a.kept);
  const top = stack[0];

  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const start = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  function decide(keep: boolean) {
    if (!top || leaving) return;
    setLeaving(keep ? 'right' : 'left');
    window.setTimeout(() => {
      onDecide(top, keep);
      setLeaving(null);
      setDx(0);
    }, 220);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === 'ArrowRight') decide(true);
      if (e.key === 'ArrowLeft') decide(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const offset = leaving === 'right' ? 600 : leaving === 'left' ? -600 : dx;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div>
        <div className="relative mx-auto h-[22rem] max-w-sm">
          {stack.length === 0 ? (
            <div className="card flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="font-display text-2xl font-extrabold">That&apos;s the whole deck.</p>
              <p className="text-muted">
                {kept.length ? 'Put your kept ideas on the calendar.' : 'Nothing kept yet. Tough crowd.'}
              </p>
              {tossed.length > 0 && (
                <button type="button" className="btn-soft" onClick={() => tossed.forEach(onUndo)}>
                  <RotateCcw className="h-4 w-4" aria-hidden /> Give the tossed ones another look
                </button>
              )}
            </div>
          ) : (
            stack
              .slice(0, 3)
              .reverse()
              .map((asset, i, arr) => {
                const depth = arr.length - 1 - i;
                const isTop = depth === 0;
                return (
                  <article
                    key={asset.id}
                    aria-hidden={!isTop}
                    onPointerDown={(e) => {
                      if (!isTop) return;
                      start.current = e.clientX;
                      setDragging(true);
                     
                      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                    }}
                    onPointerMove={(e) => isTop && start.current !== null && setDx(e.clientX - start.current)}
                    onPointerUp={() => {
                      if (!isTop) return;
                      start.current = null;
                      setDragging(false);
                     
                      if (dx > SWIPE_DISTANCE) decide(true);
                      else if (dx < -SWIPE_DISTANCE) decide(false);
                      else setDx(0);
                    }}
                    className={`card absolute inset-0 flex touch-pan-y select-none flex-col p-7 shadow-lift ${
                      isTop ? 'cursor-grab active:cursor-grabbing' : ''
                    } ${dragging ? '' : 'transition-transform duration-200'}`}
                    style={{
                      transform: isTop
                        ? `translateX(${offset}px) rotate(${offset / 18}deg)`
                        : `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`,
                      zIndex: 10 - depth,
                    }}
                  >
                    {isTop && dx > 40 && <span className="sticker absolute right-5 top-5 rotate-6 !bg-sage !text-white">KEEP</span>}
                    {isTop && dx < -40 && <span className="sticker absolute left-5 top-5 -rotate-6 !bg-rose !text-white">TOSS</span>}
                    <div className="flex items-center gap-2">
                      <ChannelChip channel={asset.content.channel?.toLowerCase()} />
                      <span className="text-sm text-muted">{asset.content.format}</span>
                    </div>
                    <h3 className="mt-5 text-3xl font-extrabold">{asset.content.title}</h3>
                    <p className="mt-3 text-lg text-muted">{asset.content.description}</p>
                    <p className="mt-auto font-mono text-xs text-muted">
                      {ideas.length - stack.length + 1} of {ideas.length}
                    </p>
                  </article>
                );
              })
          )}
        </div>
        {top && (
          <div className="mt-8 flex items-center justify-center gap-5">
            <button type="button" onClick={() => decide(false)} className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-surface text-rose shadow-sticker transition active:translate-y-0.5" aria-label="Toss this idea">
              <X className="h-7 w-7" strokeWidth={3} aria-hidden />
            </button>
            <p className="text-center text-xs text-muted">
              Swipe, tap, or
              <br />
              use ← →
            </p>
            <button type="button" onClick={() => decide(true)} className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-sage text-white shadow-sticker transition active:translate-y-0.5" aria-label="Keep this idea">
              <Heart className="h-7 w-7" strokeWidth={3} aria-hidden />
            </button>
          </div>
        )}
      </div>

      <section aria-labelledby="kept-heading">
        <h3 id="kept-heading" className="text-2xl font-extrabold">
          Kept <span className="font-mono text-base text-muted">{kept.length}</span>
        </h3>
        {kept.length === 0 ? (
          <p className="card mt-4 p-6 text-muted">Nothing kept yet. Tough crowd. Swipe right on anything worth making.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {kept.map((asset) => (
              <KeptIdea key={asset.id} asset={asset} campaign={campaign} onSchedule={onSchedule} onToss={() => onDecide(asset, false)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KeptIdea({
  asset,
  campaign,
  onSchedule,
  onToss,
}: {
  asset: IdeaAsset;
  campaign: CampaignDetail;
  onSchedule: (idea: Idea, iso: string) => void;
  onToss: () => void;
}) {
  const last = addDaysIso(campaign.start_date, campaign.duration_weeks * 7 - 1);
  const today = todayIso();
  const [date, setDate] = useState(today >= campaign.start_date && today <= last ? today : campaign.start_date);
  return (
    <li className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <ChannelChip channel={asset.content.channel?.toLowerCase()} small />
          <span className="text-xs text-muted">{asset.content.format}</span>
        </div>
        <p className="mt-1 font-bold">{asset.content.title}</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`d-${asset.id}`}>
          Date for {asset.content.title}
        </label>
        <input
          id={`d-${asset.id}`}
          type="date"
          min={campaign.start_date}
          max={last}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="field !w-auto !rounded-full !px-3 !py-1.5 font-mono text-xs"
        />
        <button type="button" className="btn-soft" onClick={() => onSchedule(asset.content, date)}>
          <CalendarPlus className="h-4 w-4" aria-hidden /> Add
        </button>
        <button type="button" className="btn-soft !px-2" aria-label={`Toss ${asset.content.title}`} onClick={onToss}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export type { IdeaAsset };
