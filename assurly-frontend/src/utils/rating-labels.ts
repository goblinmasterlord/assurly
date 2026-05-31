import type { StandardType } from '@/types/assessment';

export type RatedValue = 1 | 2 | 3 | 4;

export const RATING_OPTIONS: RatedValue[] = [1, 2, 3, 4];

const ASSURANCE_LABELS: Record<RatedValue, string> = {
  1: 'Inadequate',
  2: 'Needs work',
  3: 'Good',
  4: 'Highly assured',
};

const RISK_LABELS: Record<RatedValue, string> = {
  1: 'Critical risk',
  2: 'Major risk',
  3: 'Minor risk',
  4: 'No risk or mitigated',
};

const ASSURANCE_DESCRIPTIONS: Record<RatedValue, string> = {
  1: 'Significant concern requiring immediate action',
  2: 'Areas identified for development',
  3: 'Performance meeting expected standards',
  4: 'Practices exceeding expectations',
};

const RISK_DESCRIPTIONS: Record<RatedValue, string> = {
  1: 'A critical risk with very high impact',
  2: 'A major risk with significant impact',
  3: 'A minor risk with limited impact',
  4: 'Risk is either absent or fully mitigated',
};

function isRatedValue(rating: number): rating is RatedValue {
  return rating >= 1 && rating <= 4;
}

export function getRatingLabel(
  rating: number | null,
  standardType?: StandardType
): string {
  if (rating === null || !isRatedValue(rating)) return 'Not Rated';
  const labels = standardType === 'risk' ? RISK_LABELS : ASSURANCE_LABELS;
  return labels[rating];
}

export function getRatingDescription(
  rating: number,
  standardType?: StandardType
): string {
  if (!isRatedValue(rating)) return '';
  const descriptions =
    standardType === 'risk' ? RISK_DESCRIPTIONS : ASSURANCE_DESCRIPTIONS;
  return descriptions[rating];
}

/** Plain average of rated standards on the unified 1–4 scale (4 = best for all types). */
export function calculateAverageRating(
  standards: Array<{ rating?: number | null; standard_type?: StandardType }>
): number | null {
  const ratings = standards
    .map((s) => s.rating)
    .filter((rating): rating is number => rating != null && isRatedValue(rating));

  if (ratings.length === 0) return null;

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}
