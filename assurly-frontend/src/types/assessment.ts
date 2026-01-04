// ============================================================================
// src/types/assessment.ts - COMPLETE v4 TYPE DEFINITIONS
// ============================================================================

// Core Types
export type AssessmentStatus = 'not_started' | 'in_progress' | 'completed' | 'approved';
export type Rating = 1 | 2 | 3 | 4 | null;
export type SchoolType = 'primary' | 'secondary' | 'all_through' | 'special' | 'central';
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'no_data';

// Legacy types for backward compatibility during migration
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

export type AcademicTerm = "Autumn" | "Spring" | "Summer";
export type AcademicYear = string; // Format: "2024-2025" (long format)

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
// User & Auth
// ============================================================================

export interface User {
    user_id: string;
    email: string;
    full_name: string;
    mat_id: string;
    mat_name?: string;
    school_id: string | null;
    school_name?: string | null;
    role_title: string | null;
    is_active: boolean;
    last_login: string | null;
    // Legacy fields for backward compatibility
    id?: string;
    name?: string;
    role?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: 'bearer';
    user: User;
}

// ============================================================================
// Assessments
// ============================================================================

export interface AssessmentGroup {
    group_id: string;               // cedar-park-primary-EDU-T1-2024-25
    school_id: string;
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

export interface Assessment {
    id: string;
    assessment_id: string;          // cedar-park-primary-ES1-T1-2024-25
    school_id: string;
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
    assigned_to: string | null;
    assigned_to_name: string | null;
    submitted_at: string | null;
    submitted_by: string | null;
    submitted_by_name: string | null;
    last_updated: string;
    // Legacy fields for backward compatibility
    name?: string;
    category?: AssessmentCategory;
    school?: School;
    term?: AcademicTerm;
    completedStandards?: number;
    totalStandards?: number;
    standards?: Standard[];
    dueDate?: string | null;
    assignedTo?: Array<{id: string; name: string}> | null;
    lastUpdated?: string;
    academicYear?: AcademicYear;
    overallScore?: number;
}

export interface AssessmentByAspect {
    school_id: string;
    school_name: string;
    aspect_code: string;
    aspect_name: string;
    mat_aspect_id: string;
    term_id: string;
    academic_year: string;
    total_standards: number;
    completed_standards: number;
    status: AssessmentStatus;
    standards: AssessmentStandard[];
}

export interface AssessmentStandard {
    assessment_id: string;
    mat_standard_id: string;
    standard_code: string;
    standard_name: string;
    standard_description: string;
    sort_order: number;
    rating: Rating;
    evidence_comments: string | null;
    version_id: string;
    version_number: number;
    status: AssessmentStatus;
}

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

// ============================================================================
// Standards
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
    // Legacy fields for backward compatibility
    id?: string;
    code?: string;
    title?: string;
    description?: string;
    rating?: Rating;
    evidence?: string | null;
    version_number?: number;
    updated_at?: string;
    created_at?: string;
}

export interface StandardDetail extends Standard {
    created_at: string;
    updated_at: string;
    current_version: StandardVersion;
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
    standards_count: number;
    // Legacy fields for backward compatibility
    id?: string;
    name?: string;
    is_modified?: boolean;
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
    // Legacy fields for backward compatibility
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
    term_name: string;              // Autumn Term
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
// API Responses
// ============================================================================

export interface ApiSuccess<T = void> {
    message: string;
    data?: T;
}

export interface ApiError {
    detail: string;
    error_code?: string;
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
// Legacy Types (for backward compatibility during migration)
// ============================================================================

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url?: string;
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
