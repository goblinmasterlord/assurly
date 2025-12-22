import type {
  Assessment,
  School,
  MatStandard,
  User,
  AcademicTerm,
  AssessmentCategory,
} from '@/types/assessment';

// API response types for the actual backend (from ASSESSMENT_API_SPECIFICATION.md)
interface ApiAssessmentSummary {
  assessment_id: string;                        // Composite: {school_id}-{aspect_id}-{term_id}-{academic_year}
  school_id: string;
  school_name: string;
  aspect_id: string;                            // Simple string: "edu", "gov", "safe"
  aspect_code: string;                          // "EDU", "GOV", "SAFE"
  aspect_name: string;                          // "Education", "Governance"
  term_id: string;                              // "T1", "T2", "T3"
  academic_year: string;                        // "2024-2025"
  due_date: string | null;
  assigned_to: string | null;                   // Single user UUID (backend returns single, not array)
  last_updated: string | null;
  updated_by: string | null;
  status: 'not_started' | 'in_progress' | 'submitted';
  total_standards: number;
  completed_standards: number;
}

interface ApiStandardRating {
  standard_id: string;                          // UUID
  standard_name: string;
  description: string;                          // Currently empty in responses
  area_id: string;                              // Same as aspect_id
  rating: number | null;                        // 0-4
  evidence_comments: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  has_attachments: 0 | 1;                       // Boolean as int
}

interface ApiAssessmentDetail {
  assessment_id: string;
  name: string;                                 // Auto-generated display name
  school_id: string;
  school_name: string;
  aspect_id: string;                            // Simple string: "edu", "gov"
  aspect_code: string;                          // "EDU", "GOV"
  aspect_name: string;                          // "Education", "Governance"
  term_id: string;
  academic_year: string;
  status: 'not_started' | 'in_progress' | 'submitted';
  due_date: string | null;
  assigned_to: string[];                        // Array of user UUIDs
  last_updated: string | null;
  updated_by: string | null;
  standards: ApiStandardRating[];
}

// New API types for schools and standards endpoints
interface ApiSchoolResponse {
  school_id: string;
  school_name: string;
  mat_id: string;
  mat_name: string;
  school_code: string;
}

interface ApiStandardResponse {
  mat_standard_id: string;  // v3.0 field
  mat_id?: string;  // May be provided
  mat_aspect_id: string;  // v3.0 field
  standard_code: string;
  standard_name: string;
  standard_description?: string;
  aspect_code?: string;
  aspect_name?: string;
  sort_order?: number;
  version_number?: number;
  version_id?: string;
  is_custom?: boolean;
  is_modified?: boolean;
  source_standard_id?: string;
}

// ------------------------------
// Mapping Utilities
// ------------------------------

const termMap: Record<string, AcademicTerm> = {
  T1: 'Autumn',
  T2: 'Spring',
  T3: 'Summer',
};

// Status mapping moved to mapStatus function below

/**
 * Normalises category strings to match our `AssessmentCategory` union type.
 * Keeps categories in lowercase to match backend format
 * Example: "education" → "education"
 */
const normaliseCategory = (category: string): AssessmentCategory => {
  // Keep lowercase to match backend format
  return category.toLowerCase() as AssessmentCategory;
};

/**
 * Converts academic year from short format ("2024-25") to long format ("2024-2025").
 */
const expandAcademicYear = (year: string): string => {
  if (/^\d{4}-\d{2}$/.test(year)) {
    const [start, end] = year.split('-');
    // If end has 2 digits, prepend the first two digits of the start year
    const endFull = start.slice(0, 2) + end;
    return `${start}-${endFull}`;
  }
  return year;
};

/**
 * Maps backend term IDs to frontend term names
 */
const mapTermIdToTerm = (termId: string): string => {
  const termMap: Record<string, string> = {
    'T1': 'Autumn',
    'T2': 'Spring',
    'T3': 'Summer',
  };
  return termMap[termId] || termId; // Fallback to original if not found
};

/**
 * Maps backend academic year format to frontend format
 */
const mapAcademicYear = (academicYear: string): string => {
  // Convert "2024-25" to "2024-2025"
  if (academicYear.includes('-') && academicYear.length === 7) {
    const [startYear, endYearShort] = academicYear.split('-');
    const endYear = `20${endYearShort}`;
    return `${startYear}-${endYear}`;
  }
  return academicYear; // Return as-is if format is unexpected
};


/**
 * Maps backend status to frontend status format
 */
const mapStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'completed': 'Completed',
    'in_progress': 'In Progress',
    'not_started': 'Not Started',
    'overdue': 'Overdue',
  };
  return statusMap[status.toLowerCase()] || status;
};

/**
 * Transforms API school data into frontend School format.
 */
export const transformSchool = (schoolId: string, schoolName: string): School => {
  // Generate a simple code from the name
  const code = schoolName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();

  return {
    id: schoolId,
    name: schoolName,
    code: code,
  };
};

/**
 * Transforms API school response into frontend School format.
 */
export const transformSchoolResponse = (apiSchool: ApiSchoolResponse): School => {
  return {
    id: apiSchool.school_id,
    name: apiSchool.school_name,
    code: apiSchool.school_code,
  };
};

/**
 * Transforms API user string to frontend User format.
 * For now, we'll create basic user objects from the user IDs.
 */
export const transformUser = (userId: string): User => {
  return {
    id: userId,
    name: `User ${userId}`, // Placeholder until we have user details
    email: `${userId}@example.com`, // Placeholder
    role: 'Department Head', // Placeholder
  };
};

/**
 * Transforms API standard rating (from assessment) into frontend MatStandard format.
 * Note: Assessment API uses simple IDs, not MAT-scoped UUIDs.
 */
export const transformStandard = (apiStandard: ApiStandardRating): MatStandard => {
  return {
    mat_standard_id: apiStandard.standard_id,         // Map simple ID to mat_standard_id for frontend compatibility
    mat_id: '',                                       // Not provided in assessment context
    mat_aspect_id: apiStandard.area_id,               // Map area_id to mat_aspect_id
    standard_code: '',                                // Not provided in assessment API
    standard_name: apiStandard.standard_name,
    standard_description: apiStandard.description || '',
    sort_order: 0,                                    // Not provided in assessment API
    source_standard_id: undefined,
    is_custom: false,
    is_modified: false,
    version_number: 1,
    version_id: '',
    aspect_code: '',
    aspect_name: '',
    is_active: true,
    created_at: '',
    updated_at: apiStandard.submitted_at || '',
    // Assessment-specific fields
    rating: apiStandard.rating as any,
    evidence_comments: apiStandard.evidence_comments || '',
    submitted_at: apiStandard.submitted_at || undefined,
    submitted_by: apiStandard.submitted_by || '',
  };
};

/**
 * Transforms API standard response into frontend MatStandard format (v3.0).
 */
export const transformStandardResponse = (apiStandard: ApiStandardResponse): MatStandard => {
  return {
    mat_standard_id: apiStandard.mat_standard_id,
    mat_id: apiStandard.mat_id || '', // May not be provided
    mat_aspect_id: apiStandard.mat_aspect_id,
    standard_code: apiStandard.standard_code,
    standard_name: apiStandard.standard_name,
    standard_description: apiStandard.standard_description || '',
    sort_order: apiStandard.sort_order ?? 0,
    source_standard_id: undefined,
    is_custom: apiStandard.is_custom ?? false,
    is_modified: apiStandard.is_modified ?? false,
    version_number: apiStandard.version_number || 1,
    version_id: apiStandard.version_id || '',
    aspect_code: apiStandard.aspect_code || '',
    aspect_name: apiStandard.aspect_name || '',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Assessment-specific fields (not present in this context)
    rating: null,
    evidence_comments: '',
  };
};

/**
 * Transforms API assessment summary into frontend Assessment format.
 * Maps from actual backend schema (simple aspect_id) to frontend format.
 */
export const transformAssessmentSummary = (apiAssessment: ApiAssessmentSummary): Assessment => {
  return {
    id: apiAssessment.assessment_id,
    name: `${apiAssessment.aspect_name} - ${apiAssessment.term_id} ${apiAssessment.academic_year}`,
    category: normaliseCategory(apiAssessment.aspect_id) as any,  // Map aspect_id to category
    school: transformSchool(apiAssessment.school_id, apiAssessment.school_name),
    status: mapStatus(apiAssessment.status) as any,
    completedStandards: apiAssessment.completed_standards,
    totalStandards: apiAssessment.total_standards,
    lastUpdated: apiAssessment.last_updated || new Date().toISOString(),
    dueDate: apiAssessment.due_date || undefined,
    assignedTo: apiAssessment.assigned_to ? [transformUser(apiAssessment.assigned_to)] : [],
    term: termMap[apiAssessment.term_id] || (apiAssessment.term_id as any),
    academicYear: expandAcademicYear(apiAssessment.academic_year),
    overallScore: undefined,  // Calculated from standards if needed
  };
};

/**
 * Transforms API assessment detail into frontend Assessment format.
 * Maps from actual backend schema (simple aspect_id) to frontend format.
 */
export const transformAssessmentDetail = (apiAssessment: ApiAssessmentDetail): Assessment => {
  return {
    id: apiAssessment.assessment_id,
    name: apiAssessment.name,
    category: normaliseCategory(apiAssessment.aspect_id) as any,  // Map aspect_id to category
    school: transformSchool(apiAssessment.school_id, apiAssessment.school_name),
    status: mapStatus(apiAssessment.status) as any,
    completedStandards: apiAssessment.standards.filter(s => s.rating !== null && s.rating > 0).length,
    totalStandards: apiAssessment.standards.length,
    lastUpdated: apiAssessment.last_updated || new Date().toISOString(),
    dueDate: apiAssessment.due_date || undefined,
    assignedTo: apiAssessment.assigned_to?.map(transformUser) || [],
    standards: apiAssessment.standards.map(transformStandard),
    term: termMap[apiAssessment.term_id] || (apiAssessment.term_id as any),
    academicYear: expandAcademicYear(apiAssessment.academic_year),
  };
};

// Legacy export for backward compatibility
export const transformAssessment = transformAssessmentDetail; 