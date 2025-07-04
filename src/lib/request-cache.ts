import type { Assessment, School, Standard } from '@/types/assessment';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate: boolean; // Return stale data while fetching fresh
  maxAge: number; // Maximum age before forced refresh
}

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  isStale: boolean;
  promise?: Promise<T>; // For request deduplication
}

// Default cache configurations for different data types
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  assessments: {
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true,
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
  assessment_detail: {
    ttl: 2 * 60 * 1000, // 2 minutes (more frequent updates expected)
    staleWhileRevalidate: true,
    maxAge: 15 * 60 * 1000, // 15 minutes
  },
  schools: {
    ttl: 60 * 60 * 1000, // 1 hour (rarely changes)
    staleWhileRevalidate: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  standards: {
    ttl: 30 * 60 * 1000, // 30 minutes (rarely changes)
    staleWhileRevalidate: true,
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
  },
};

// Global request cache instance
class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  // Generate cache key from request parameters
  private generateKey(type: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${type}:${paramString}`;
  }

  // Check if cache entry is valid
  private isValid(entry: CacheEntry<any>, config: CacheConfig): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    return age < config.ttl;
  }

  // Check if cache entry is stale but usable
  private isStale(entry: CacheEntry<any>, config: CacheConfig): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    return age > config.ttl && age < config.maxAge;
  }

  // Get data from cache or fetch if needed
  async get<T>(
    type: string,
    fetcher: () => Promise<T>,
    params?: Record<string, any>
  ): Promise<T> {
    const key = this.generateKey(type, params);
    const config = CACHE_CONFIGS[type] || CACHE_CONFIGS.assessments;
    const now = Date.now();

    // Check if we have a pending request for deduplication
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    const entry = this.cache.get(key);

    // Fresh data available
    if (entry && this.isValid(entry, config)) {
      entry.lastAccessed = now;
      console.log(`💾 Cache hit (fresh): ${key}`);
      return entry.data;
    }

    // Stale data available and stale-while-revalidate enabled
    if (entry && this.isStale(entry, config) && config.staleWhileRevalidate) {
      entry.lastAccessed = now;
      console.log(`⚡ Cache hit (stale): ${key} - fetching fresh data in background`);
      
      // Return stale data immediately
      const staleData = entry.data;
      
      // Fetch fresh data in background
      this.backgroundRefresh(key, fetcher, config);
      
      return staleData;
    }

    // No valid cache data, fetch fresh
    console.log(`🌐 Cache miss: ${key} - fetching fresh data`);
    return this.fetch(key, fetcher, config);
  }

  // Fetch data and cache it
  private async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const promise = fetcher();
    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;
      const now = Date.now();

      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: now,
        lastAccessed: now,
        isStale: false,
      });

      // Notify subscribers
      this.notifySubscribers(key, data);

      console.log(`✅ Cached fresh data: ${key}`);
      return data;
    } catch (error) {
      console.error(`❌ Fetch failed: ${key}`, error);
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  // Background refresh for stale-while-revalidate
  private async backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<void> {
    if (this.pendingRequests.has(key)) {
      return; // Already refreshing
    }

    try {
      await this.fetch(key, fetcher, config);
    } catch (error) {
      console.warn(`Background refresh failed for ${key}:`, error);
      // Don't throw - this is a background operation
    }
  }

  // Subscribe to data updates
  subscribe<T>(type: string, callback: (data: T) => void, params?: Record<string, any>): () => void {
    const key = this.generateKey(type, params);
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Notify subscribers of data updates
  private notifySubscribers(key: string, data: any): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  // Invalidate cache entries
  invalidate(type: string, params?: Record<string, any>): void {
    if (params) {
      // Invalidate specific entry
      const key = this.generateKey(type, params);
      this.cache.delete(key);
      this.pendingRequests.delete(key);
      console.log(`🗑️  Invalidated cache: ${key}`);
    } else {
      // Invalidate all entries of this type
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${type}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
      });
      console.log(`🗑️  Invalidated all cache entries for type: ${type}`);
    }
  }

  // Preload data into cache
  async preload<T>(
    type: string,
    fetcher: () => Promise<T>,
    params?: Record<string, any>
  ): Promise<void> {
    const key = this.generateKey(type, params);
    const entry = this.cache.get(key);
    
    // Only preload if we don't have valid cached data
    if (!entry || !this.isValid(entry, CACHE_CONFIGS[type] || CACHE_CONFIGS.assessments)) {
      try {
        await this.get(type, fetcher, params);
        console.log(`🚀 Preloaded data: ${key}`);
      } catch (error) {
        console.warn(`Preload failed for ${key}:`, error);
      }
    }
  }

  // Update cached data optimistically
  updateOptimistically<T>(
    type: string,
    updater: (currentData: T) => T,
    params?: Record<string, any>
  ): void {
    const key = this.generateKey(type, params);
    const entry = this.cache.get(key);
    
    if (entry) {
      try {
        const updatedData = updater(entry.data);
        entry.data = updatedData;
        entry.timestamp = Date.now(); // Refresh timestamp
        this.notifySubscribers(key, updatedData);
        console.log(`⚡ Optimistic update: ${key}`);
      } catch (error) {
        console.error('Optimistic update failed:', error);
      }
    }
  }

  // Clean up old cache entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const type = key.split(':')[0];
      const config = CACHE_CONFIGS[type] || CACHE_CONFIGS.assessments;
      const age = now - entry.lastAccessed;
      
      // Remove entries that haven't been accessed for 2x their max age
      if (age > config.maxAge * 2) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} old cache entries`);
    }
  }

  // Get cache statistics
  getStats(): {
    size: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; lastAccessed: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      lastAccessed: now - entry.lastAccessed,
    }));

    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
      entries,
    };
  }
}

// Export singleton instance
export const requestCache = new RequestCache();

// Cleanup interval - run every 5 minutes
setInterval(() => {
  requestCache.cleanup();
}, 5 * 60 * 1000);

// Export types for use in other modules
export type { CacheConfig, CacheEntry }; 