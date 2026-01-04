import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface UseInlineLoadingReturn {
  isLoading: (key: string) => boolean;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  withLoading: <T>(key: string, fn: () => Promise<T>) => Promise<T>;
  clearAll: () => void;
  loadingKeys: string[];
}

export function useInlineLoading(): UseInlineLoadingReturn {
  const [loadingState, setLoadingState] = useState<LoadingState>({});
  const minimumLoadingTime = useRef(300); // Minimum time to show loading state

  const isLoading = useCallback((key: string) => {
    return loadingState[key] || false;
  }, [loadingState]);

  const startLoading = useCallback((key: string) => {
    setLoadingState(prev => ({ ...prev, [key]: true }));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingState(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const withLoading = useCallback(async <T,>(
    key: string, 
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    startLoading(key);
    
    try {
      const result = await fn();
      
      // Ensure minimum loading time for better UX
      const elapsed = Date.now() - startTime;
      if (elapsed < minimumLoadingTime.current) {
        await new Promise(resolve => 
          setTimeout(resolve, minimumLoadingTime.current - elapsed)
        );
      }
      
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  const clearAll = useCallback(() => {
    setLoadingState({});
  }, []);

  const loadingKeys = Object.keys(loadingState).filter(key => loadingState[key]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    clearAll,
    loadingKeys
  };
}

// Hook for managing multiple async operations with individual loading states
export function useAsyncOperations() {
  const loading = useInlineLoading();
  const errors = useRef<Record<string, Error>>({});
  
  const execute = useCallback(async <T,>(
    key: string,
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      minimumLoadingTime?: number;
    }
  ): Promise<T | null> => {
    delete errors.current[key];
    
    try {
      const result = await loading.withLoading(key, operation);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.current[key] = err;
      options?.onError?.(err);
      return null;
    }
  }, [loading]);
  
  const getError = useCallback((key: string): Error | undefined => {
    return errors.current[key];
  }, []);
  
  const clearError = useCallback((key: string) => {
    delete errors.current[key];
  }, []);
  
  return {
    execute,
    isLoading: loading.isLoading,
    getError,
    clearError,
    loadingKeys: loading.loadingKeys
  };
}