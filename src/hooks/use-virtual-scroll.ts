import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateVisibleItems } from '@/lib/performance-utils';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollingDelay?: number;
}

interface UseVirtualScrollReturn<T> {
  visibleItems: T[];
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  scrollTop: number;
  isScrolling: boolean;
  setScrollTop: (scrollTop: number) => void;
  containerProps: {
    onScroll: (e: React.UIEvent<HTMLElement>) => void;
    style: React.CSSProperties;
  };
  viewportProps: {
    style: React.CSSProperties;
  };
}

export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
): UseVirtualScrollReturn<T> {
  const { itemHeight, containerHeight, overscan = 3, scrollingDelay = 150 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate visible items
  const { visibleItems, startIndex, endIndex, totalHeight } = calculateVisibleItems(
    items,
    scrollTop,
    containerHeight,
    itemHeight,
    overscan
  );
  
  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const newScrollTop = (e.target as HTMLElement).scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current);
    }
    
    // Set scrolling to false after delay
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);
  }, [scrollingDelay]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollTop,
    isScrolling,
    setScrollTop,
    containerProps: {
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative' as const
      }
    },
    viewportProps: {
      style: {
        height: totalHeight,
        position: 'relative' as const,
        transform: `translateY(${startIndex * itemHeight}px)`
      }
    }
  };
}