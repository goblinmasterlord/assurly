// ============================================================================
// v4.0 Assessment Service
// ============================================================================

import apiClient from '@/lib/api-client';
import { 
  transformAssessmentGroup,
  transformAssessment,
  transformSchool,
  transformStandard,
  transformAspect
} from '@/lib/data-transformers';
import type { 
  Assessment,
  AssessmentGroup,
  AssessmentByAspect,
  Standard,
  Aspect,
  School,
  Term,
  AssessmentUpdate,
  AssessmentCreate,
  BulkUpdate,
  StandardUpdate
} from '@/types/assessment';

// ============================================================================
// Assessment Endpoints
// ============================================================================

/**
 * GET /api/assessments
 * List assessments grouped by school, aspect, and term
 */
export const getAssessments = async (filters?: {
  school_id?: string;
  aspect_code?: string;
  term_id?: string;
  academic_year?: string;
  status?: string;
}): Promise<Assessment[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.school_id) params.append('school_id', filters.school_id);
    if (filters?.aspect_code) params.append('aspect_code', filters.aspect_code);
    if (filters?.term_id) params.append('term_id', filters.term_id);
    if (filters?.academic_year) params.append('academic_year', filters.academic_year);
    if (filters?.status) params.append('status', filters.status);

    const url = `/api/assessments${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<AssessmentGroup[]>(url);
    
    return response.data.map(transformAssessmentGroup);
  } catch (error) {
    console.error('Failed to fetch assessments:', error);
    throw new Error('Failed to load assessments. Please try again.');
  }
};

/**
 * GET /api/assessments/{assessment_id}
 * Get a single assessment detail
 */
export const getAssessmentById = async (assessmentId: string): Promise<Assessment> => {
  try {
    const response = await apiClient.get<Assessment>(`/api/assessments/${assessmentId}`);
    return transformAssessment(response.data);
  } catch (error) {
    console.error(`Failed to fetch assessment ${assessmentId}:`, error);
    throw new Error('Failed to load assessment details. Please try again.');
  }
};

/**
 * GET /api/assessments/by-aspect/{aspect_code}
 * Get all assessments for an aspect (all standards) for a school and term
 */
export const getAssessmentsByAspect = async (
  aspectCode: string,
  schoolId: string,
  termId: string
): Promise<AssessmentByAspect> => {
  try {
    const params = new URLSearchParams();
    params.append('school_id', schoolId);
    params.append('term_id', termId);

    const url = `/api/assessments/by-aspect/${aspectCode}?${params}`;
    const response = await apiClient.get<AssessmentByAspect>(url);
    
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch assessments for aspect ${aspectCode}:`, error);
    throw new Error('Failed to load assessment form. Please try again.');
  }
};

/**
 * PUT /api/assessments/{assessment_id}
 * Update an assessment's rating and evidence
 */
export const updateAssessment = async (
  assessmentId: string,
  update: AssessmentUpdate
): Promise<void> => {
  try {
    await apiClient.put(`/api/assessments/${assessmentId}`, {
      rating: update.rating,
      evidence_comments: update.evidence_comments
    });
  } catch (error) {
    console.error(`Failed to update assessment ${assessmentId}:`, error);
    throw new Error('Failed to save assessment. Please try again.');
  }
};

/**
 * POST /api/assessments
 * Create assessments for schools/aspect/term combination
 */
export const createAssessments = async (request: AssessmentCreate): Promise<void> => {
  try {
    await apiClient.post('/api/assessments', {
      school_ids: request.school_ids,
      aspect_code: request.aspect_code,
      term_id: request.term_id,
      due_date: request.due_date,
      assigned_to: request.assigned_to
    });
  } catch (error) {
    console.error('Failed to create assessments:', error);
    throw new Error('Failed to create assessments. Please try again.');
  }
};

/**
 * POST /api/assessments/bulk-update
 * Update multiple assessments in a single request
 */
export const bulkUpdateAssessments = async (updates: BulkUpdate[]): Promise<void> => {
  try {
    await apiClient.post('/api/assessments/bulk-update', {
      updates: updates.map(u => ({
        assessment_id: u.assessment_id,
        rating: u.rating,
        evidence_comments: u.evidence_comments
      }))
    });
  } catch (error) {
    console.error('Failed to bulk update assessments:', error);
    throw new Error('Failed to save assessments. Please try again.');
  }
};

// ============================================================================
// Standards Endpoints
// ============================================================================

/**
 * GET /api/standards
 * List all standards for the MAT
 */
export const getStandards = async (filters?: {
  aspect_code?: string;
  standard_type?: 'assurance' | 'risk';
}): Promise<Standard[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.aspect_code) params.append('aspect_code', filters.aspect_code);
    if (filters?.standard_type) params.append('standard_type', filters.standard_type);

    const url = `/api/standards${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<Standard[]>(url);
    
    return response.data.map(transformStandard);
  } catch (error) {
    console.error('Failed to fetch standards:', error);
    throw new Error('Failed to load standards. Please try again.');
  }
};

/**
 * GET /api/standards/{mat_standard_id}
 * Get a single standard with version history
 */
export const getStandardById = async (matStandardId: string): Promise<Standard> => {
  try {
    const response = await apiClient.get<Standard>(`/api/standards/${matStandardId}`);
    return transformStandard(response.data);
  } catch (error) {
    console.error(`Failed to fetch standard ${matStandardId}:`, error);
    throw new Error('Failed to load standard details. Please try again.');
  }
};

/**
 * PUT /api/standards/{mat_standard_id}
 * Update a standard (creates a new version)
 */
export const updateStandard = async (
  matStandardId: string,
  update: StandardUpdate
): Promise<void> => {
  try {
    await apiClient.put(`/api/standards/${matStandardId}`, {
      standard_name: update.standard_name,
      standard_description: update.standard_description,
      standard_type: update.standard_type,
      change_reason: update.change_reason
    });
  } catch (error) {
    console.error(`Failed to update standard ${matStandardId}:`, error);
    throw new Error('Failed to update standard. Please try again.');
  }
};

/**
 * POST /api/standards
 * Create a new custom standard
 */
export const createStandard = async (data: {
  mat_aspect_id: string;
  standard_code: string;
  standard_name: string;
  standard_description: string;
  standard_type?: 'assurance' | 'risk';
  sort_order: number;
}): Promise<Standard> => {
  try {
    const response = await apiClient.post<Standard>('/api/standards', {
      ...data,
      standard_type: data.standard_type || 'assurance'
    });
    return transformStandard(response.data);
  } catch (error) {
    console.error('Failed to create standard:', error);
    throw new Error('Failed to create standard. Please try again.');
  }
};

/**
 * DELETE /api/standards/{mat_standard_id}
 * Delete a standard (soft delete)
 */
export const deleteStandard = async (matStandardId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/standards/${matStandardId}`);
  } catch (error) {
    console.error(`Failed to delete standard ${matStandardId}:`, error);
    throw new Error('Failed to delete standard. Please try again.');
  }
};

/**
 * POST /api/standards/reorder
 * Reorder standards within an aspect
 */
export const reorderStandards = async (updates: Array<{
  mat_standard_id: string;
  sort_order: number;
}>): Promise<void> => {
  try {
    await apiClient.post('/api/standards/reorder', { standards: updates });
  } catch (error) {
    console.error('Failed to reorder standards:', error);
    throw new Error('Failed to reorder standards. Please try again.');
  }
};

// ============================================================================
// Aspects Endpoints
// ============================================================================

/**
 * GET /api/aspects
 * List all aspects for the MAT
 */
export const getAspects = async (filters?: {
  aspect_category?: 'ofsted' | 'operational';
}): Promise<Aspect[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.aspect_category) params.append('aspect_category', filters.aspect_category);

    const url = `/api/aspects${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<Aspect[]>(url);
    return response.data.map(transformAspect);
  } catch (error) {
    console.error('Failed to fetch aspects:', error);
    throw new Error('Failed to load aspects. Please try again.');
  }
};

/**
 * GET /api/aspects/{mat_aspect_id}
 * Get a single aspect
 */
export const getAspectById = async (matAspectId: string): Promise<Aspect> => {
  try {
    const response = await apiClient.get<Aspect>(`/api/aspects/${matAspectId}`);
    return transformAspect(response.data);
  } catch (error) {
    console.error(`Failed to fetch aspect ${matAspectId}:`, error);
    throw new Error('Failed to load aspect details. Please try again.');
  }
};

/**
 * POST /api/aspects
 * Create a new custom aspect
 */
export const createAspect = async (data: {
  aspect_code: string;
  aspect_name: string;
  aspect_description: string;
  aspect_category?: 'ofsted' | 'operational';
  sort_order: number;
}): Promise<Aspect> => {
  try {
    const response = await apiClient.post<Aspect>('/api/aspects', {
      ...data,
      aspect_category: data.aspect_category || 'operational'
    });
    return transformAspect(response.data);
  } catch (error) {
    console.error('Failed to create aspect:', error);
    throw new Error('Failed to create aspect. Please try again.');
  }
};

/**
 * PUT /api/aspects/{mat_aspect_id}
 * Update an aspect
 */
export const updateAspect = async (
  matAspectId: string,
  data: {
    aspect_name: string;
    aspect_description: string;
    sort_order: number;
  }
): Promise<void> => {
  try {
    await apiClient.put(`/api/aspects/${matAspectId}`, data);
  } catch (error) {
    console.error(`Failed to update aspect ${matAspectId}:`, error);
    throw new Error('Failed to update aspect. Please try again.');
  }
};

/**
 * DELETE /api/aspects/{mat_aspect_id}
 * Delete an aspect (soft delete)
 */
export const deleteAspect = async (matAspectId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/aspects/${matAspectId}`);
  } catch (error) {
    console.error(`Failed to delete aspect ${matAspectId}:`, error);
    throw new Error('Failed to delete aspect. Please try again.');
  }
};

// ============================================================================
// Schools Endpoints
// ============================================================================

/**
 * GET /api/schools
 * List all schools in the MAT
 */
export const getSchools = async (includeCentral: boolean = false): Promise<School[]> => {
  try {
    const params = new URLSearchParams();
    if (includeCentral) params.append('include_central', 'true');

    const url = `/api/schools${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<School[]>(url);
    
    return response.data.map(transformSchool);
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    throw new Error('Failed to load schools. Please try again.');
  }
};

// ============================================================================
// Terms Endpoints
// ============================================================================

/**
 * GET /api/terms
 * List available academic terms
 */
export const getTerms = async (academicYear?: string): Promise<Term[]> => {
  try {
    const params = new URLSearchParams();
    if (academicYear) params.append('academic_year', academicYear);

    const url = `/api/terms${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<Term[]>(url);
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch terms:', error);
    throw new Error('Failed to load terms. Please try again.');
  }
};

// ============================================================================
// Analytics Endpoints
// ============================================================================

/**
 * GET /api/analytics/trends
 * Get rating trends over time
 */
export const getAnalyticsTrends = async (filters?: {
  school_id?: string;
  aspect_code?: string;
  aspect_category?: 'ofsted' | 'operational';
  standard_type?: 'assurance' | 'risk';
  from_term?: string;
  to_term?: string;
}): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (filters?.school_id) params.append('school_id', filters.school_id);
    if (filters?.aspect_code) params.append('aspect_code', filters.aspect_code);
    if (filters?.aspect_category) params.append('aspect_category', filters.aspect_category);
    if (filters?.standard_type) params.append('standard_type', filters.standard_type);
    if (filters?.from_term) params.append('from_term', filters.from_term);
    if (filters?.to_term) params.append('to_term', filters.to_term);

    const url = `/api/analytics/trends${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get(url);
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch analytics trends:', error);
    throw new Error('Failed to load analytics. Please try again.');
  }
};

// ============================================================================
// Backward Compatibility Aliases
// ============================================================================

// Keep legacy function names for backward compatibility
export const submitAssessment = bulkUpdateAssessments;
export const updateStandardDefinition = updateStandard;
export const getStandardVersions = getStandardById;

// Export all
export default {
  // Assessments
  getAssessments,
  getAssessmentById,
  getAssessmentsByAspect,
  updateAssessment,
  createAssessments,
  bulkUpdateAssessments,
  submitAssessment,
  
  // Standards
  getStandards,
  getStandardById,
  updateStandard,
  createStandard,
  deleteStandard,
  reorderStandards,
  
  // Aspects
  getAspects,
  getAspectById,
  createAspect,
  updateAspect,
  deleteAspect,
  
  // Schools
  getSchools,
  
  // Terms
  getTerms,
  
  // Analytics
  getAnalyticsTrends,
};
