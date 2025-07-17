import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface PreloadOptions {
  delay?: number;
  priority?: 'high' | 'low';
}

export function usePreload() {
  const navigate = useNavigate();
  const preloadCache = useRef<Set<string>>(new Set());
  const preloadTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Preload route data
  const preloadRoute = useCallback((path: string, options: PreloadOptions = {}) => {
    const { delay = 50, priority = 'low' } = options;

    // Skip if already preloaded
    if (preloadCache.current.has(path)) {
      return;
    }

    // Clear existing timer if any
    const existingTimer = preloadTimers.current.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set up preload with delay
    const timer = setTimeout(() => {
      preloadCache.current.add(path);
      
      // Simulate route preloading by creating a hidden prefetch
      if (priority === 'high') {
        // For high priority, prefetch immediately
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = path;
        document.head.appendChild(link);
      } else {
        // For low priority, use requestIdleCallback
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = path;
            document.head.appendChild(link);
          });
        }
      }
      
      preloadTimers.current.delete(path);
    }, delay);

    preloadTimers.current.set(path, timer);
  }, []);

  // Cancel preload
  const cancelPreload = useCallback((path: string) => {
    const timer = preloadTimers.current.get(path);
    if (timer) {
      clearTimeout(timer);
      preloadTimers.current.delete(path);
    }
  }, []);

  // Navigate with instant transition
  const navigateInstant = useCallback((path: string) => {
    // Mark as navigating for instant feel
    document.documentElement.classList.add('navigating');
    
    // Navigate after a micro delay for visual feedback
    setTimeout(() => {
      navigate(path);
      document.documentElement.classList.remove('navigating');
    }, 10);
  }, [navigate]);

  // Cleanup timers on unmount
  const cleanup = useCallback(() => {
    preloadTimers.current.forEach(timer => clearTimeout(timer));
    preloadTimers.current.clear();
  }, []);

  return {
    preloadRoute,
    cancelPreload,
    navigateInstant,
    cleanup,
    isPreloaded: (path: string) => preloadCache.current.has(path)
  };
}

// Hook for preloading images
export function useImagePreload() {
  const loadedImages = useRef<Set<string>>(new Set());
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Skip if already loaded
      if (loadedImages.current.has(src)) {
        resolve();
        return;
      }

      // Check if already loading
      const cached = imageCache.current.get(src);
      if (cached) {
        if (cached.complete) {
          loadedImages.current.add(src);
          resolve();
        } else {
          cached.addEventListener('load', () => {
            loadedImages.current.add(src);
            resolve();
          });
          cached.addEventListener('error', reject);
        }
        return;
      }

      // Create new image
      const img = new Image();
      imageCache.current.set(src, img);
      
      img.addEventListener('load', () => {
        loadedImages.current.add(src);
        resolve();
      });
      
      img.addEventListener('error', (error) => {
        imageCache.current.delete(src);
        reject(error);
      });
      
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback((srcs: string[]): Promise<void[]> => {
    return Promise.all(srcs.map(src => preloadImage(src)));
  }, [preloadImage]);

  return {
    preloadImage,
    preloadImages,
    isImageLoaded: (src: string) => loadedImages.current.has(src)
  };
}