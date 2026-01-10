// ============================================================================
// v4.0 Enhanced Assessment Service
// ============================================================================
// Adds caching, optimistic updates, and subscription management on top of base API

import { requestCache } from '@/lib/request-cache';
import {
  getAssessments as apiGetAssessments,
  getAssessmentById as apiGetAssessmentById,
  getAssessmentsByAspect as apiGetAssessmentsByAspect,
  updateAssessment as apiUpdateAssessment,
  bulkUpdateAssessments as apiBulkUpdateAssessments,
  createAssessments as apiCreateAssessments,
  getSchools as apiGetSchools,
  getStandards as apiGetStandards,
  getStandardById as apiGetStandardById,
  createStandard as apiCreateStandard,
  updateStandard as apiUpdateStandard,
  deleteStandard as apiDeleteStandard,
  reorderStandards as apiReorderStandards,
  getAspects as apiGetAspects,
  getAspectById as apiGetAspectById,
  createAspect as apiCreateAspect,
  updateAspect as apiUpdateAspect,
  deleteAspect as apiDeleteAspect,
  getTerms as apiGetTerms,
} from '@/services/assessment-service';
import type { 
  Assessment,
  AssessmentByAspect,
  Standard,
  Aspect,
  School,
  Term,
  Rating
} from '@/types/assessment';

// Enhanced service with caching, optimistic updates, and intelligent data management
export class EnhancedAssessmentService {

  // ===== ASSESSMENT OPERATIONS =====

  /**
   * Get all assessments with intelligent caching
   */
  async getAssessments(filters?: {
    school_id?: string;
    aspect_code?: string;
    term_id?: string;
    academic_year?: string;
    status?: string;
  }): Promise<Assessment[]> {
    const cacheKey = filters 
      ? `assessments_${JSON.stringify(filters)}`
      : 'assessments';
    
    return requestCache.get(
      cacheKey as any,
      () => apiGetAssessments(filters)
    );
  }

  /**
   * Get assessment by ID with caching
   */
  async getAssessmentById(assessmentId: string): Promise<Assessment> {
    return requestCache.get(
      'assessment_detail',
      () => apiGetAssessmentById(assessmentId),
      { id: assessmentId }
    );
  }

  /**
   * Get assessments by aspect (for assessment form view)
   */
  async getAssessmentsByAspect(
    aspectCode: string,
    schoolId: string,
    termId: string
  ): Promise<AssessmentByAspect> {
    const cacheKey = `aspect_${aspectCode}_${schoolId}_${termId}`;
    return requestCache.get(
      cacheKey as any,
      () => apiGetAssessmentsByAspect(aspectCode, schoolId, termId)
    );
  }

  /**
   * Update single assessment with optimistic updates
   */
  async updateAssessment(
    assessmentId: string,
    rating: Rating,
    evidenceComments: string
  ): Promise<void> {
    // Optimistic update - immediately update the cached assessment
    requestCache.updateOptimistically<Assessment>(
      'assessment_detail',
      (current) => ({
        ...current,
        rating,
        evidence_comments: evidenceComments,
        status: rating ? 'completed' : 'in_progress',
        last_updated: new Date().toISOString(),
      }),
      { id: assessmentId }
    );

    try {
      await apiUpdateAssessment(assessmentId, { rating, evidence_comments: evidenceComments });
      
      // Invalidate cache to ensure fresh data
      requestCache.invalidate('assessment_detail', { id: assessmentId });
      requestCache.invalidate('assessments');
      
      console.log('✅ Assessment updated successfully');
    } catch (error) {
      // Revert optimistic updates on failure
      requestCache.invalidate('assessment_detail', { id: assessmentId });
      console.error('❌ Assessment update failed, reverted optimistic updates');
      throw error;
    }
  }

  /**
   * Bulk update multiple assessments
   */
  async bulkUpdateAssessments(updates: Array<{
    assessment_id: string;
    rating: Rating;
    evidence_comments: string;
  }>): Promise<void> {
    try {
      await apiBulkUpdateAssessments(updates);
      
      // Invalidate all affected caches
      updates.forEach(u => {
        requestCache.invalidate('assessment_detail', { id: u.assessment_id });
      });
      requestCache.invalidate('assessments');
      
      console.log(`✅ ${updates.length} assessments updated successfully`);
    } catch (error) {
      console.error('❌ Bulk update failed');
      throw error;
    }
  }

  /**
   * Create new assessments with cache invalidation
   */
  async createAssessments(request: {
    school_ids: string[];
    aspect_code: string;
    term_id: string;
    due_date?: string;
    assigned_to?: string;
  }): Promise<void> {
    try {
      await apiCreateAssessments(request);
      
      // Invalidate assessments cache to refresh the list
      requestCache.invalidate('assessments');
      
      console.log('✅ Assessments created successfully');
    } catch (error) {
      console.error('❌ Failed to create assessments');
      throw error;
    }
  }

  /**
   * Subscribe to assessment updates
   */
  subscribeToAssessments(callback: (assessments: Assessment[]) => void): () => void {
    return requestCache.subscribe('assessments', callback);
  }

  /**
   * Subscribe to specific assessment updates
   */
  subscribeToAssessment(assessmentId: string, callback: (assessment: Assessment) => void): () => void {
    return requestCache.subscribe('assessment_detail', callback, { id: assessmentId });
  }

  // ===== STANDARDS OPERATIONS =====

  /**
   * Get standards with caching
   */
  async getStandards(aspectCode?: string): Promise<Standard[]> {
    const cacheKey = aspectCode ? `standards_${aspectCode}` : 'standards';
    
    console.log(`[EnhancedService] Fetching standards${aspectCode ? ` for ${aspectCode}` : ''}...`);
    const standards = await requestCache.get(
      cacheKey as any,
      () => apiGetStandards(aspectCode ? { aspect_code: aspectCode } : undefined)
    );
    console.log(`[EnhancedService] Fetched ${standards.length} standards`);
    return standards;
  }

  /**
   * Get standard by ID with version history
   */
  async getStandardById(matStandardId: string): Promise<Standard> {
    return requestCache.get(
      'standard_detail',
      () => apiGetStandardById(matStandardId),
      { id: matStandardId }
    );
  }

  /**
   * Create new custom standard
   */
  async createStandard(data: {
    mat_aspect_id: string;
    standard_code: string;
    standard_name: string;
    standard_description: string;
    sort_order: number;
  }): Promise<Standard> {
    const newStandard = await apiCreateStandard(data);
    
    // Invalidate relevant caches
    requestCache.invalidate('standards');
    requestCache.invalidate('aspects'); // Count might change
    
    return newStandard;
  }

  /**
   * Update standard (creates new version)
   */
  async updateStandard(
    matStandardId: string,
    data: {
      standard_name: string;
      standard_description: string;
      change_reason?: string;
    }
  ): Promise<void> {
    await apiUpdateStandard(matStandardId, data);
    
    // Invalidate caches
    requestCache.invalidate('standards');
    requestCache.invalidate('standard_detail', { id: matStandardId });
  }

  /**
   * Delete standard
   */
  async deleteStandard(matStandardId: string): Promise<void> {
    await apiDeleteStandard(matStandardId);
    
    // Invalidate caches
    requestCache.invalidate('standards');
    requestCache.invalidate('aspects'); // Count might change
  }

  /**
   * Reorder standards
   */
  async reorderStandards(updates: Array<{
    mat_standard_id: string;
    sort_order: number;
  }>): Promise<void> {
    await apiReorderStandards(updates);
    
    // Invalidate standards cache
    requestCache.invalidate('standards');
  }

  /**
   * Subscribe to standards updates
   */
  subscribeToStandards(callback: (standards: Standard[]) => void, aspectCode?: string): () => void {
    const cacheKey = aspectCode ? `standards_${aspectCode}` : 'standards';
    return requestCache.subscribe(cacheKey as any, callback);
  }

  // ===== ASPECTS OPERATIONS =====

  /**
   * Get aspects with caching
   */
  async getAspects(): Promise<Aspect[]> {
    console.log('[EnhancedService] Fetching aspects...');
    const aspects = await requestCache.get(
      'aspects',
      () => apiGetAspects()
    );
    console.log(`[EnhancedService] Fetched ${aspects.length} aspects`);
    return aspects;
  }

  /**
   * Get aspect by ID
   */
  async getAspectById(matAspectId: string): Promise<Aspect> {
    return requestCache.get(
      'aspect_detail',
      () => apiGetAspectById(matAspectId),
      { id: matAspectId }
    );
  }

  /**
   * Create new custom aspect
   */
  async createAspect(data: {
    aspect_code: string;
    aspect_name: string;
    aspect_description: string;
    sort_order: number;
  }): Promise<Aspect> {
    const newAspect = await apiCreateAspect(data);
    
    // Invalidate aspects cache
    requestCache.invalidate('aspects');
    
    return newAspect;
  }

  /**
   * Update aspect
   */
  async updateAspect(
    matAspectId: string,
    data: {
      aspect_name: string;
      aspect_description: string;
      sort_order: number;
    }
  ): Promise<void> {
    await apiUpdateAspect(matAspectId, data);
    
    // Invalidate caches
    requestCache.invalidate('aspects');
    requestCache.invalidate('aspect_detail', { id: matAspectId });
  }

  /**
   * Delete aspect
   */
  async deleteAspect(matAspectId: string): Promise<void> {
    await apiDeleteAspect(matAspectId);
    
    // Invalidate caches
    requestCache.invalidate('aspects');
    requestCache.invalidate('standards'); // Deleting aspect affects standards
  }

  /**
   * Subscribe to aspects updates
   */
  subscribeToAspects(callback: (aspects: Aspect[]) => void): () => void {
    return requestCache.subscribe('aspects', callback);
  }

  // ===== SCHOOLS OPERATIONS =====

  /**
   * Get schools with long-term caching
   */
  async getSchools(includeCentral: boolean = false): Promise<School[]> {
    const cacheKey = includeCentral ? 'schools_with_central' : 'schools';
    return requestCache.get(
      cacheKey as any,
      () => apiGetSchools(includeCentral)
    );
  }

  /**
   * Subscribe to school updates
   */
  subscribeToSchools(callback: (schools: School[]) => void): () => void {
    return requestCache.subscribe('schools', callback);
  }

  // ===== TERMS OPERATIONS =====

  /**
   * Get terms with caching
   */
  async getTerms(academicYear?: string): Promise<Term[]> {
    const cacheKey = academicYear ? `terms_${academicYear}` : 'terms';
    return requestCache.get(
      cacheKey as any,
      () => apiGetTerms(academicYear)
    );
  }

  /**
   * Subscribe to terms updates
   */
  subscribeToTerms(callback: (terms: Term[]) => void): () => void {
    return requestCache.subscribe('terms', callback);
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Preload critical data for better UX
   */
  async preloadCriticalData(): Promise<void> {
    console.log('🚀 Preloading critical data...');

    try {
      await Promise.allSettled([
        requestCache.preload('assessments', () => apiGetAssessments()),
        requestCache.preload('schools', () => apiGetSchools()),
        requestCache.preload('aspects', () => apiGetAspects()),
        requestCache.preload('terms', () => apiGetTerms()),
      ]);

      console.log('✅ Critical data preloaded successfully');
    } catch (error) {
      console.warn('⚠️  Some preloading failed:', error);
    }
  }

  /**
   * Refresh all cached data
   */
  async refreshAllData(): Promise<void> {
    console.log('🔄 Refreshing all cached data...');

    // Invalidate all caches
    requestCache.invalidate('assessments');
    requestCache.invalidate('assessment_detail');
    requestCache.invalidate('schools');
    requestCache.invalidate('standards');
    requestCache.invalidate('aspects');
    requestCache.invalidate('terms');

    // Preload fresh data
    await this.preloadCriticalData();
  }

  /**
   * Invalidate specific assessment cache
   */
  invalidateAssessment(assessmentId: string): void {
    requestCache.invalidate('assessment_detail', { id: assessmentId });
    requestCache.invalidate('assessments');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return requestCache.getStats();
  }

  /**
   * Check if we have cached data for offline use
   */
  hasOfflineData(): boolean {
    const stats = requestCache.getStats();
    return stats.size > 0;
  }
}

// Export singleton instance
export const assessmentService = new EnhancedAssessmentService();
