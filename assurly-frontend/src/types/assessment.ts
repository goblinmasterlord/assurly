// ============================================================================
// v4.0 Assessment Types - Human-Readable IDs Throughout
// ============================================================================

// ============================================================================
// Core Types
// ============================================================================

export type AssessmentStatus = 'not_started' | 'in_progress' | 'completed' | 'approved' | 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
export type Rating = 1 | 2 | 3 | 4 | null;
export type SchoolType = 'primary' | 'secondary' | 'all_through' | 'special' | 'central';
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'no_data';

// Legacy assessment category (lowercase, for backward compatibility)
export type AssessmentCategory =
  | "education"
  | "hr"
  | "finance"
  | "estates"
  | "governance"
  | "is"
  | "it"
  | "safeguarding"
  | "faith";

// Academic terms
export type AcademicTerm =
  | "Autumn"
  | "Spring"
  | "Summer";

// Academic years
export type AcademicYear = string; // Format: "2024-25" (v4 short format)

// Rating labels for display
export const RatingLabels: Record<NonNullable<Rating>, string> = {
  1: "Inadequate",
  2: "Requires Improvement",
  3: "Good",
  4: "Outstanding"
};

// Rating descriptions for each level
export const RatingDescriptions: Record<NonNullable<Rating>, string> = {
  1: "Significant concerns requiring immediate action",
  2: "Areas identified for development",
  3: "Solid performance meeting expected standards",
  4: "Exemplary practice exceeding expectations"
};

// ============================================================================
// Assessment Group (Summary View)
// ============================================================================

export interface AssessmentGroup {
  group_id: string;               // cedar-park-primary-EDU-T1-2024-25
  school_id: string;              // cedar-park-primary
  school_name: string;
  mat_aspect_id: string;          // OLT-EDU
  aspect_code: string;            // EDU
  aspect_name: string;
  term_id: string;                // T1
  academic_year: string;          // 2024-25
  status: AssessmentStatus;
  total_standards: number;
  completed_standards: number;
  due_date: string | null;
  last_updated: string;
}

// ============================================================================
// Individual Assessment
// ============================================================================

export interface Assessment {
  id: string;                     // UUID (internal DB ID)
  assessment_id: string;          // cedar-park-primary-ES1-T1-2024-25
  school_id: string;              // cedar-park-primary
  school_name: string;
  mat_standard_id: string;        // OLT-ES1
  standard_code: string;          // ES1
  standard_name: string;
  standard_description: string;
  mat_aspect_id: string;          // OLT-EDU
  aspect_code: string;            // EDU
  aspect_name: string;
  version_id: string;             // OLT-ES1-v1
  version_number: number;
  unique_term_id: string;         // T1-2024-25
  academic_year: string;          // 2024-25
  rating: Rating;
  evidence_comments: string | null;
  status: AssessmentStatus;
  due_date: string | null;
  assigned_to: string | null;     // user_id
  assigned_to_name: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  submitted_by_name: string | null;
  last_updated: string;
  
  // Backward compatibility fields (v3 format - used by frontend)
  name?: string;                   // Maps to standard_name
  category?: AssessmentCategory | string;
  school?: School;
  term?: AcademicTerm | string;
  completedStandards?: number;
  totalStandards?: number;
  standards?: Standard[];
  dueDate?: string | null;         // Maps to due_date
  assignedTo?: Array<{id: string; name: string}> | null;
  lastUpdated?: string;            // Maps to last_updated
  academicYear?: string;           // Maps to academic_year
  overallScore?: number;           // Average rating
}

// ============================================================================
// Assessment by Aspect (Form View)
// ============================================================================

export interface AssessmentByAspect {
  school_id: string;
  school_name: string;
  aspect_code: string;
  aspect_name: string;
  mat_aspect_id: string;
  term_id: string;                // T1-2024-25 (unique_term_id)
  academic_year: string;
  total_standards: number;
  completed_standards: number;
  status: AssessmentStatus;
  standards: AssessmentStandard[];
}

export interface AssessmentStandard {
  assessment_id: string;          // cedar-park-primary-ES1-T1-2024-25
  mat_standard_id: string;        // OLT-ES1
  standard_code: string;          // ES1
  standard_name: string;
  standard_description: string;
  sort_order: number;
  rating: Rating;
  evidence_comments: string | null;
  version_id: string;             // OLT-ES1-v1
  version_number: number;
  status: AssessmentStatus;
}

// ============================================================================
// Standards (Management View)
// ============================================================================

export interface Standard {
  mat_standard_id: string;        // OLT-ES1
  standard_code: string;          // ES1
  standard_name: string;
  standard_description: string;
  sort_order: number;
  is_custom: boolean;
  is_modified: boolean;
  mat_aspect_id: string;          // OLT-EDU
  aspect_code: string;            // EDU
  aspect_name: string;
  current_version_id: string;     // OLT-ES1-v1
  current_version: number;
  
  // Backward compatibility fields (v3 format - used by frontend)
  id?: string;                     // Maps to mat_standard_id
  code?: string;                   // Maps to standard_code
  title?: string;                  // Maps to standard_name
  description?: string;            // Maps to standard_description
  rating?: Rating;
  evidence?: string | null;
  version_number?: number;         // Maps to current_version
  updated_at?: string;
  created_at?: string;
}

export interface StandardDetail extends Omit<Standard, 'current_version'> {
  created_at: string;
  updated_at: string;
  current_version: number;
  current_version_details: StandardVersion;
  version_history: StandardVersion[];
}

export interface StandardVersion {
  version_id: string;             // OLT-ES1-v1
  version_number: number;
  standard_name: string;
  standard_description: string;
  effective_from: string;
  effective_to: string | null;
  change_reason: string | null;
  created_by_name: string | null;
}

export interface StandardUpdate {
  standard_name: string;
  standard_description: string;
  change_reason?: string;
}

// ============================================================================
// Aspects
// ============================================================================

export interface Aspect {
  mat_aspect_id: string;          // OLT-EDU
  aspect_code: string;            // EDU
  aspect_name: string;
  aspect_description: string;
  sort_order: number;
  is_custom: boolean;
  is_modified?: boolean;          // Backward compatibility
  standards_count: number;
}

// ============================================================================
// Schools
// ============================================================================

export interface School {
  school_id: string;              // cedar-park-primary
  school_name: string;
  school_type?: SchoolType;
  is_central_office?: boolean;
  is_active?: boolean;
  
  // Backward compatibility
  id?: string;
  name?: string;
  code?: string;
}

// ============================================================================
// Terms
// ============================================================================

export interface Term {
  unique_term_id: string;         // T1-2024-25
  term_id: string;                // T1
  term_name: string;              // "Autumn Term"
  start_date: string;
  end_date: string;
  academic_year: string;          // 2024-25
  is_current: boolean;
}

// ============================================================================
// Analytics
// ============================================================================

export interface TrendData {
  mat_id: string;
  filters: {
    school_id: string | null;
    aspect_code: string | null;
    from_term: string | null;
    to_term: string | null;
  };
  summary: {
    total_terms: number;
    overall_average: number;
    trend_direction: TrendDirection;
    improvement: number;
  };
  trends: TermTrend[];
}

export interface TermTrend {
  unique_term_id: string;
  term_id: string;
  academic_year: string;
  assessments_count: number;
  rated_count: number;
  average_rating: number | null;
  min_rating: number | null;
  max_rating: number | null;
  rating_distribution: RatingDistribution;
}

export interface RatingDistribution {
  inadequate: number;
  requires_improvement: number;
  good: number;
  outstanding: number;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface AssessmentUpdate {
  rating: Rating;
  evidence_comments: string;
}

export interface AssessmentCreate {
  school_ids: string[];
  aspect_code: string;
  term_id: string;                // unique_term_id format: T1-2024-25
  due_date?: string;
  assigned_to?: string;
}

export interface BulkUpdate {
  assessment_id: string;
  rating: Rating;
  evidence_comments: string;
}

export interface CreateAssessmentResponse {
  message: string;
  assessments_created: number;
  schools: string[];
  aspect_code: string;
  term_id: string;
}

export interface UpdateAssessmentResponse {
  message: string;
  assessment_id: string;
  status: AssessmentStatus;
}

export interface BulkUpdateResponse {
  message: string;
  updated_count: number;
  failed_count: number;
}

export interface UpdateStandardResponse {
  message: string;
  mat_standard_id: string;
  new_version_id: string;
  version_number: number;
  previous_version_id: string;
}

// ============================================================================
// User (simplified for assessment context)
// ============================================================================

export interface User {
  id?: string;
  name: string;
  email?: string;
  role?: string;
}

// ============================================================================
// Backward Compatibility Types
// ============================================================================

// Legacy types - kept for backward compatibility during migration
export interface StandardGroup {
  id: string;
  category: AssessmentCategory;
  standards: Standard[];
}

export interface SchoolPerformance {
  school: School;
  overallScore: number;
  status: AssessmentStatus;
  assessmentsByCategory: Array<{
    category: AssessmentCategory;
    name: string;
    status: AssessmentStatus;
    completedStandards: number;
    totalStandards: number;
    overallScore: number;
    lastUpdated: string;
    dueDate?: string;
    assignedTo?: User[];
    id: string;
  }>;
  criticalStandardsTotal: number;
  lastUpdated: string;
  completedAssessments: number;
  totalAssessments: number;
}

export interface HistoricScore {
  term: string;
  overallScore: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url?: string;
}

// ============================================================================
// Type Aliases for Migration
// ============================================================================

// v3 compatibility
export type MatAspect = Aspect;
export type MatStandard = Standard;
