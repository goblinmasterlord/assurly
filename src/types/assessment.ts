// Assessment categories (matching backend API exactly)
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

// Legacy Aspect interface (v2.x) - DEPRECATED
// Use MatAspect (aliased as Aspect below) for v3.0
// Keeping this commented for reference during migration
/*
export interface AspectLegacy {
  id: string;
  code: string;
  name: string;
  description: string;
  isCustom: boolean;
  standardCount: number;
}
*/

// Academic terms
export type AcademicTerm =
  | "Autumn"
  | "Spring"
  | "Summer";

// Academic years
export type AcademicYear = string; // Format: "2023-2024"

// Rating scale 1-4
export type Rating = 1 | 2 | 3 | 4 | null;

// Rating labels for display
export const RatingLabels: Record<NonNullable<Rating>, string> = {
  1: "Inadequate",
  2: "Requires Improvement",
  3: "Good",
  4: "Outstanding"
};

// Rating descriptions for each level
export const RatingDescriptions: Record<NonNullable<Rating>, string> = {
  1: "Significant weaknesses requiring immediate intervention and urgent improvement",
  2: "Basic standards met with notable areas for development and improvement",
  3: "Consistent, effective practice with some areas of strength",
  4: "Exemplary, sector-leading practice with evidence of sustained impact"
};

// Assessment status
export type AssessmentStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "Overdue";

// File attachment interface
export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url?: string; // For actual file URL in production
}

// Legacy Standard interface (v2.x) - DEPRECATED
// Use MatStandard (aliased as Standard below) for v3.0
// Keeping this commented for reference during migration
/*
export interface StandardLegacy {
  id: string;
  code: string;
  title: string;
  description: string;
  rating: Rating;
  evidence?: string;
  lastUpdated?: string;
  attachments?: FileAttachment[];
  aspectId?: string;
  category?: AssessmentCategory;
  version?: number;
  status?: 'active' | 'archived' | 'draft';
  lastModified?: string;
  lastModifiedBy?: string;
  orderIndex?: number;
  versions?: any[];
}
*/

// Group of standards for a category
export interface StandardGroup {
  id: string;
  category: AssessmentCategory;
  standards: Standard[];
}

// School performance summary for the new school-centric view
export interface SchoolPerformance {
  school: School;
  overallScore: number;
  status: AssessmentStatus; // School-level status calculated from individual assessments
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

// Assessment model
export interface Assessment {
  id: string;
  name: string;
  category: AssessmentCategory;
  school: School;
  completedStandards: number;
  totalStandards: number;
  lastUpdated: string;
  status: AssessmentStatus;
  dueDate?: string;
  assignedTo?: User[];
  standards?: Standard[];
  term?: AcademicTerm;
  academicYear?: AcademicYear;
  overallScore?: number; // Overall score for the assessment (available in summary data)
}

// Historic score data point
export interface HistoricScore {
  term: string;
  overallScore: number;
}

// School model
export interface School {
  id: string;
  name: string;
  code?: string;
  historicScores?: HistoricScore[];
}

// User model
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// --- API Response Types ---
// These types represent the raw data structure we expect from the backend API.
// We will transform this data into the component-friendly types above.

export interface ApiSchool {
  school_id: string;
  school_name: string;
  // 'code' is on the frontend type but not in the DB schema, will handle in transformer
}

export interface ApiUser {
  id: string; // Assuming API returns 'id' directly
  name: string;
  email: string;
  role: string;
}

export interface ApiStandard {
  standard_id: string;
  code: string;
  title: string;
  description: string;
  rating: Rating; // Assuming BE sends a number or null
  evidence_comments?: string;
  submitted_at?: string; // or last_updated
}

export interface ApiAssessment {
  // This mirrors the aggregated data we expect from `GET /api/assessments`
  id: string;
  name: string;
  category: AssessmentCategory;
  school: ApiSchool;
  status: AssessmentStatus;
  completed_standards: number;
  total_standards: number;
  last_updated: string;
  due_date?: string;
  assigned_to?: ApiUser[];
  standards?: ApiStandard[];
  term?: AcademicTerm;
  academic_year?: AcademicYear;
}

// ============================================================================
// v3.0 Multi-Tenant Types (MAT-scoped)
// ============================================================================

// MAT-scoped Aspect with copy-on-write tracking
export interface MatAspect {
  mat_aspect_id: string;
  mat_id: string;
  aspect_code: string;
  aspect_name: string;
  aspect_description?: string;
  sort_order: number;
  source_aspect_id?: string;  // For copy-on-write tracking
  is_custom: boolean;         // Created by this MAT
  is_modified: boolean;       // Modified from source
  standards_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// MAT-scoped Standard with immutable versioning
export interface MatStandard {
  mat_standard_id: string;
  mat_id: string;
  mat_aspect_id: string;
  standard_code: string;
  standard_name: string;
  standard_description?: string;
  sort_order: number;
  source_standard_id?: string;  // For copy-on-write tracking
  is_custom: boolean;
  is_modified: boolean;
  version_number: number;
  version_id: string;
  aspect_code?: string;         // For display
  aspect_name?: string;         // For display
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Assessment-specific fields (when in assessment context)
  rating?: Rating;
  evidence_comments?: string;
  submitted_at?: string;
  submitted_by?: string;
}

// Standard Version History
export interface StandardVersion {
  version_id: string;
  mat_standard_id: string;
  version_number: number;
  standard_code: string;
  standard_name: string;
  standard_description?: string;
  effective_from: string;
  effective_to: string | null;  // null = current version
  created_by_user_id: string;
  change_reason?: string;
  created_at: string;
}

// Type aliases for backward compatibility during migration
export type Aspect = MatAspect;
export type Standard = MatStandard; 