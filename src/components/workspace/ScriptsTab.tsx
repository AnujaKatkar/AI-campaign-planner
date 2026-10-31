import { Clapperboard } from 'lucide-react';
import CopyButton from '@/components/CopyButton';
import type { AdScript, CampaignDetail } from '@/lib/campaigns';

function scriptText(s: AdScript): string {
  return [
    `${s.title} (${s.length_seconds}s · ${s.platform})`,
    ...s.scenes.map((sc) => `${sc.time}\n  Visual: ${sc.visual}\n  Voiceover: ${sc.voiceover}\n  On screen: ${sc.on_screen_text}`),
    `CTA: ${s.cta}`,
  ].join('\n');
}

export default function ScriptsTab({ campaign }: { campaign: CampaignDetail }) {
  const scripts = campaign.assets
    .filter((a) => a.kind === 'ad_script')
    .map((a) => a.content as AdScript)
    .sort((a, b) => a.length_seconds - b.length_seconds);

  if (scripts.length === 0) {
    return <p className="card p-8 text-center text-muted">No video scripts in this campaign. Generate a new one from the brief to get 6s, 15s and 30s scripts.</p>;
  }

  return (
    <div className="space-y-6">
      {scripts.map((s) => (
        <article key={s.title} className="card overflow-hidden">
          <header className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center">
            <span className="sticker -rotate-2 font-mono">{s.length_seconds}s</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-extrabold">{s.title}</h3>
              <p className="text-sm text-muted">
                <Clapperboard className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                {s.platform} · ends with &ldquo;{s.cta}&rdquo;
              </p>
            </div>
            <CopyButton text={scriptText(s)} label="Copy script" />
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-blush/60 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-2 font-bold">Time</th>
                  <th className="px-3 py-2 font-bold">What we see</th>
                  <th className="px-3 py-2 font-bold">What we hear</th>
                  <th className="px-5 py-2 font-bold">Text on screen</th>
                </tr>
              </thead>
              <tbody>
                {s.scenes.map((sc) => (
                  <tr key={sc.time} className="border-t border-line align-top">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-bold">{sc.time}</td>
                    <td className="px-3 py-3">{sc.visual}</td>
                    <td className="px-3 py-3 italic">{sc.voiceover}</td>
                    <td className="px-5 py-3 font-bold">{sc.on_screen_text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}
