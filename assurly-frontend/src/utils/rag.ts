import type { StandardType } from '@/types/assessment';

export type RagColour = 'green' | 'amber-green' | 'amber' | 'red' | 'grey';

const ASSURANCE_PALETTE: Record<number, RagColour> = {
  4: 'green',
  3: 'amber-green',
  2: 'amber',
  1: 'red',
};

const RISK_PALETTE: Record<number, RagColour> = {
  4: 'red',
  3: 'amber',
  2: 'amber-green',
  1: 'green',
};

const BADGE_CLASSES: Record<RagColour, string> = {
  green: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'amber-green': 'bg-lime-100 text-lime-700 border border-lime-200',
  amber: 'bg-amber-100 text-amber-700 border border-amber-200',
  red: 'bg-red-100 text-red-700 border border-red-200',
  grey: 'bg-slate-100 text-slate-700 border border-slate-200',
};

export function getRagColour(
  rating: number | null,
  standardType?: StandardType
): RagColour {
  if (rating == null) return 'grey';

  // API should always send standard_type; assurance polarity is the explicit fallback.
  const palette = standardType === 'risk' ? RISK_PALETTE : ASSURANCE_PALETTE;
  return palette[rating] ?? 'grey';
}

export function getRagBadgeClasses(
  rating: number,
  standardType?: StandardType
): string {
  return BADGE_CLASSES[getRagColour(rating, standardType)];
}
