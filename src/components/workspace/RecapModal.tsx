import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CopyButton from '@/components/CopyButton';
import type { CampaignDetail } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { computeResults } from '@/lib/results';

export default function RecapModal({ campaign, onClose }: { campaign: CampaignDetail; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const r = computeResults(campaign);
  const posted = campaign.items.filter((i) => i.status === 'done');
  const channelsUsed = [...new Set(posted.map((i) => i.channel))];

  const phaseScores = campaign.phases.map((p) => {
    const inPhase = campaign.items.filter((i) => i.phase_id === p.id);
    const done = inPhase.filter((i) => i.status === 'done').length;
    return { phase: p, pct: inPhase.length ? done / inPhase.length : 0 };
  });
  const best = [...phaseScores].sort((a, b) => b.pct - a.pct)[0];

  let streak = 0;
  let run = 0;
  r.byWeek.forEach((w) => {
    run = w.posted > 0 ? run + 1 : 0;
    streak = Math.max(streak, run);
  });

  const cards = [
    { bg: 'bg-rose text-on-rose', eyebrow: 'You did that', big: `${posted.length}`, line: `posts shipped. ${posted.length >= 20 ? 'Zero excuses.' : 'Every one counts.'}` },
    { bg: 'bg-espresso text-paper', eyebrow: 'You showed up on', big: `${channelsUsed.length}`, line: channelsUsed.map((c) => channelMeta(c).label).join(' · ') || 'No channels yet' },
    { bg: 'bg-honey text-espresso', eyebrow: 'Your best phase', big: best?.phase.name ?? '—', line: best ? `${Math.round(best.pct * 100)}% of its posts went live.` : 'Post something to find out.' },
    { bg: 'bg-teal text-paper', eyebrow: 'Your streak', big: `${streak} wk`, line: streak === 1 ? 'One week of showing up.' : `${streak} weeks in a row of showing up.` },
    { bg: 'bg-sage text-paper', eyebrow: r.goalLabel, big: `${r.conversions}`, line: `${r.reach.toLocaleString()} people reached along the way.` },
  ];
  const card = cards[index];
  const share = `Flaunted: ${posted.length} posts across ${channelsUsed.length} channels for ${campaign.name}. ${r.conversions} ${r.goalLabel.toLowerCase()}. Made with Flaunt.`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(cards.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, cards.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/80 p-4" role="dialog" aria-modal="true" aria-label="Flaunted recap">
      <div className="w-full max-w-sm">
        <div className="mb-3 flex gap-1.5" aria-hidden>
          {cards.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-paper' : 'bg-paper/30'}`} />
          ))}
        </div>
        <div key={index} className={`rise relative flex aspect-[9/14] flex-col justify-between rounded-[28px] border-2 border-espresso p-7 shadow-lift ${card.bg}`}>
          <div className="flex items-start justify-between">
            <span className="neon-plate !px-3">
              <span className="neon-text font-script text-2xl leading-none">Flaunted</span>
            </span>
            <button type="button" onClick={onClose} className="rounded-full bg-black/15 p-1.5" aria-label="Close recap">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest opacity-80">{card.eyebrow}</p>
            <p className="mt-2 break-words font-display text-7xl font-extrabold leading-none">{card.big}</p>
            <p className="mt-4 text-lg font-semibold">{card.line}</p>
          </div>
          <p className="font-mono text-xs opacity-70">{campaign.name}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} className="btn-ghost !px-3" aria-label="Previous card">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <CopyButton text={share} label="Copy to share" className="btn-ghost" />
          <button type="button" onClick={() => setIndex((i) => i + 1)} disabled={index === cards.length - 1} className="btn-ghost !px-3" aria-label="Next card">
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
