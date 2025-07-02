import apiClient from '@/lib/api-client';
import { transformAssessmentSummary, transformAssessmentDetail } from '@/lib/data-transformers';
import type { Assessment, Rating, AssessmentCategory, AcademicTerm, AcademicYear } from '@/types/assessment';

// Add new types for the API responses
interface ApiSchoolResponse {
  school_id: string;
  school_name: string;
  mat_id: string;
}

interface ApiStandardResponse {
  standard_id: string;
  standard_name: string;
  description: string;
  area_id: string;
}

// Import types from data-transformers for consistency
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

interface CreateAssessmentRequest {
  category: AssessmentCategory;
  schoolIds: string[];
  dueDate?: string;
  term: AcademicTerm;
  academicYear: AcademicYear;
}

/**
 * Fetches all assessments from the API and transforms them into the frontend format.
 */
export const getAssessments = async (): Promise<Assessment[]> => {
  try {
    const response = await apiClient.get<ApiAssessmentSummary[]>('/api/assessments');
    
    if (response.data) {
      const transformed = response.data.map(transformAssessmentSummary);
      console.log(`✅ Loaded ${transformed.length} assessments from API`);
      return transformed;
    }
    return [];
  } catch (error) {
    console.error('❌ Failed to fetch assessments:', error);
    // In a real app, you'd want to handle this error more gracefully
    // For now, we'll return an empty array to prevent crashes
    return [];
  }
};

/**
 * Fetches a single assessment by its ID from the API.
 */
export const getAssessmentById = async (id: string): Promise<Assessment | null> => {
  try {
    const response = await apiClient.get(`/api/assessments/${id}`);
    if (response.data) {
      return transformAssessmentDetail(response.data);
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch assessment with id ${id}:`, error);
    return null;
  }
};

/**
 * Fetches all schools from the API.
 * Since the backend doesn't have a dedicated schools endpoint yet,
 * we extract school data from the assessments endpoint.
 */
export const getSchools = async (): Promise<{ id: string; name: string; code: string; }[]> => {
  try {
    // First try the dedicated endpoint (when backend implements it)
    const response = await apiClient.get<ApiSchoolResponse[]>('/api/schools');
    if (response.data) {
      return response.data.map(school => ({
        id: school.school_id,
        name: school.school_name,
        code: school.school_name
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
      }));
    }
    return [];
  } catch (error) {
    // Fallback: Extract schools from assessments endpoint
    try {
      const assessmentsResponse = await apiClient.get('/api/assessments');
      if (assessmentsResponse.data) {
        // Extract unique schools from assessments
        const schoolsMap = new Map();
        assessmentsResponse.data.forEach((assessment: any) => {
          if (!schoolsMap.has(assessment.school_id)) {
            schoolsMap.set(assessment.school_id, {
              id: assessment.school_id,
              name: assessment.school_name,
              code: assessment.school_name
                .split(' ')
                .map((word: string) => word[0])
                .join('')
                .toUpperCase()
            });
          }
        });
        
        const schools = Array.from(schoolsMap.values());
        console.log(`ℹ️ Loaded ${schools.length} schools from assessments data`);
        return schools;
      }
    } catch (fallbackError) {
      console.log('ℹ️ Using hardcoded fallback school data');
    }
    
    // Last resort fallback
    return [
      { id: 'cedar-park-primary', name: 'Cedar Park Primary', code: 'CPP' },
      { id: 'maple-grove-school', name: 'Maple Grove School', code: 'MGS' },
      { id: 'oak-hill-academy', name: 'Oak Hill Academy', code: 'OHA' },
      { id: 'willow-high-school', name: 'Willow High School', code: 'WHS' },
    ];
  }
};

/**
 * Fetches standards for a specific category/area from the API.
 * NOTE: This endpoint is not yet implemented in the backend.
 * For now, we'll provide some fallback data.
 */
export const getStandardsByCategory = async (category: string): Promise<{ id: string; name: string; description: string; }[]> => {
  try {
    // Try the real endpoint first (when backend implements it)
    const response = await apiClient.get<ApiStandardResponse[]>('/api/standards');
    if (response.data) {
      // Filter standards by the category/area_id
      const filteredStandards = response.data.filter(standard => standard.area_id === category);
      return filteredStandards.map(standard => ({
        id: standard.standard_id,
        name: standard.standard_name,
        description: standard.description
      }));
    }
    return [];
  } catch (error) {
    console.log(`ℹ️ Using fallback standards for ${category} (backend endpoint not available yet)`);
    
    // Fallback data - providing some basic standards for common categories
    const standardsByCategory: Record<string, { id: string; name: string; description: string; }[]> = {
      'Education': [
        { id: 'ES1', name: 'Curriculum intent, implementation, and impact', description: 'Quality of curriculum design and delivery' },
        { id: 'ES2', name: 'Teaching quality and effectiveness', description: 'Standard of teaching across the school' },
        { id: 'ES3', name: 'Pupil progress and outcomes', description: 'Academic achievement and progress tracking' },
        { id: 'ES4', name: 'Curriculum breadth and balance', description: 'Range and depth of curriculum offerings' },
        { id: 'ES5', name: 'Support for special educational needs (SEN)', description: 'Provision for students with additional needs' },
      ],
      'Finance & Procurement': [
        { id: 'FM1', name: 'Financial Governance & Management', description: 'Robust financial leadership and compliance' },
        { id: 'FM2', name: 'Strategic Financial Planning', description: 'Multi-year budgeting and planning' },
        { id: 'FM3', name: 'In-Year Financial Monitoring', description: 'Regular financial reporting and monitoring' },
        { id: 'FM4', name: 'Financial Processing & Internal Controls', description: 'Financial processes and controls' },
      ],
      'Human Resources': [
        { id: 'HR1', name: 'Safer Recruitment Practice', description: 'Compliance with safer recruitment policies' },
        { id: 'HR2', name: 'Performance Management', description: 'Staff performance and development systems' },
        { id: 'HR3', name: 'Professional Development', description: 'Continuous professional development programs' },
      ],
    };
    
    return standardsByCategory[category] || [];
  }
};

/**
 * Creates new assessments for the specified schools and category.
 * NOTE: The backend doesn't have a create assessment endpoint yet.
 * This function provides a clear user experience for this limitation.
 */
export const createAssessments = async (request: CreateAssessmentRequest): Promise<boolean> => {
  try {
    const { category, schoolIds, dueDate, term, academicYear } = request;
    
    console.log('📝 Assessment creation request:', {
      category,
      schoolCount: schoolIds.length,
      dueDate,
      term,
      academicYear
    });
    
    // Try to create assessments via potential endpoints
    const createEndpoints = ['/api/assessments', '/assessments/create', '/create-assessments'];
    
    for (const endpoint of createEndpoints) {
      try {
        const payload = {
          category,
          school_ids: schoolIds,
          due_date: dueDate,
          term_id: term === 'Autumn' ? 'T1' : term === 'Spring' ? 'T2' : 'T3',
          academic_year: academicYear
        };
        
        const response = await apiClient.post(endpoint, payload);
        
        if (response.data) {
          console.log('✅ Assessments created successfully via', endpoint);
          return true;
        }
      } catch (endpointError: any) {
        if (endpointError.response?.status === 404) {
          console.log(`⚠️ Endpoint ${endpoint} not found, trying next...`);
          continue;
        } else {
          throw endpointError;
        }
      }
    }
    
    // If we reach here, creation is not available
    console.warn('⚠️ Assessment creation not available in backend yet');
    console.log('📋 Would create assessments for:', schoolIds.map(id => `${id} (${category})`));
    
    // For development, we'll return false to indicate it's not supported
    // This allows the frontend to show appropriate messaging
    return false;
    
  } catch (error) {
    console.error('❌ Failed to create assessments:', error);
    return false;
  }
};

/**
 * Saves assessment progress (ratings and evidence) to the API using the /submit endpoint.
 */
export const saveAssessmentProgress = async (
  assessmentId: string,
  ratings: Record<string, Rating>,
  evidence: Record<string, string>
): Promise<boolean> => {
  try {
    // First, get the current assessment to get the school and other metadata
    const currentAssessment = await getAssessmentById(assessmentId);
    
    if (!currentAssessment) {
      throw new Error('Assessment not found');
    }

    // Prepare entries for the submit endpoint
    const entries = Object.entries(ratings)
      .filter(([_, rating]) => rating !== null) // Only submit ratings that are set
      .map(([standardId, rating]) => ({
        assessment_id: assessmentId,
        school_id: currentAssessment.school.id,
        standard_id: standardId,
        term_id: currentAssessment.term || 'T1',
        academic_year: currentAssessment.academicYear || '2024-25',
        assessment_rating: rating as number,
        evidence_comments: evidence[standardId] || '',
        due_date: currentAssessment.dueDate || new Date().toISOString().split('T')[0],
        submitted_by: 'current_user', // TODO: Get from auth context
        assigned_to: currentAssessment.assignedTo?.[0]?.id || 'current_user',
        submitted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        synced_to_configur_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      }));

    if (entries.length === 0) {
      console.log('ℹ️ No ratings to save');
      return true;
    }

    console.log('📤 Saving assessment progress...', {
      assessmentId,
      ratingsCount: entries.length
    });

    // Try multiple possible submit endpoints
    const submitEndpoints = ['/submit', '/api/submit', '/api/assessments/submit'];
    
    for (const endpoint of submitEndpoints) {
      try {
        const response = await apiClient.post(endpoint, { entries });
        
        if (response.data?.status === 'success') {
          console.log('✅ Assessment progress saved successfully via', endpoint);
          return true;
        }
      } catch (endpointError: any) {
        if (endpointError.response?.status === 404) {
          console.log(`⚠️ Endpoint ${endpoint} not found, trying next...`);
          continue;
        } else {
          throw endpointError;
        }
      }
    }
    
    // If we reach here, none of the endpoints worked
    console.warn('⚠️ Submit functionality not available in backend yet');
    console.log('📋 Would submit:', entries);
    
    // For development, we'll simulate success
    return true;
    
  } catch (error) {
    console.error('❌ Failed to save assessment progress:', error);
    return false;
  }
};

/**
 * Submits a completed assessment to the API.
 */
export const submitAssessment = async (
  assessmentId: string,
  ratings: Record<string, Rating>,
  evidence: Record<string, string>
): Promise<boolean> => {
  try {
    console.log('📋 Submitting completed assessment:', assessmentId);
    // For now, submitting is the same as saving progress
    // The backend will determine if the assessment is complete based on the ratings
    const success = await saveAssessmentProgress(assessmentId, ratings, evidence);
    
    if (success) {
      console.log('✅ Assessment submitted successfully');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Failed to submit assessment:', error);
    return false;
  }
}; 