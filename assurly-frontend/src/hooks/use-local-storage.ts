import { useState, useEffect, useCallback, useRef } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): [T, SetValue<T>, boolean] {
  const { 
    serialize = JSON.stringify, 
    deserialize = JSON.parse 
  } = options || {};
  
  const initialLoadRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize state with default value
  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  
  // Load from localStorage after mount
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    
    const loadFromStorage = () => {
      try {
        // Check if window is defined (client-side)
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }
        
        const item = window.localStorage.getItem(key);
        
        if (item !== null) {
          const parsed = deserialize(item);
          setStoredValue(parsed);
          // console.log(`[useLocalStorage] Loaded ${key}:`, parsed);
        } else {
          // Save default value to localStorage
          window.localStorage.setItem(key, serialize(defaultValue));
          // console.log(`[useLocalStorage] No value found for ${key}, using default:`, defaultValue);
        }
      } catch (error) {
        console.error(`[useLocalStorage] Error loading ${key}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Use requestAnimationFrame to ensure DOM is ready
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(loadFromStorage);
    } else {
      loadFromStorage();
    }
  }, [key, defaultValue, serialize, deserialize]);
  
  // Set value in both state and localStorage
  const setValue: SetValue<T> = useCallback((value) => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serialize(valueToStore));
        // console.log(`[useLocalStorage] Saved ${key}:`, valueToStore);
        
        // Dispatch custom event for other components/tabs
        window.dispatchEvent(new CustomEvent('local-storage-change', {
          detail: { key, value: valueToStore }
        }));
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error saving ${key}:`, error);
    }
  }, [key, serialize, storedValue]);
  
  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = deserialize(e.newValue);
          setStoredValue(newValue);
          // console.log(`[useLocalStorage] External change for ${key}:`, newValue);
        } catch (error) {
          console.error(`[useLocalStorage] Error parsing external change for ${key}:`, error);
        }
      }
    };
    
    // Listen for custom events from same tab
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleCustomEvent as EventListener);
    };
  }, [key, deserialize]);
  
  return [storedValue, setValue, isLoading];
}