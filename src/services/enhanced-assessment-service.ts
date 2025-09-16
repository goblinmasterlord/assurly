import { requestCache } from '@/lib/request-cache';
import { 
  getAssessments as apiGetAssessments,
  getAssessmentById as apiGetAssessmentById,
  getSchools as apiGetSchools,
  getStandards as apiGetStandards,
  submitAssessment as apiSubmitAssessment,
  createAssessments as apiCreateAssessments,
} from '@/services/assessment-service';
import type { Assessment, Rating, AssessmentCategory, AcademicTerm, AcademicYear, School, Standard } from '@/types/assessment';

// Enhanced service with caching, optimistic updates, and intelligent data management
export class EnhancedAssessmentService {
  
  // ===== ASSESSMENT OPERATIONS =====
  
  /**
   * Get all assessments with intelligent caching
   * Uses stale-while-revalidate for optimal UX
   */
  async getAssessments(): Promise<Assessment[]> {
    return requestCache.get(
      'assessments',
      () => apiGetAssessments(),
    );
  }

  /**
   * Get assessment by ID with caching
   * More frequent cache invalidation due to editing
   */
  async getAssessmentById(assessmentId: string): Promise<Assessment> {
    return requestCache.get(
      'assessment_detail',
      () => apiGetAssessmentById(assessmentId),
      { id: assessmentId }
    );
  }

  /**
   * Subscribe to assessment updates
   * Returns unsubscribe function
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

  /**
   * Submit assessment with optimistic updates
   * Immediately updates UI, then syncs with server
   */
  async submitAssessment(
    assessmentId: string, 
    standards: { standardId: string; rating: Rating; evidence: string }[], 
    submittedBy: string = 'user1'
  ): Promise<void> {
    // Optimistic update - immediately update the cached assessment
    requestCache.updateOptimistically<Assessment>(
      'assessment_detail',
      (currentAssessment) => {
        if (!currentAssessment.standards) return currentAssessment;
        
        // Update standards with new ratings and evidence
        const updatedStandards = currentAssessment.standards.map(standard => {
          const submittedStandard = standards.find(s => s.standardId === standard.id);
          if (submittedStandard) {
            return {
              ...standard,
              rating: submittedStandard.rating,
              evidence: submittedStandard.evidence,
              lastUpdated: new Date().toISOString(),
            };
          }
          return standard;
        });

        // Calculate new completion stats
        const completedStandards = updatedStandards.filter(s => s.rating !== null).length;
        const totalStandards = updatedStandards.length;
        
        // Calculate overall score (average of ratings)
        const ratedStandards = updatedStandards.filter(s => s.rating !== null);
        const overallScore = ratedStandards.length > 0 
          ? ratedStandards.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedStandards.length
          : 0;

        // Determine new status
        const newStatus = completedStandards === totalStandards ? 'Completed' : 
                         completedStandards > 0 ? 'In Progress' : 'Not Started';

        return {
          ...currentAssessment,
          standards: updatedStandards,
          completedStandards,
          totalStandards,
          overallScore,
          status: newStatus as any,
          lastUpdated: new Date().toISOString(),
        };
      },
      { id: assessmentId }
    );

    // Also optimistically update the assessments list
    requestCache.updateOptimistically<Assessment[]>(
      'assessments',
      (currentAssessments) => {
        return currentAssessments.map(assessment => {
          if (assessment.id === assessmentId) {
            const completedStandards = standards.length;
            const totalStandards = assessment.totalStandards;
            const ratedStandards = standards.filter(s => s.rating !== null);
            const overallScore = ratedStandards.length > 0 
              ? ratedStandards.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedStandards.length
              : assessment.overallScore || 0;

            const newStatus = completedStandards === totalStandards ? 'Completed' : 
                             completedStandards > 0 ? 'In Progress' : 'Not Started';

            return {
              ...assessment,
              completedStandards,
              overallScore,
              status: newStatus as any,
              lastUpdated: new Date().toISOString(),
            };
          }
          return assessment;
        });
      }
    );

    try {
      // Perform actual API call
      await apiSubmitAssessment(assessmentId, standards, submittedBy);
      
      // Invalidate cache to ensure we get fresh data on next request
      // This will trigger a background refresh for subscribers
      requestCache.invalidate('assessment_detail', { id: assessmentId });
      requestCache.invalidate('assessments');
      
      console.log('✅ Assessment submitted successfully with optimistic updates');
    } catch (error) {
      // Revert optimistic updates on failure
      requestCache.invalidate('assessment_detail', { id: assessmentId });
      requestCache.invalidate('assessments');
      
      console.error('❌ Assessment submission failed, reverted optimistic updates');
      throw error;
    }
  }

  /**
   * Create new assessments with cache invalidation
   */
  async createAssessments(request: {
    category: AssessmentCategory;
    schoolIds: string[];
    dueDate?: string;
    term: AcademicTerm;
    academicYear: AcademicYear;
    assignedTo?: string;
  }): Promise<string[]> {
    try {
      const assessmentIds = await apiCreateAssessments(request);
      
      // Invalidate assessments cache to refresh the list
      requestCache.invalidate('assessments');
      
      // Preload the new assessments for better UX
      assessmentIds.forEach(id => {
        requestCache.preload('assessment_detail', () => apiGetAssessmentById(id), { id });
      });
      
      return assessmentIds;
    } catch (error) {
      console.error('Failed to create assessments:', error);
      throw error;
    }
  }

  // ===== SCHOOLS OPERATIONS =====

  /**
   * Get schools with long-term caching (schools rarely change)
   */
  async getSchools(): Promise<School[]> {
    return requestCache.get(
      'schools',
      () => apiGetSchools(),
    );
  }

  /**
   * Subscribe to school updates
   */
  subscribeToSchools(callback: (schools: School[]) => void): () => void {
    return requestCache.subscribe('schools', callback);
  }

  // ===== STANDARDS OPERATIONS =====

  /**
   * Get standards with caching by aspect
   */
  async getStandards(aspectId?: string): Promise<Standard[]> {
    return requestCache.get(
      'standards',
      () => apiGetStandards(aspectId),
      { aspectId: aspectId || 'all' }
    );
  }

  /**
   * Subscribe to standards updates
   */
  subscribeToStandards(callback: (standards: Standard[]) => void, aspectId?: string): () => void {
    return requestCache.subscribe('standards', callback, { aspectId: aspectId || 'all' });
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Preload critical data for better UX
   * Call this during app initialization or route changes
   */
  async preloadCriticalData(): Promise<void> {
    console.log('🚀 Preloading critical data...');
    
    try {
      // Preload in parallel for best performance
      await Promise.allSettled([
        requestCache.preload('assessments', () => apiGetAssessments()),
        requestCache.preload('schools', () => apiGetSchools()),
        requestCache.preload('standards', () => apiGetStandards(), { aspectId: 'all' }),
      ]);
      
      console.log('✅ Critical data preloaded successfully');
    } catch (error) {
      console.warn('⚠️  Some preloading failed:', error);
    }
  }

  /**
   * Refresh all cached data
   * Useful for pull-to-refresh or manual refresh
   */
  async refreshAllData(): Promise<void> {
    console.log('🔄 Refreshing all cached data...');
    
    // Invalidate all caches
    requestCache.invalidate('assessments');
    requestCache.invalidate('assessment_detail');
    requestCache.invalidate('schools');
    requestCache.invalidate('standards');
    
    // Preload fresh data
    await this.preloadCriticalData();
  }

  /**
   * Invalidate specific assessment cache
   * Call after external updates (e.g., from another tab)
   */
  invalidateAssessment(assessmentId: string): void {
    requestCache.invalidate('assessment_detail', { id: assessmentId });
    requestCache.invalidate('assessments'); // Also refresh list
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return requestCache.getStats();
  }

  // ===== OFFLINE SUPPORT =====

  /**
   * Check if we have cached data for offline use
   */
  hasOfflineData(): boolean {
    const stats = requestCache.getStats();
    return stats.size > 0;
  }

  /**
   * Get cached assessments for offline use
   * Returns null if no cached data available
   */
  getCachedAssessments(): Assessment[] | null {
    // This is a simplified implementation
    // In a real app, you'd want to access the cache more directly
    try {
      // For now, we'll just indicate if offline data is available
      return this.hasOfflineData() ? [] : null; // TODO: Implement proper offline data access
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const assessmentService = new EnhancedAssessmentService(); 