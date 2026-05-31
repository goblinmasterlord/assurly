import type { StandardType } from '@/types/assessment';

export type RagColour = 'green' | 'amber-green' | 'amber' | 'red' | 'grey';

/** Unified 1–4 scale: 4 = best for assurance and risk (labels carry polarity, not colours). */
const RATING_PALETTE: Record<number, RagColour> = {
  4: 'green',
  3: 'amber-green',
  2: 'amber',
  1: 'red',
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
  _standardType?: StandardType
): RagColour {
  if (rating == null) return 'grey';

  return RATING_PALETTE[rating] ?? 'grey';
}

export function getRagBadgeClasses(
  rating: number,
  standardType?: StandardType
): string {
  return BADGE_CLASSES[getRagColour(rating, standardType)];
}
