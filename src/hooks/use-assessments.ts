import { useState, useEffect, useCallback, useRef } from 'react';
import { assessmentService } from '@/services/enhanced-assessment-service';
import type { Assessment, AssessmentCategory, AcademicTerm, AcademicYear, School, Standard, Rating } from '@/types/assessment';

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

// Hook for managing a single assessment
export function useAssessment(assessmentId: string | undefined) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load single assessment
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
      
      const data = await assessmentService.getAssessmentById(assessmentId);
      setAssessment(data);
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
      await assessmentService.submitAssessment(assessmentId, standards, submittedBy);
      console.log('✅ Assessment submitted successfully');
    } catch (err: any) {
      const errorMessage = err.userMessage || err.message || 'Failed to submit assessment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [assessmentId]);

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
  }) => {
    setIsCreating(true);
    setError(null);

    try {
      const assessmentIds = await assessmentService.createAssessments(request);
      console.log('✅ Assessments created successfully:', assessmentIds);
      return assessmentIds;
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