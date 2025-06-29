import type {
  ApiAssessment,
  ApiSchool,
  ApiStandard,
  ApiUser,
  Assessment,
  School,
  Standard,
  User,
} from '@/types/assessment';

/**
 * Transforms a raw API school object into the frontend School format.
 */
export const transformSchool = (apiSchool: ApiSchool): School => {
  // The backend schema for schools doesn't have a 'code'.
  // We'll generate a simple one from the name as a fallback.
  const code = apiSchool.school_name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();

  return {
    id: apiSchool.school_id,
    name: apiSchool.school_name,
    code: code,
  };
};

/**
 * Transforms a raw API user object into the frontend User format.
 * (Assuming the API structure matches the frontend structure for now)
 */
export const transformUser = (apiUser: ApiUser): User => {
  return apiUser;
};

/**
 * Transforms a raw API standard object into the frontend Standard format.
 */
export const transformStandard = (apiStandard: ApiStandard): Standard => {
  return {
    id: apiStandard.standard_id,
    code: apiStandard.code,
    title: apiStandard.title,
    description: apiStandard.description,
    rating: apiStandard.rating,
    evidence: apiStandard.evidence_comments,
    lastUpdated: apiStandard.submitted_at,
  };
};

/**
 * Transforms a raw API assessment object into the frontend Assessment format.
 */
export const transformAssessment = (apiAssessment: ApiAssessment): Assessment => {
  return {
    id: apiAssessment.id,
    name: apiAssessment.name,
    category: apiAssessment.category,
    school: transformSchool(apiAssessment.school),
    status: apiAssessment.status,
    completedStandards: apiAssessment.completed_standards,
    totalStandards: apiAssessment.total_standards,
    lastUpdated: apiAssessment.last_updated,
    dueDate: apiAssessment.due_date,
    assignedTo: apiAssessment.assigned_to?.map(transformUser),
    standards: apiAssessment.standards?.map(transformStandard),
    term: apiAssessment.term,
    academicYear: apiAssessment.academic_year,
  };
}; 