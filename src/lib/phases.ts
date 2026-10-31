import type { Phase } from '@/lib/campaigns';

// Literal class names so Tailwind keeps them.
export const PHASE_STYLES = [
  { dot: 'bg-rose', tint: 'bg-rose/[0.07]', text: 'text-rose' },
  { dot: 'bg-honey', tint: 'bg-honey/[0.12]', text: 'text-honey' },
  { dot: 'bg-teal', tint: 'bg-teal/[0.08]', text: 'text-teal' },
  { dot: 'bg-sage', tint: 'bg-sage/[0.10]', text: 'text-sage' },
];

export function phaseStyle(index: number) {
  return PHASE_STYLES[((index % PHASE_STYLES.length) + PHASE_STYLES.length) % PHASE_STYLES.length];
}

export function phaseForDate(phases: Phase[], iso: string): Phase | undefined {
  return phases.find((phase) => phase.starts_on <= iso && iso <= phase.ends_on);
}
