import CopyButton from '@/components/CopyButton';
import type { CampaignDetail, CreativeBrief } from '@/lib/campaigns';
import { STORY_RECIPES } from '@/lib/briefSteps';

const ROWS: { key: keyof CreativeBrief; label: string; term?: string }[] = [
  { key: 'background', label: 'Where we are now', term: 'background' },
  { key: 'objective', label: 'What we want to happen', term: 'objective' },
  { key: 'audience', label: 'Who we’re talking to', term: 'audience' },
  { key: 'insight', label: 'What they secretly think', term: 'insight' },
  { key: 'single_minded_proposition', label: 'The one thing to remember', term: 'single-minded proposition' },
  { key: 'reasons_to_believe', label: 'Why they should believe us', term: 'reasons to believe' },
  { key: 'tone', label: 'How we sound', term: 'tone' },
  { key: 'mandatories', label: 'Must include', term: 'mandatories' },
  { key: 'deliverables', label: 'What we’re making', term: 'deliverables' },
  { key: 'kpis', label: 'How we’ll know it worked', term: 'KPIs' },
];

export default function BriefTab({ campaign }: { campaign: CampaignDetail }) {
  const brief = campaign.assets.find((a) => a.kind === 'creative_brief')?.content as CreativeBrief | undefined;
  if (!brief) return <p className="card p-8 text-center text-muted">No creative brief yet. Generate a campaign from a brief to get one.</p>;

  const recipe = STORY_RECIPES.find((r) => r.value === campaign.story_recipe);
  const asText = [
    `Creative brief: ${campaign.name}`,
    recipe && campaign.story_recipe !== 'auto' ? `Story recipe: ${recipe.label}` : '',
    ...ROWS.map(({ key, label }) => {
      const v = brief[key];
      return `${label}: ${Array.isArray(v) ? v.map((x) => `\n - ${x}`).join('') : v}`;
    }),
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <article className="card mx-auto max-w-4xl overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-line bg-blush/50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">One-page creative brief</p>
          <h3 className="mt-1 text-2xl font-extrabold">{campaign.name}</h3>
          {recipe && (
            <p className="mt-1 text-sm">
              Story recipe: <strong>{recipe.label}</strong>
              <span className="text-muted"> · {recipe.hint}</span>
            </p>
          )}
        </div>
        <CopyButton text={asText} label="Copy all" />
      </header>
      <dl className="divide-y divide-line">
        {ROWS.map(({ key, label, term }) => {
          const value = brief[key];
          const highlight = key === 'single_minded_proposition';
          return (
            <div key={key} className="grid gap-2 px-6 py-4 sm:grid-cols-[14rem_1fr]">
              <dt>
                <span className="font-bold">{label}</span>
                {term && <span className="block font-mono text-[11px] uppercase tracking-wide text-muted">{term}</span>}
              </dt>
              <dd className={highlight ? 'font-display text-2xl font-extrabold text-rose' : ''}>
                {Array.isArray(value) ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {value.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                ) : (
                  value
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
