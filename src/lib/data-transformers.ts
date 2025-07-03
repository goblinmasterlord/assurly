import type {
  Assessment,
  School,
  Standard,
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
  standard_id: string;
  standard_name: string;
  description: string;
  area_id: string;
  rating: number | null;
  evidence_comments: string;
  submitted_at: string | null;
  submitted_by: string;
  has_attachments: number;
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
  standard_id: string;
  standard_name: string;
  aspect_id: string;
  aspect_name: string;
  description: string;
  sort_order: number;
}

// ------------------------------
// Mapping Utilities
// ------------------------------

const termMap: Record<string, AcademicTerm> = {
  T1: 'Autumn',
  T2: 'Spring',
  T3: 'Summer',
};

const statusMap: Record<string, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  not_started: 'Not Started',
};

/**
 * Normalises category strings to match our `AssessmentCategory` union type.
 * Example: "education" → "Education"
 */
const normaliseCategory = (category: string): AssessmentCategory => {
  // Convert to Title Case and handle ampersand spacing
  return category
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') as AssessmentCategory;
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
 * Maps backend category to frontend category format
 */
const mapCategory = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'education': 'Education',
    'finance': 'Finance & Procurement',
    'hr': 'Human Resources',
    'estates': 'Estates',
    'governance': 'Governance',
    'it': 'IT & Information Services',
    'is': 'IT & Information Services', // Information Standards -> IT & Information Services
  };
  return categoryMap[category.toLowerCase()] || category;
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
 * Transforms API standard detail into frontend Standard format.
 */
export const transformStandard = (apiStandard: ApiStandardDetail): Standard => {
  return {
    id: apiStandard.standard_id,
    code: apiStandard.standard_id, // Using standard_id as code
    title: apiStandard.standard_name,
    description: apiStandard.description,
    rating: apiStandard.rating as any, // Type assertion for rating
    evidence: apiStandard.evidence_comments,
    lastUpdated: apiStandard.submitted_at || undefined,
    attachments: [], // TODO: Handle attachments when backend supports them
  };
};

/**
 * Transforms API standard response into frontend Standard format.
 */
export const transformStandardResponse = (apiStandard: ApiStandardResponse): Standard => {
  return {
    id: apiStandard.standard_id,
    code: apiStandard.standard_id,
    title: apiStandard.standard_name,
    description: apiStandard.description,
    rating: null, // Standards from this endpoint don't have ratings yet
    evidence: '',
    attachments: [],
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
    status: (statusMap[apiAssessment.status] || apiAssessment.status) as any,
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
    status: (statusMap[apiAssessment.status] || apiAssessment.status) as any,
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