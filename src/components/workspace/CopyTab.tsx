import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import CopyButton from '@/components/CopyButton';
import type { CampaignDetail, CopyBank, CopyGroup } from '@/lib/campaigns';

const GROUPS: { key: CopyGroup; label: string; hint: string }[] = [
  { key: 'headlines', label: 'Headlines', hint: 'Big text for ads, banners and the top of your website.' },
  { key: 'primary_texts', label: 'Ad text', hint: 'The paragraph above an ad on Instagram or Facebook.' },
  { key: 'email_subjects', label: 'Email subject lines', hint: 'Short enough to read on a phone lock screen.' },
  { key: 'ctas', label: 'Calls to action', hint: 'Button text that tells people exactly what to do.' },
  { key: 'hashtags', label: 'Hashtags', hint: 'Use 3 to 8 per post. More looks spammy.' },
];

type CopyTabProps = {
  campaign: CampaignDetail;
  onMore: (group: CopyGroup) => Promise<void>;
};

export default function CopyTab({ campaign, onMore }: CopyTabProps) {
  const [busy, setBusy] = useState<CopyGroup | null>(null);
  const bank = campaign.assets.find((a) => a.kind === 'copy')?.content as CopyBank | undefined;

  if (!bank) {
    return <p className="card p-8 text-center text-muted">No copy in this campaign yet. Generate a campaign from a brief to get headlines, ad text and more.</p>;
  }

  async function more(group: CopyGroup) {
    setBusy(group);
    try {
      await onMore(group);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {GROUPS.map(({ key, label, hint }) => {
        const lines = bank[key] ?? [];
        return (
          <section key={key} className={`card p-5 ${key === 'primary_texts' ? 'lg:row-span-2' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold">{label}</h3>
                <p className="text-sm text-muted">{hint}</p>
              </div>
              <button type="button" onClick={() => more(key)} disabled={!!busy} className="btn-soft shrink-0 !border-teal/40">
                {busy === key ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4 text-teal" aria-hidden />}
                More like this
              </button>
            </div>
            {key === 'hashtags' ? (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {lines.map((tag) => (
                    <span key={tag} className="rounded-full bg-blush px-3 py-1 font-mono text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <CopyButton text={lines.join(' ')} label="Copy all hashtags" className="btn-soft mt-4" />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {lines.map((line) => (
                  <li key={line} className="flex items-start justify-between gap-3 py-2.5">
                    <p className={key === 'headlines' ? 'font-display text-lg font-bold leading-snug' : ''}>{line}</p>
                    <CopyButton text={line} className="btn-soft shrink-0 !px-2.5" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
