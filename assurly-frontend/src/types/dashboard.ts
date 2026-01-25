import type { AssessmentStatus } from '@/types/assessment';

export interface PreviousTerm {
  term_id: string; // e.g. T1-2025-26
  academic_year: string; // e.g. 2025-26
  avg_score: number | null;
}

export interface SchoolDashboardItem {
  school_id: string;
  school_name: string;
  current_term: string; // e.g. T2-2025-26
  status: Extract<AssessmentStatus, 'not_started' | 'in_progress' | 'completed'>;
  current_score: number | null;
  previous_terms: PreviousTerm[];
  intervention_required: number;
  completed_standards: number;
  total_standards: number;
  completion_rate: string; // e.g. "15/41"
  last_updated: string | null; // ISO8601
}

export interface SchoolsDashboardResponse {
  current_term: string | null;
  schools: SchoolDashboardItem[];
}

