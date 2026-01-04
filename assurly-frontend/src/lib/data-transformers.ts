// ============================================================================
// v4.0 Data Transformers
// ============================================================================
// v4 API responses are mostly frontend-ready. Transformers now mainly:
// 1. Add backward compatibility fields
// 2. Normalize data structures
// 3. Map aspect codes to legacy category format

import type {
  Assessment,
  AssessmentGroup,
  AssessmentByAspect,
  AssessmentStandard,
  Standard,
  Aspect,
  School,
  Term,
  User,
  AssessmentCategory,
  AssessmentStatus,
  AcademicTerm,
} from '@/types/assessment';

// ============================================================================
// Mapping Utilities
// ============================================================================

/**
 * Maps aspect code to legacy category format
 * EDU -> education, HR -> hr, etc.
 */
const aspectCodeToCategory = (aspectCode: string): AssessmentCategory => {
  const map: Record<string, AssessmentCategory> = {
    'EDU': 'education',
    'HR': 'hr',
    'FIN': 'finance',
    'EST': 'estates',
    'GOV': 'governance',
    'IT': 'it',
    'IS': 'is',
  };
  return (map[aspectCode] || aspectCode.toLowerCase()) as AssessmentCategory;
};

/**
 * Maps API status to legacy display status
 */
const mapStatus = (status: AssessmentStatus): string => {
  const map: Partial<Record<AssessmentStatus, string>> = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'approved': 'Completed',
    'Not Started': 'Not Started',
    'In Progress': 'In Progress',
    'Completed': 'Completed',
    'Overdue': 'Overdue',
  };
  return map[status] || status;
};

/**
 * Maps term ID to legacy term name
 */
const mapTermId = (termId: string): AcademicTerm => {
  const map: Record<string, AcademicTerm> = {
    'T1': 'Autumn',
    'T2': 'Spring',
    'T3': 'Summer',
  };
  return map[termId] || 'Autumn';
};

/**
 * Expands short academic year to long format
 * 2024-25 -> 2024-2025
 */
const expandAcademicYear = (year: string): string => {
  if (/^\d{4}-\d{2}$/.test(year)) {
    const [start, end] = year.split('-');
    return `${start}-20${end}`;
  }
  return year;
};

// ============================================================================
// Assessment Group Transformers
// ============================================================================

/**
 * Transforms v4 AssessmentGroup response (already frontend-ready)
 * Adds backward compatibility fields for legacy components
 */
export const transformAssessmentGroup = (group: AssessmentGroup): Assessment => {
  return {
    // v4 fields (pass through)
    id: group.group_id,
    assessment_id: group.group_id,
    school_id: group.school_id,
    school_name: group.school_name,
    mat_aspect_id: group.mat_aspect_id,
    aspect_code: group.aspect_code,
    aspect_name: group.aspect_name,
    unique_term_id: `${group.term_id}-${group.academic_year}`,
    academic_year: group.academic_year,
    rating: null, // Groups don't have individual ratings
    evidence_comments: null,
    status: group.status,
    due_date: group.due_date,
    assigned_to: null,
    assigned_to_name: null,
    submitted_at: null,
    submitted_by: null,
    submitted_by_name: null,
    last_updated: group.last_updated,
    mat_standard_id: '',
    standard_code: '',
    standard_name: group.aspect_name,
    standard_description: '',
    version_id: '',
    version_number: 1,
    
    // Backward compatibility fields
    name: `${group.aspect_name} - ${group.school_name}`,
    category: aspectCodeToCategory(group.aspect_code),
    school: {
      school_id: group.school_id,
      school_name: group.school_name,
      id: group.school_id,
      name: group.school_name,
    },
    completedStandards: group.completed_standards,
    totalStandards: group.total_standards,
    lastUpdated: group.last_updated,
    dueDate: group.due_date || undefined,
    assignedTo: [],
    term: mapTermId(group.term_id),
    academicYear: expandAcademicYear(group.academic_year),
  };
};

// ============================================================================
// Assessment Transformers
// ============================================================================

/**
 * Transforms v4 Assessment response (already frontend-ready)
 * Adds backward compatibility fields
 */
export const transformAssessment = (assessment: Assessment): Assessment => {
  return {
    ...assessment,
    // Add backward compatibility fields
    name: `${assessment.standard_name} - ${assessment.school_name}`,
    category: aspectCodeToCategory(assessment.aspect_code),
    school: {
      school_id: assessment.school_id,
      school_name: assessment.school_name,
      id: assessment.school_id,
      name: assessment.school_name,
    },
    completedStandards: assessment.rating ? 1 : 0,
    totalStandards: 1,
    lastUpdated: assessment.last_updated,
    dueDate: assessment.due_date || undefined,
    assignedTo: assessment.assigned_to_name ? [{
      id: assessment.assigned_to || '',
      name: assessment.assigned_to_name,
      email: '',
      role: '',
    }] : [],
    term: mapTermId(assessment.unique_term_id.split('-')[0]),
    academicYear: expandAcademicYear(assessment.academic_year),
  };
};

/**
 * Transforms v4 AssessmentByAspect response (already frontend-ready)
 */
export const transformAssessmentByAspect = (data: AssessmentByAspect): AssessmentByAspect => {
  // v4 response is already perfect for frontend - pass through
  return data;
};

/**
 * Transforms v4 AssessmentStandard (already frontend-ready)
 */
export const transformAssessmentStandard = (standard: AssessmentStandard): AssessmentStandard => {
  // v4 response is already perfect - pass through
  return standard;
};

// ============================================================================
// Standard Transformers
// ============================================================================

/**
 * Transforms v4 Standard response (already frontend-ready)
 */
export const transformStandard = (standard: Standard): Standard => {
  // v4 response is already perfect - pass through
  return standard;
};

/**
 * Transforms v4 standard response to include backward compat fields
 */
export const transformStandardResponse = (apiStandard: Standard): Standard => {
  return {
    ...apiStandard,
    // v4 already has all required fields
  };
};

// ============================================================================
// Aspect Transformers
// ============================================================================

/**
 * Transforms v4 Aspect response (already frontend-ready)
 */
export const transformAspect = (aspect: Aspect): Aspect => {
  // v4 response is already perfect - pass through
  return aspect;
};

/**
 * Transforms v4 aspect response
 */
export const transformAspectResponse = (apiAspect: Aspect): Aspect => {
  return {
    ...apiAspect,
    // v4 already has all required fields
  };
};

// ============================================================================
// School Transformers
// ============================================================================

/**
 * Transforms v4 School response
 * Adds backward compatibility fields
 */
export const transformSchool = (school: School): School => {
  return {
    ...school,
    id: school.school_id,
    name: school.school_name,
    code: school.school_id, // Use ID as code for backward compat
  };
};

/**
 * Simple school transformer for ID + name only
 */
export const transformSchoolBasic = (schoolId: string, schoolName: string): School => {
  return {
    school_id: schoolId,
    school_name: schoolName,
    id: schoolId,
    name: schoolName,
    code: schoolId,
  };
};

// ============================================================================
// Term Transformers
// ============================================================================

/**
 * Transforms v4 Term response (already frontend-ready)
 */
export const transformTerm = (term: Term): Term => {
  // v4 response is already perfect - pass through
  return term;
};

// ============================================================================
// User Transformers
// ============================================================================

/**
 * Transforms user ID to basic User object
 * For when we only have the ID
 */
export const transformUserId = (userId: string, userName?: string): User => {
  return {
    id: userId,
    name: userName || `User ${userId}`,
    email: `${userId}@example.com`, // Placeholder
    role: 'User',
  };
};

/**
 * Transforms v4 user response from auth
 */
export const transformUser = (user: import('@/types/auth').User): User => {
  return {
    id: user.user_id,
    name: user.full_name,
    email: user.email,
    role: user.role_title || 'User',
  };
};

// ============================================================================
// Assessment Summary Transformer (for list views)
// ============================================================================

/**
 * Transforms assessment group to legacy Assessment format for list views
 * Used by components that expect the old Assessment interface
 */
export const transformAssessmentSummary = transformAssessmentGroup;

/**
 * Transforms assessment detail to legacy Assessment format
 * Used by components that expect the old Assessment interface with standards
 */
export const transformAssessmentDetail = transformAssessment;

// ============================================================================
// Batch Transformers
// ============================================================================

/**
 * Transforms array of assessment groups
 */
export const transformAssessmentGroups = (groups: AssessmentGroup[]): Assessment[] => {
  return groups.map(transformAssessmentGroup);
};

/**
 * Transforms array of standards
 */
export const transformStandards = (standards: Standard[]): Standard[] => {
  return standards.map(transformStandard);
};

/**
 * Transforms array of aspects
 */
export const transformAspects = (aspects: Aspect[]): Aspect[] => {
  return aspects.map(transformAspect);
};

/**
 * Transforms array of schools
 */
export const transformSchools = (schools: School[]): School[] => {
  return schools.map(transformSchool);
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parses unique_term_id into components
 * T1-2024-25 -> { termId: "T1", academicYear: "2024-25" }
 */
export const parseUniqueTerm = (uniqueTermId: string): { termId: string; academicYear: string } => {
  const match = uniqueTermId.match(/^(T\d+)-(.+)$/);
  if (!match) {
    throw new Error(`Invalid unique_term_id format: ${uniqueTermId}`);
  }
  return {
    termId: match[1],
    academicYear: match[2],
  };
};

/**
 * Parses assessment_id into components
 * cedar-park-primary-ES1-T1-2024-25 -> components
 */
export const parseAssessmentId = (assessmentId: string): {
  schoolId: string;
  standardCode: string;
  termId: string;
  academicYear: string;
} => {
  // Format: {school-id}-{standard-code}-{term}-{year}
  // Split from the end to handle school IDs with hyphens
  const parts = assessmentId.split('-');
  
  if (parts.length < 5) {
    throw new Error(`Invalid assessment_id format: ${assessmentId}`);
  }
  
  // Last 3 parts are: T{N}, YYYY, YY
  const academicYear = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
  const termId = parts[parts.length - 3];
  const standardCode = parts[parts.length - 4];
  const schoolId = parts.slice(0, -4).join('-');
  
  return {
    schoolId,
    standardCode,
    termId,
    academicYear,
  };
};

/**
 * Parses group_id into components
 * cedar-park-primary-EDU-T1-2024-25 -> components
 */
export const parseGroupId = (groupId: string): {
  schoolId: string;
  aspectCode: string;
  termId: string;
  academicYear: string;
} => {
  // Format: {school-id}-{aspect-code}-{term}-{year}
  // Split from the end to handle school IDs with hyphens
  const parts = groupId.split('-');
  
  if (parts.length < 5) {
    throw new Error(`Invalid group_id format: ${groupId}`);
  }
  
  // Last 3 parts are: T{N}, YYYY, YY
  const academicYear = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
  const termId = parts[parts.length - 3];
  const aspectCode = parts[parts.length - 4];
  const schoolId = parts.slice(0, -4).join('-');
  
  return {
    schoolId,
    aspectCode,
    termId,
    academicYear,
  };
};

// ============================================================================
// Export all transformers
// ============================================================================

export {
  aspectCodeToCategory,
  mapStatus,
  mapTermId,
  expandAcademicYear,
};

// Removed duplicate export - transformAssessment is defined earlier in the file 