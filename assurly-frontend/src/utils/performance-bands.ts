/** Score-range performance bands (polarity-corrected scores only). */

export type PerformanceBandId =
  | 'strong'
  | 'healthy'
  | 'needs-improvement'
  | 'critical';

export const PERFORMANCE_BAND_LABELS: Record<PerformanceBandId, string> = {
  strong: 'Strong',
  healthy: 'Healthy',
  'needs-improvement': 'Needs improvement',
  critical: 'Critical',
};

export const PERFORMANCE_FILTER_OPTIONS: Array<{
  label: string;
  value: PerformanceBandId | 'no-data';
}> = [
  { label: PERFORMANCE_BAND_LABELS.strong, value: 'strong' },
  { label: PERFORMANCE_BAND_LABELS.healthy, value: 'healthy' },
  { label: PERFORMANCE_BAND_LABELS['needs-improvement'], value: 'needs-improvement' },
  { label: PERFORMANCE_BAND_LABELS.critical, value: 'critical' },
  { label: 'No Data', value: 'no-data' },
];

/** Returns the band id for a score, or null when there is no score. */
export function getPerformanceBandId(score: number): PerformanceBandId | null {
  if (score <= 0) return null;
  if (score >= 3.5) return 'strong';
  if (score >= 2.5) return 'healthy';
  if (score >= 1.5) return 'needs-improvement';
  return 'critical';
}

export function scoreMatchesPerformanceFilter(
  score: number,
  filter: PerformanceBandId | 'no-data'
): boolean {
  if (filter === 'no-data') return score === 0;
  if (score <= 0) return false;

  switch (filter) {
    case 'strong':
      return score >= 3.5;
    case 'healthy':
      return score >= 2.5 && score < 3.5;
    case 'needs-improvement':
      return score >= 1.5 && score < 2.5;
    case 'critical':
      return score >= 1.0 && score < 1.5;
    default:
      return false;
  }
}

export function getPerformanceBandBadgeClasses(score: number): string {
  if (score >= 3.5) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 2.5) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (score >= 1.5) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (score > 0) return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}
