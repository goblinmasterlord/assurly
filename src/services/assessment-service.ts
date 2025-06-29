import apiClient from '@/lib/api-client';
import { transformAssessment } from '@/lib/data-transformers';
import type { Assessment, ApiAssessment, Rating, AssessmentCategory, AcademicTerm, AcademicYear } from '@/types/assessment';

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
    const response = await apiClient.get<ApiAssessment[]>('/assessments');
    if (response.data) {
      return response.data.map(transformAssessment);
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch assessments:', error);
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
    const response = await apiClient.get<ApiAssessment>(`/assessments/${id}`);
    if (response.data) {
      return transformAssessment(response.data);
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch assessment with id ${id}:`, error);
    return null;
  }
};

/**
 * Fetches all schools from the API.
 */
export const getSchools = async (): Promise<{ id: string; name: string; code: string; }[]> => {
  try {
    const response = await apiClient.get<ApiSchoolResponse[]>('/schools');
    if (response.data) {
      return response.data.map(school => ({
        id: school.school_id,
        name: school.school_name,
        // Generate a simple code from the name
        code: school.school_name
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    return [];
  }
};

/**
 * Fetches standards for a specific category/area from the API.
 */
export const getStandardsByCategory = async (category: string): Promise<{ id: string; name: string; description: string; }[]> => {
  try {
    const response = await apiClient.get<ApiStandardResponse[]>('/standards');
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
    console.error(`Failed to fetch standards for category ${category}:`, error);
    return [];
  }
};

/**
 * Creates new assessments for the specified schools and category.
 */
export const createAssessments = async (request: CreateAssessmentRequest): Promise<boolean> => {
  try {
    // Get the standards for this category
    const standards = await getStandardsByCategory(request.category);
    
    if (standards.length === 0) {
      throw new Error(`No standards found for category: ${request.category}`);
    }

    // Get schools data to build complete assessment objects
    const allSchools = await getSchools();
    
    // Create an assessment for each selected school
    const createdAssessments = await Promise.all(
      request.schoolIds.map(async (schoolId) => {
        const school = allSchools.find(s => s.id === schoolId);
        if (!school) {
          throw new Error(`School not found: ${schoolId}`);
        }

        // Generate a unique ID for the new assessment
        const newId = `${Date.now()}-${schoolId}`;

        // Create the assessment object with all standards (initially unrated)
        const newAssessment: ApiAssessment = {
          id: newId,
          name: `${request.category} Assessment`,
          category: request.category,
          school: {
            school_id: schoolId,
            school_name: school.name
          },
          status: 'Not Started',
          completed_standards: 0,
          total_standards: standards.length,
          last_updated: new Date().toISOString(),
          due_date: request.dueDate || undefined,
          assigned_to: [], // Would be populated based on school's department heads
          standards: standards.map(standard => ({
            standard_id: standard.id,
            code: standard.id, // Use standard_id as code for now
            title: standard.name,
            description: standard.description,
            rating: null,
            evidence_comments: '',
            submitted_at: undefined
          })),
          term: request.term,
          academic_year: request.academicYear
        };

        // Post the new assessment to the API
        const response = await apiClient.post('/assessments', newAssessment);
        return response.data;
      })
    );

    console.log(`Successfully created ${createdAssessments.length} assessments`);
    return true;
  } catch (error) {
    console.error('Failed to create assessments:', error);
    return false;
  }
};

/**
 * Saves assessment progress (ratings and evidence) to the API.
 */
export const saveAssessmentProgress = async (
  assessmentId: string,
  ratings: Record<string, Rating>,
  evidence: Record<string, string>
): Promise<boolean> => {
  try {
    // First, get the current assessment to preserve other data
    const currentAssessment = await apiClient.get<ApiAssessment>(`/assessments/${assessmentId}`);
    
    if (!currentAssessment.data) {
      throw new Error('Assessment not found');
    }

    // Update the standards with new ratings and evidence
    const updatedStandards = currentAssessment.data.standards?.map(standard => ({
      ...standard,
      rating: ratings[standard.standard_id] || standard.rating,
      evidence_comments: evidence[standard.standard_id] || standard.evidence_comments || '',
      submitted_at: ratings[standard.standard_id] ? new Date().toISOString() : standard.submitted_at
    }));

    // Calculate completed standards count
    const completed_standards = updatedStandards?.filter(s => s.rating !== null).length || 0;

    // Create updated assessment object
    const updatedAssessment = {
      ...currentAssessment.data,
      standards: updatedStandards,
      completed_standards,
      last_updated: new Date().toISOString(),
      status: completed_standards === currentAssessment.data.total_standards ? 'Completed' : 'In Progress'
    };

    // Save to API
    await apiClient.put(`/assessments/${assessmentId}`, updatedAssessment);
    return true;
  } catch (error) {
    console.error('Failed to save assessment progress:', error);
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
    // Save the progress first
    const saveSuccess = await saveAssessmentProgress(assessmentId, ratings, evidence);
    
    if (!saveSuccess) {
      return false;
    }

    // Then mark as completed and submitted
    const currentAssessment = await apiClient.get<ApiAssessment>(`/assessments/${assessmentId}`);
    
    if (!currentAssessment.data) {
      throw new Error('Assessment not found');
    }

    const submittedAssessment = {
      ...currentAssessment.data,
      status: 'Completed',
      last_updated: new Date().toISOString()
    };

    await apiClient.put(`/assessments/${assessmentId}`, submittedAssessment);
    return true;
  } catch (error) {
    console.error('Failed to submit assessment:', error);
    return false;
  }
}; 