import { useState, useCallback, useTransition, useMemo } from 'react';

interface UseOptimisticFilterOptions<T> {
  data: T[];
  filterFn: (item: T, filters: any) => boolean;
  debounceMs?: number;
}

export function useOptimisticFilter<T>({
  data,
  filterFn,
  debounceMs = 0
}: UseOptimisticFilterOptions<T>) {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<any>({});
  const [optimisticFilters, setOptimisticFilters] = useState<any>({});

  // Update filters optimistically
  const updateFilter = useCallback((key: string, value: any) => {
    // Immediate optimistic update
    setOptimisticFilters(prev => ({ ...prev, [key]: value }));
    
    // Deferred actual update
    if (debounceMs > 0) {
      const timeoutId = setTimeout(() => {
        startTransition(() => {
          setFilters(prev => ({ ...prev, [key]: value }));
        });
      }, debounceMs);
      
      return () => clearTimeout(timeoutId);
    } else {
      startTransition(() => {
        setFilters(prev => ({ ...prev, [key]: value }));
      });
    }
  }, [debounceMs]);

  // Filter data using optimistic filters
  const filteredData = useMemo(() => {
    const activeFilters = isPending ? optimisticFilters : filters;
    return data.filter(item => filterFn(item, activeFilters));
  }, [data, filters, optimisticFilters, isPending, filterFn]);

  return {
    filteredData,
    filters: optimisticFilters,
    updateFilter,
    isPending,
    clearFilters: useCallback(() => {
      setOptimisticFilters({});
      startTransition(() => {
        setFilters({});
      });
    }, [])
  };
}