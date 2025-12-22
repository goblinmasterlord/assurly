import type {
  Assessment,
  School,
  MatStandard,
  User,
  AcademicTerm,
  AssessmentCategory,
} from '@/types/assessment';

// API response types for the real backend
interface ApiAssessmentSummary {
  assessment_id: string;
  name: string;
  category: string;
  school_id: string;
  school_name: string;
  mat_id: string;
  status: string;
  completed_standards: number;
  total_standards: number;
  completion_percentage: number;
  overall_score: number;
  due_date: string;
  assigned_to: string[];
  last_updated: string;
  updated_by: string | null;
  term_id: string;
  academic_year: string;
}

interface ApiStandardDetail {
  mat_standard_id: string;  // v3.0 field
  standard_code: string;
  standard_name: string;
  standard_description: string;
  mat_aspect_id: string;  // v3.0 field
  aspect_name: string;
  rating: number | null;
  evidence_comments: string;
  submitted_at: string | null;
  submitted_by: string;
  has_attachments: number;
  version_number?: number;
  version_id?: string;
  sort_order?: number;
}

interface ApiAssessmentDetail extends Omit<ApiAssessmentSummary, 'mat_id' | 'completed_standards' | 'total_standards' | 'completion_percentage' | 'overall_score'> {
  standards: ApiStandardDetail[];
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
  mat_aspect_id: string;  // v3.0 field
  standard_code: string;
  standard_name: string;
  standard_description: string;
  aspect_code: string;
  aspect_name: string;
  sort_order: number;
  version_number: number;
  version_id: string;
  is_custom: boolean;
  is_modified: boolean;
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
 * Transforms API standard detail into frontend MatStandard format (v3.0).
 */
export const transformStandard = (apiStandard: ApiStandardDetail): MatStandard => {
  return {
    mat_standard_id: apiStandard.mat_standard_id,
    mat_id: '', // Not always provided in assessment context
    mat_aspect_id: apiStandard.mat_aspect_id,
    standard_code: apiStandard.standard_code,
    standard_name: apiStandard.standard_name,
    standard_description: apiStandard.standard_description || '',
    sort_order: apiStandard.sort_order || 0,
    source_standard_id: undefined,
    is_custom: false,
    is_modified: false,
    version_number: apiStandard.version_number || 1,
    version_id: apiStandard.version_id || '',
    aspect_name: apiStandard.aspect_name,
    is_active: true,
    created_at: '',
    updated_at: apiStandard.submitted_at || '',
    // Assessment-specific fields
    rating: apiStandard.rating as any,
    evidence_comments: apiStandard.evidence_comments,
    submitted_at: apiStandard.submitted_at || undefined,
    submitted_by: apiStandard.submitted_by,
  };
};

/**
 * Transforms API standard response into frontend MatStandard format (v3.0).
 */
export const transformStandardResponse = (apiStandard: ApiStandardResponse): MatStandard => {
  return {
    mat_standard_id: apiStandard.mat_standard_id,
    mat_id: '', // Not provided in this endpoint
    mat_aspect_id: apiStandard.mat_aspect_id,
    standard_code: apiStandard.standard_code,
    standard_name: apiStandard.standard_name,
    standard_description: apiStandard.standard_description || '',
    sort_order: apiStandard.sort_order,
    source_standard_id: undefined,
    is_custom: apiStandard.is_custom,
    is_modified: apiStandard.is_modified,
    version_number: apiStandard.version_number,
    version_id: apiStandard.version_id,
    aspect_code: apiStandard.aspect_code,
    aspect_name: apiStandard.aspect_name,
    is_active: true,
    created_at: '',
    updated_at: '',
    // Assessment-specific fields (not present in this context)
    rating: null,
    evidence_comments: '',
  };
};

/**
 * Transforms API assessment summary into frontend Assessment format.
 */
export const transformAssessmentSummary = (apiAssessment: ApiAssessmentSummary): Assessment => {
  return {
    id: apiAssessment.assessment_id,
    name: apiAssessment.name,
    category: normaliseCategory(apiAssessment.category) as any,
    school: transformSchool(apiAssessment.school_id, apiAssessment.school_name),
    status: mapStatus(apiAssessment.status) as any,
    completedStandards: apiAssessment.completed_standards,
    totalStandards: apiAssessment.total_standards,
    lastUpdated: apiAssessment.last_updated,
    dueDate: apiAssessment.due_date,
    assignedTo: apiAssessment.assigned_to.map(transformUser),
    term: termMap[apiAssessment.term_id] || (apiAssessment.term_id as any),
    academicYear: expandAcademicYear(apiAssessment.academic_year),
    // Include the overall score from the API response
    overallScore: apiAssessment.overall_score,
    // Note: standards will be undefined for summary view
  };
};

/**
 * Transforms API assessment detail into frontend Assessment format.
 */
export const transformAssessmentDetail = (apiAssessment: ApiAssessmentDetail): Assessment => {
  return {
    id: apiAssessment.assessment_id,
    name: apiAssessment.name,
    category: normaliseCategory(apiAssessment.category) as any,
    school: transformSchool(apiAssessment.school_id, apiAssessment.school_name),
    status: mapStatus(apiAssessment.status) as any,
    completedStandards: apiAssessment.standards.filter(s => s.rating !== null).length,
    totalStandards: apiAssessment.standards.length,
    lastUpdated: apiAssessment.last_updated,
    dueDate: apiAssessment.due_date,
    assignedTo: apiAssessment.assigned_to.map(transformUser),
    standards: apiAssessment.standards.map(transformStandard),
    term: termMap[apiAssessment.term_id] || (apiAssessment.term_id as any),
    academicYear: expandAcademicYear(apiAssessment.academic_year),
  };
};

// Legacy export for backward compatibility
export const transformAssessment = transformAssessmentDetail; 