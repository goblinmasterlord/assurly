import apiClient from '@/lib/api-client';
import { transformAssessmentSummary, transformAssessmentDetail, transformSchoolResponse } from '@/lib/data-transformers';
import type { Assessment, Rating, AssessmentCategory, AcademicTerm, AcademicYear, School, MatStandard, MatAspect, StandardVersion } from '@/types/assessment';

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
export const getStandards = async (matAspectId?: string): Promise<MatStandard[]> => {
  try {
    let url = '/api/standards';
    if (matAspectId) {
      url += `?mat_aspect_id=${matAspectId}`;  // CHANGED: parameter name
      console.log(`[getStandards] Fetching standards for aspect: ${matAspectId}`);
    } else {
      console.log('[getStandards] Fetching all standards');
    }
    const response = await apiClient.get(url);
    console.log(`[getStandards] Received ${response.data.length} standards`);
    
    // Debug: Check first standard's structure
    if (response.data.length > 0) {
      console.log('[getStandards] First standard structure:', response.data[0]);
    }

    return response.data.map((s: any) => ({
      mat_standard_id: s.mat_standard_id,
      mat_id: s.mat_id,
      mat_aspect_id: s.mat_aspect_id,
      standard_code: s.standard_code,
      standard_name: s.standard_name,
      standard_description: s.standard_description,
      sort_order: s.sort_order ?? 0,
      source_standard_id: s.source_standard_id,
      is_custom: s.is_custom,
      is_modified: s.is_modified,
      version_number: s.version_number,
      version_id: s.version_id,
      aspect_code: s.aspect_code,
      aspect_name: s.aspect_name,
      is_active: s.is_active ?? true,
      created_at: s.created_at,
      updated_at: s.updated_at,
      // Assessment-specific fields (if present)
      rating: s.rating,
      evidence_comments: s.evidence_comments,
      submitted_at: s.submitted_at,
      submitted_by: s.submitted_by
    }));
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

export const getAspects = async (): Promise<MatAspect[]> => {
  try {
    const response = await apiClient.get('/api/aspects');
    return response.data.map((a: any) => ({
      mat_aspect_id: a.mat_aspect_id,
      mat_id: a.mat_id,
      aspect_code: a.aspect_code,
      aspect_name: a.aspect_name,
      aspect_description: a.aspect_description,
      sort_order: a.sort_order ?? 0,
      source_aspect_id: a.source_aspect_id,
      is_custom: a.is_custom,
      is_modified: a.is_modified,
      standards_count: a.standards_count || 0,
      is_active: a.is_active ?? true,
      created_at: a.created_at,
      updated_at: a.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch aspects:', error);
    throw new Error('Failed to load aspects.');
  }
};

export const createAspect = async (
  aspect: Omit<MatAspect, 'mat_aspect_id' | 'mat_id' | 'standards_count' | 'created_at' | 'updated_at'>
): Promise<MatAspect> => {
  try {
    const payload = {
      aspect_code: aspect.aspect_code,
      aspect_name: aspect.aspect_name,
      aspect_description: aspect.aspect_description,
      sort_order: aspect.sort_order,
      source_aspect_id: aspect.source_aspect_id  // For copy-on-write
    };
    const response = await apiClient.post('/api/aspects', payload);
    
    return {
      mat_aspect_id: response.data.mat_aspect_id,
      mat_id: response.data.mat_id,
      aspect_code: response.data.aspect_code,
      aspect_name: response.data.aspect_name,
      aspect_description: response.data.aspect_description,
      sort_order: response.data.sort_order,
      source_aspect_id: response.data.source_aspect_id,
      is_custom: response.data.is_custom,
      is_modified: response.data.is_modified,
      standards_count: response.data.standards_count || 0,
      is_active: response.data.is_active ?? true,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  } catch (error: any) {
    console.error('Failed to create aspect:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to create aspect.';
    throw new Error(errorMsg);
  }
};

export const updateAspect = async (aspect: MatAspect): Promise<MatAspect> => {
  try {
    const payload = {
      aspect_name: aspect.aspect_name,
      aspect_description: aspect.aspect_description,
      sort_order: aspect.sort_order
    };
    const response = await apiClient.put(`/api/aspects/${aspect.mat_aspect_id}`, payload);
    
    return {
      mat_aspect_id: response.data.mat_aspect_id,
      mat_id: response.data.mat_id,
      aspect_code: response.data.aspect_code,
      aspect_name: response.data.aspect_name,
      aspect_description: response.data.aspect_description,
      sort_order: response.data.sort_order,
      source_aspect_id: response.data.source_aspect_id,
      is_custom: response.data.is_custom,
      is_modified: response.data.is_modified,
      standards_count: response.data.standards_count || 0,
      is_active: response.data.is_active ?? true,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
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

export const createStandard = async (
  standard: Omit<MatStandard, 'mat_standard_id' | 'mat_id' | 'version_number' | 'version_id' | 'created_at' | 'updated_at'> & { 
    change_reason: string  // REQUIRED for versioning
  }
): Promise<MatStandard> => {
  try {
    const payload = {
      mat_aspect_id: standard.mat_aspect_id,
      standard_code: standard.standard_code,
      standard_name: standard.standard_name,
      standard_description: standard.standard_description,
      sort_order: standard.sort_order,
      source_standard_id: standard.source_standard_id,  // For copy-on-write
      change_reason: standard.change_reason  // REQUIRED
    };
    const response = await apiClient.post('/api/standards', payload);
    
    return {
      mat_standard_id: response.data.mat_standard_id,
      mat_id: response.data.mat_id,
      mat_aspect_id: response.data.mat_aspect_id,
      standard_code: response.data.standard_code,
      standard_name: response.data.standard_name,
      standard_description: response.data.standard_description,
      sort_order: response.data.sort_order,
      source_standard_id: response.data.source_standard_id,
      is_custom: response.data.is_custom,
      is_modified: response.data.is_modified,
      version_number: response.data.version_number,
      version_id: response.data.version_id,
      aspect_code: response.data.aspect_code,
      aspect_name: response.data.aspect_name,
      is_active: response.data.is_active ?? true,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  } catch (error: any) {
    console.error('Failed to create standard:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to create standard.';
    throw new Error(errorMsg);
  }
};

export const updateStandardDefinition = async (
  standard: MatStandard & { change_reason: string }  // REQUIRED for versioning
): Promise<MatStandard> => {
  try {
    const payload = {
      standard_name: standard.standard_name,
      standard_description: standard.standard_description,
      change_reason: standard.change_reason  // REQUIRED - creates new version
    };
    
    const response = await apiClient.put(`/api/standards/${standard.mat_standard_id}`, payload);
    
    return {
      mat_standard_id: response.data.mat_standard_id,
      mat_id: response.data.mat_id,
      mat_aspect_id: response.data.mat_aspect_id,
      standard_code: response.data.standard_code,
      standard_name: response.data.standard_name,
      standard_description: response.data.standard_description,
      sort_order: response.data.sort_order,
      source_standard_id: response.data.source_standard_id,
      is_custom: response.data.is_custom,
      is_modified: response.data.is_modified,
      version_number: response.data.version_number,  // Incremented
      version_id: response.data.version_id,          // New version ID
      aspect_code: response.data.aspect_code,
      aspect_name: response.data.aspect_name,
      is_active: response.data.is_active ?? true,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  } catch (error: any) {
    console.error('Failed to update standard:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to update standard.';
    throw new Error(errorMsg);
  }
};

export const deleteStandard = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/standards/${id}`);  // Soft delete on backend
  } catch (error) {
    console.error('Failed to delete standard:', error);
    throw new Error('Failed to delete standard.');
  }
};

// NEW FUNCTION - Get version history for a standard
export const getStandardVersions = async (matStandardId: string): Promise<StandardVersion[]> => {
  try {
    const response = await apiClient.get(`/api/standards/${matStandardId}/versions`);
    return response.data.map((v: any) => ({
      version_id: v.version_id,
      mat_standard_id: v.mat_standard_id,
      version_number: v.version_number,
      standard_code: v.standard_code,
      standard_name: v.standard_name,
      standard_description: v.standard_description,
      effective_from: v.effective_from,
      effective_to: v.effective_to,
      created_by_user_id: v.created_by_user_id,
      change_reason: v.change_reason,
      created_at: v.created_at
    }));
  } catch (error: any) {
    console.error('Failed to fetch standard versions:', error);
    throw new Error('Failed to load version history.');
  }
};

export const reorderStandards = async (standards: { id: string; orderIndex: number; title?: string; description?: string }[]): Promise<void> => {
  try {
    console.log(`Reordering ${standards.length} standards...`, standards);
    
    // The backend doesn't have a bulk reorder endpoint yet
    // So we need to update each standard individually
    // We'll do this in parallel for better performance
    const updatePromises = standards.map(async (s) => {
      try {
        // Include all required fields for update
        const payload: any = {
          sort_order: s.orderIndex
        };
        
        // If we have the standard's current data, include it to avoid validation errors
        if (s.title) {
          payload.standard_name = s.title;
        }
        if (s.description !== undefined) {
          payload.description = s.description;
        }
        
        console.log(`Updating standard ${s.id} with sort_order ${s.orderIndex}`);
        const response = await apiClient.put(`/api/standards/${s.id}`, payload);
        return response.data;
      } catch (error: any) {
        console.error(`Failed to update standard ${s.id}:`, error.response?.data || error.message);
        throw error;
      }
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Successfully reordered ${standards.length} standards`);
  } catch (error: any) {
    console.error('Failed to reorder standards:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to reorder standards.';
    throw new Error(errorMsg);
  }
}; 