import { useState, useEffect, useCallback, useRef } from 'react';
import { assessmentService } from '@/services/enhanced-assessment-service';
import { getAssessmentsByAspect } from '@/services/assessment-service';
import { parseGroupId } from '@/lib/data-transformers';
import type { Assessment, AssessmentCategory, AcademicTerm, AcademicYear, School, Standard, Rating, AssessmentByAspect } from '@/types/assessment';

// Hook for managing assessments list
export function useAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load assessments with caching
  const loadAssessments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      
      const data = await assessmentService.getAssessments();
      setAssessments(data);
    } catch (err: any) {
      const errorMessage = err.userMessage || err.message || 'Failed to load assessments';
      setError(errorMessage);
      console.error('useAssessments error:', err);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  // Refresh assessments (manual refresh)
  const refreshAssessments = useCallback(async () => {
    setIsRefreshing(true);
    await loadAssessments(false);
  }, [loadAssessments]);

  // Subscribe to real-time updates
  useEffect(() => {
    // Initial load
    loadAssessments();

    // Subscribe to updates
    unsubscribeRef.current = assessmentService.subscribeToAssessments((updatedAssessments) => {
      setAssessments(updatedAssessments);
      setError(null);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [loadAssessments]);

  return {
    assessments,
    isLoading,
    error,
    isRefreshing,
    refreshAssessments,
    reloadAssessments: loadAssessments,
  };
}

// Helper function to detect if an ID is a group_id (aspect-level) vs assessment_id (standard-level)
function isGroupId(id: string): boolean {
  try {
    const parsed = parseGroupId(id);
    // Valid aspect codes are typically 2-3 uppercase letters (EDU, HR, FIN, GOV, IT, IS, EST)
    // Standard codes typically have numbers (ES1, HR2, etc.)
    const aspectCodePattern = /^[A-Z]{2,3}$/;
    return aspectCodePattern.test(parsed.aspectCode);
  } catch {
    return false;
  }
}

// Transform AssessmentByAspect to Assessment format for compatibility
function transformAssessmentByAspectToAssessment(data: AssessmentByAspect): Assessment {
  const lastUpdatedFromStandards =
    data.standards
      .map(s => s.last_updated)
      .filter((d): d is string => typeof d === 'string' && d.length > 0)
      .sort((a, b) => (new Date(b).getTime() || 0) - (new Date(a).getTime() || 0))[0] || null;

  return {
    id: `${data.school_id}-${data.aspect_code}-${data.term_id}-${data.academic_year}`,
    assessment_id: `${data.school_id}-${data.aspect_code}-${data.term_id}-${data.academic_year}`,
    school_id: data.school_id,
    school_name: data.school_name,
    mat_aspect_id: data.mat_aspect_id,
    aspect_code: data.aspect_code,
    aspect_name: data.aspect_name,
    unique_term_id: `${data.term_id}-${data.academic_year}`,
    academic_year: data.academic_year,
    rating: null,
    evidence_comments: null,
    status: data.status,
    due_date: null,
    assigned_to: null,
    assigned_to_name: null,
    submitted_at: null,
    submitted_by: null,
    submitted_by_name: null,
    last_updated: lastUpdatedFromStandards || new Date().toISOString(),
    mat_standard_id: '',
    standard_code: '',
    standard_name: data.aspect_name,
    standard_description: '',
    version_id: '',
    version_number: 1,
    // Transform standards array for the detail page
    // Include assessment_id from the API response - this is the correct ID to use
    standards: data.standards.map(std => ({
      id: std.mat_standard_id,
      mat_standard_id: std.mat_standard_id,
      standard_code: std.standard_code,
      standard_name: std.standard_name,
      standard_description: std.standard_description,
      standard_type: std.standard_type,
      sort_order: std.sort_order,
      rating: std.rating,
      evidence: std.evidence_comments || '',
      code: std.standard_code,
      title: std.standard_name,
      description: std.standard_description,
      // Store the assessment_id for submission - this is the key fix!
      // Use type assertion since Standard interface doesn't include assessment_id
      assessment_id: std.assessment_id,
      // Extra API fields used by the assessment detail table
      last_updated: std.last_updated || null,
      assigned_to_name: std.assigned_to_name || null,
      updated_by: std.updated_by || null,
      updated_by_name: std.updated_by_name || null,
    } as Standard & { assessment_id?: string; last_updated?: string | null; assigned_to_name?: string | null; updated_by?: string | null; updated_by_name?: string | null })),
    // Backward compatibility fields
    name: `${data.aspect_name} - ${data.school_name}`,
    category: data.aspect_code.toLowerCase() as AssessmentCategory,
    school: {
      school_id: data.school_id,
      school_name: data.school_name,
      id: data.school_id,
      name: data.school_name,
    },
    completedStandards: data.completed_standards,
    totalStandards: data.total_standards,
    lastUpdated: lastUpdatedFromStandards || new Date().toISOString(),
    dueDate: undefined,
    assignedTo: [],
  };
}

// Hook for managing a single assessment
export function useAssessment(assessmentId: string | undefined) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load single assessment - handles both assessment_id and group_id
  const loadAssessment = useCallback(async (showLoading = true) => {
    if (!assessmentId) {
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      
      // Check if this is a group_id (aspect-level) or assessment_id (standard-level)
      if (isGroupId(assessmentId)) {
        // Parse group_id and use by-aspect endpoint
        const parsed = parseGroupId(assessmentId);
        const uniqueTermId = `${parsed.termId}-${parsed.academicYear}`;
        const aspectData = await getAssessmentsByAspect(
          parsed.aspectCode,
          parsed.schoolId,
          uniqueTermId
        );
        const transformed = transformAssessmentByAspectToAssessment(aspectData);
        setAssessment(transformed);
      } else {
        // Use standard assessment endpoint
        const data = await assessmentService.getAssessmentById(assessmentId);
        setAssessment(data);
      }
    } catch (err: any) {
      const errorMessage = err.userMessage || err.message || 'Failed to load assessment';
      setError(errorMessage);
      console.error('useAssessment error:', err);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [assessmentId]);

  // Refresh assessment (manual refresh)
  const refreshAssessment = useCallback(async () => {
    setIsRefreshing(true);
    await loadAssessment(false);
  }, [loadAssessment]);

  // Submit assessment with optimistic updates
  const submitAssessment = useCallback(async (
    standards: { standardId: string; rating: Rating; evidence: string }[],
    submittedBy?: string
  ) => {
    if (!assessmentId) throw new Error('No assessment ID');

    setIsSaving(true);
    setError(null);

    try {
      // For aspect-based assessments, we need to get the actual assessment_id from each standard
      // The standardId might be mat_standard_id, but we need the assessment_id from the API response
      let updates;
      
      if (isGroupId(assessmentId) && assessment?.standards) {
        // Map standard IDs to their assessment_ids from the API response
        updates = standards.map(s => {
          const standard = assessment.standards?.find(std => 
            std.mat_standard_id === s.standardId || std.id === s.standardId
          );
          // Use the assessment_id from the API response - this is the correct ID
          // If assessment_id is not available (new assessment), we'll need to construct it
          // Format: {school_id}-{standard_code}-{term_id}-{academic_year}
          // Type assertion needed since Standard type doesn't include assessment_id
          const standardWithId = standard as (Standard & { assessment_id?: string }) | undefined;
          let targetAssessmentId = standardWithId?.assessment_id;
          
          if (!targetAssessmentId && standard) {
            // Construct assessment_id if not provided (for new assessments)
            const parsed = parseGroupId(assessmentId);
            targetAssessmentId = `${parsed.schoolId}-${standard.standard_code}-${parsed.termId}-${parsed.academicYear}`;
          }
          
          return {
            assessment_id: targetAssessmentId || s.standardId,
            rating: s.rating,
            evidence_comments: s.evidence
          };
        });
      } else {
        // For single standard assessments, use the standardId directly
        updates = standards.map(s => ({
          assessment_id: s.standardId,
          rating: s.rating,
          evidence_comments: s.evidence
        }));
      }
      
      await assessmentService.bulkUpdateAssessments(updates);
      console.log('✅ Assessment submitted successfully');
    } catch (err: any) {
      const errorMessage = err.userMessage || err.message || 'Failed to submit assessment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [assessmentId, assessment]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!assessmentId) {
      setAssessment(null);
      setIsLoading(false);
      return;
    }

    // Initial load
    loadAssessment();

    // Subscribe to updates
    unsubscribeRef.current = assessmentService.subscribeToAssessment(
      assessmentId,
      (updatedAssessment) => {
        setAssessment(updatedAssessment);
        setError(null);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [assessmentId, loadAssessment]);

  return {
    assessment,
    isLoading,
    error,
    isSaving,
    isRefreshing,
    submitAssessment,
    refreshAssessment,
    reloadAssessment: loadAssessment,
  };
}

// Hook for managing schools
export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load schools
  const loadSchools = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await assessmentService.getSchools();
      setSchools(data);
    } catch (err: any) {
      const errorMessage = err.userMessage || err.message || 'Failed to load schools';
      setError(errorMessage);
      console.error('useSchools error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadSchools();

    // Subscribe to updates
    unsubscribeRef.current = assessmentService.subscribeToSchools((updatedSchools) => {
      setSchools(updatedSchools);
      setError(null);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [loadSchools]);

  return {
    schools,
    isLoading,
    error,
    reloadSchools: loadSchools,
  };
}

// Hook for creating assessments
export function useCreateAssessment() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAssessments = useCallback(async (request: {
    category: AssessmentCategory;
    schoolIds: string[];
    dueDate?: string;
    term: AcademicTerm;
    academicYear: AcademicYear;
    assignedTo?: string;
  }) => {
    setIsCreating(true);
    setError(null);

    try {
      // Convert v3 format to v4 format
      await assessmentService.createAssessments({
        school_ids: request.schoolIds,
        aspect_code: request.category,
        term_id: `${request.term}-${request.academicYear}`,
        due_date: request.dueDate,
        assigned_to: request.assignedTo,
      });
      console.log('✅ Assessments created successfully');
      return request.schoolIds;
    } catch (err: any) {
      const errorMessage = err.userMessage || err.message || 'Failed to create assessments';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createAssessments,
    isCreating,
    error,
  };
}

// Hook for managing standards
export function useStandards(aspectId?: string) {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load standards
  const loadStandards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await assessmentService.getStandards(aspectId);
      setStandards(data);
    } catch (err: any) {
      const errorMessage = err.userMessage || err.message || 'Failed to load standards';
      setError(errorMessage);
      console.error('useStandards error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [aspectId]);

  useEffect(() => {
    // Initial load
    loadStandards();

    // Subscribe to updates
    unsubscribeRef.current = assessmentService.subscribeToStandards(
      (updatedStandards) => {
        setStandards(updatedStandards);
        setError(null);
      },
      aspectId
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [aspectId, loadStandards]);

  return {
    standards,
    isLoading,
    error,
    reloadStandards: loadStandards,
  };
}

// Hook for app-level data management
export function useAppData() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasOfflineData, setHasOfflineData] = useState(false);

  // Initialize app data
  const initializeApp = useCallback(async () => {
    try {
      setIsInitializing(true);
      await assessmentService.preloadCriticalData();
      setHasOfflineData(assessmentService.hasOfflineData());
    } catch (error) {
      console.warn('App initialization failed:', error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Refresh all app data
  const refreshAllData = useCallback(async () => {
    try {
      await assessmentService.refreshAllData();
      setHasOfflineData(assessmentService.hasOfflineData());
    } catch (error) {
      console.error('Failed to refresh all data:', error);
    }
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return assessmentService.getCacheStats();
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return {
    isInitializing,
    hasOfflineData,
    refreshAllData,
    getCacheStats,
    reinitializeApp: initializeApp,
  };
}

// Hook for optimistic UI updates
export function useOptimisticUpdates() {
  const invalidateAssessment = useCallback((assessmentId: string) => {
    assessmentService.invalidateAssessment(assessmentId);
  }, []);

  const invalidateAllAssessments = useCallback(() => {
    assessmentService.refreshAllData();
  }, []);

  return {
    invalidateAssessment,
    invalidateAllAssessments,
  };
} 