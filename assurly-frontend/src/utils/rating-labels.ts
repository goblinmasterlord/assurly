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

/** Convert a raw rating to assurance-equivalent value for averaging mixed polarities. */
export function ratingForAverage(
  rating: number,
  standardType?: StandardType
): number {
  if (standardType === 'risk') return 5 - rating;
  return rating;
}

export function calculatePolarityAwareAverage(
  standards: Array<{ rating?: number | null; standard_type?: StandardType }>
): number | null {
  const rated = standards.filter(
    (s): s is { rating: number; standard_type?: StandardType } =>
      s.rating != null && isRatedValue(s.rating)
  );
  if (rated.length === 0) return null;

  const sum = rated.reduce(
    (acc, s) => acc + ratingForAverage(s.rating, s.standard_type),
    0
  );
  return Math.round((sum / rated.length) * 10) / 10;
}
