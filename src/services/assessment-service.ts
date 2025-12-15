import apiClient from '@/lib/api-client';
import { transformAssessmentSummary, transformAssessmentDetail, transformSchoolResponse, transformStandardResponse } from '@/lib/data-transformers';
import type { Assessment, Rating, AssessmentCategory, AcademicTerm, AcademicYear, School, Standard, Aspect } from '@/types/assessment';

// Add new types for the API responses
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
  assignedTo?: string; // User ID to assign the assessment to
}

interface SubmitStandardRequest {
  standard_id: string;
  rating: number | null;
  evidence_comments: string;
  submitted_by: string;
}

interface SubmitAssessmentRequest {
  assessment_id: string;
  standards: SubmitStandardRequest[];
}

/**
 * Fetches all assessments from the API and transforms them into the frontend format.
 */
export const getAssessments = async (): Promise<Assessment[]> => {
  try {
    const response = await apiClient.get('/api/assessments');
    return response.data.map(transformAssessmentSummary);
  } catch (error) {
    console.error('Failed to fetch assessments:', error);
    throw new Error('Failed to load assessments. Please try again.');
  }
};

/**
 * Fetches a single assessment by ID with full details including standards.
 */
export const getAssessmentById = async (assessmentId: string): Promise<Assessment> => {
  try {
    const response = await apiClient.get(`/api/assessments/${assessmentId}`);
    return transformAssessmentDetail(response.data);
  } catch (error) {
    console.error(`Failed to fetch assessment ${assessmentId}:`, error);
    throw new Error('Failed to load assessment details. Please try again.');
  }
};

/**
 * Fetches all schools from the real API endpoint.
 */
export const getSchools = async (): Promise<School[]> => {
  try {
    const response = await apiClient.get('/api/schools');
    return response.data.map(transformSchoolResponse);
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    throw new Error('Failed to load schools. Please try again.');
  }
};

/**
 * Fetches all standards from the real API endpoint.
 */
export const getStandards = async (aspectId?: string): Promise<Standard[]> => {
  try {
    let url = '/api/standards';
    if (aspectId) {
      url += `?aspect_id=${aspectId}`;
    }
    const response = await apiClient.get(url);

    return response.data.map(transformStandardResponse);
  } catch (error) {
    console.error('Failed to fetch standards:', error);
    throw new Error('Failed to load standards. Please try again.');
  }
};

/**
 * Submits assessment standards data to the real backend API.
 */
export const submitAssessment = async (assessmentId: string, standards: { standardId: string; rating: Rating; evidence: string }[], submittedBy: string = 'user1'): Promise<void> => {
  try {
    const payload: SubmitAssessmentRequest = {
      assessment_id: assessmentId,
      standards: standards.map(s => ({
        standard_id: s.standardId,
        rating: s.rating,
        evidence_comments: s.evidence,
        submitted_by: submittedBy,
      })),
    };

    const response = await apiClient.post(`/api/assessments/${assessmentId}/submit`, payload);

    if (response.data.status !== 'success') {
      throw new Error('Submission failed');
    }

    console.log('Assessment submitted successfully:', response.data.message);
  } catch (error) {
    console.error('Failed to submit assessment:', error);
    throw new Error('Failed to submit assessment. Please try again.');
  }
};

/**
 * Creates new assessments for the specified schools and category.
 * This endpoint is not yet implemented in the backend.
 */
export const createAssessments = async (request: CreateAssessmentRequest): Promise<string[]> => {
  try {
    // Map frontend categories to backend categories
    const categoryMap: Record<string, string> = {
      'Education': 'education',
      'Finance & Procurement': 'finance',
      'Human Resources': 'hr',
      'Estates': 'estates',
      'Governance': 'governance',
      'IT & Information Services': 'it',
      'IT (Digital Aspects)': 'it', // Maps to same backend category as IT & Information Services
      // Note: Backend only has 6 categories (education, finance, hr, estates, governance, it, is)
      // 'is' appears to be an alias for information services
    };

    const backendCategory = categoryMap[request.category] || request.category.toLowerCase();

    const payload = {
      category: backendCategory,
      school_ids: request.schoolIds,
      due_date: request.dueDate,
      term_id: request.term === 'Autumn' ? 'T1' : request.term === 'Spring' ? 'T2' : 'T3',
      academic_year: request.academicYear.replace(/^(\d{4})-(\d{4})$/, '$1-$2').replace(/^(\d{4})-(\d{2})$/, '$1-$2'), // Keep backend format: 2024-25
      assigned_to: request.assignedTo ? [request.assignedTo] : []
    };

    const response = await apiClient.post('/api/assessments', payload);

    // The backend returns assessment_ids array (filtering out null values)
    const assessmentIds = response.data?.assessment_ids?.filter(Boolean) || [];

    return assessmentIds;
  } catch (error: any) {
    console.error('Failed to create assessments:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to create assessments. Please try again.');
  }
};

/**
 * Updates a single assessment standard with new rating and evidence.
 * This is useful for auto-save functionality.
 */
export const updateStandard = async (
  assessmentId: string,
  standardId: string,
  rating: Rating,
  evidence: string,
  submittedBy: string = 'user1'
): Promise<void> => {
  try {
    await submitAssessment(assessmentId, [{ standardId, rating, evidence }], submittedBy);
  } catch (error) {
    console.error('Failed to update standard:', error);
    throw new Error('Failed to save changes. Please try again.');
  }
};

// Legacy functions for backward compatibility and future use
export const getUsers = async () => {
  // TODO: Implement when backend provides /api/users endpoint
  return [];
};

export const getTerms = async () => {
  // TODO: Implement when backend provides /api/terms endpoint
  return [];
};




// --- Aspects CRUD ---

export const getAspects = async (): Promise<Aspect[]> => {
  try {
    const response = await apiClient.get('/api/aspects');
    return response.data.map((a: any) => ({
      id: a.aspect_id,
      code: a.aspect_id,
      name: a.aspect_name,
      description: a.description,
      isCustom: a.is_custom !== false, // Assume custom unless explicitly marked otherwise
      standardCount: a.standards_count || 0
    }));
  } catch (error) {
    console.error('Failed to fetch aspects:', error);
    throw new Error('Failed to load aspects.');
  }
};

export const createAspect = async (aspect: Omit<Aspect, 'id' | 'standardCount'>): Promise<Aspect> => {
  try {
    const payload = {
      aspect_id: aspect.code,
      aspect_name: aspect.name
    };
    const response = await apiClient.post('/api/aspects', payload);
    return {
      id: response.data.aspect_id,
      code: response.data.aspect_id,
      name: response.data.aspect_name,
      description: response.data.description,
      isCustom: true, // Custom aspects created by users
      standardCount: response.data.standards_count || 0
    };
  } catch (error: any) {
    console.error('Failed to create aspect:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to create aspect.';
    throw new Error(errorMsg);
  }
};

export const updateAspect = async (aspect: Aspect): Promise<Aspect> => {
  try {
    const payload = {
      aspect_name: aspect.name
    };
    const response = await apiClient.put(`/api/aspects/${aspect.id}`, payload);
    return {
      ...aspect,
      name: response.data.aspect_name,
      description: response.data.description,
      standardCount: response.data.standards_count || aspect.standardCount
    };
  } catch (error: any) {
    console.error('Failed to update aspect:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to update aspect.';
    throw new Error(errorMsg);
  }
};

export const deleteAspect = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/aspects/${id}`);
  } catch (error) {
    console.error('Failed to delete aspect:', error);
    throw new Error('Failed to delete aspect.');
  }
};

// --- Standards CRUD ---

export const createStandard = async (standard: Omit<Standard, 'id' | 'lastUpdated' | 'versions'> & { aspectId: string, orderIndex: number }): Promise<Standard> => {
  try {
    const payload = {
      standard_id: standard.code,
      standard_name: standard.title,
      aspect_id: standard.aspectId,
      description: standard.description || ''
    };
    const response = await apiClient.post('/api/standards', payload);
    return transformStandardResponse(response.data);
  } catch (error: any) {
    console.error('Failed to create standard:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to create standard.';
    throw new Error(errorMsg);
  }
};

export const updateStandardDefinition = async (standard: Standard): Promise<Standard> => {
  try {
    const payload: any = {};
    
    // Only include fields that are being updated
    if (standard.title) payload.standard_name = standard.title;
    if (standard.description !== undefined) payload.description = standard.description;
    if (standard.aspectId) payload.aspect_id = standard.aspectId;
    
    const response = await apiClient.put(`/api/standards/${standard.id}`, payload);
    return transformStandardResponse(response.data);
  } catch (error: any) {
    console.error('Failed to update standard:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to update standard.';
    throw new Error(errorMsg);
  }
};

export const deleteStandard = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/standards/${id}`);
  } catch (error) {
    console.error('Failed to delete standard:', error);
    throw new Error('Failed to delete standard.');
  }
};

export const reorderStandards = async (standards: { id: string; orderIndex: number }[]): Promise<void> => {
  try {
    const payload = {
      updates: standards.map(s => ({
        standard_id: s.id,
        new_order_index: s.orderIndex
      }))
    };
    await apiClient.put('/api/standards/reorder', payload);
  } catch (error) {
    console.error('Failed to reorder standards:', error);
    throw new Error('Failed to reorder standards.');
  }
}; 