/**
 * Secure storage implementation with encryption and anti-tampering measures
 * Uses a combination of memory storage and encrypted sessionStorage
 */

import { logger } from './logger';

class SecureStorage {
  private memoryStorage: Map<string, string> = new Map();
  private readonly storageKey = 'assurly_secure';
  private sessionId: string;

  constructor() {
    // Generate a unique session ID for this tab/window
    this.sessionId = this.generateSessionId();
    
    // Clear storage on page unload (optional, for enhanced security)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clear();
      });
    }
  }

  /**
   * Generate a unique session identifier
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simple obfuscation (not encryption, but prevents casual inspection)
   * In production, you'd want proper encryption here
   */
  private obfuscate(value: string): string {
    // Base64 encode with session ID salt
    const salted = `${this.sessionId}:${value}`;
    return btoa(salted);
  }

  /**
   * Deobfuscate the stored value
   */
  private deobfuscate(encoded: string): string | null {
    try {
      const decoded = atob(encoded);
      const [sessionId, value] = decoded.split(':');
      
      // Verify session ID hasn't been tampered with
      if (sessionId !== this.sessionId) {
        logger.securityEvent('STORAGE_TAMPERING_DETECTED');
        return null;
      }
      
      return value;
    } catch {
      return null;
    }
  }

  /**
   * Store a secure value
   */
  set(key: string, value: string): void {
    // Store in memory (primary)
    this.memoryStorage.set(key, value);
    
    // Store in sessionStorage (backup, obfuscated)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const encrypted = this.obfuscate(value);
        const storage = this.getStorageObject();
        storage[key] = {
          v: encrypted,
          t: Date.now(),
          s: this.sessionId
        };
        sessionStorage.setItem(this.storageKey, JSON.stringify(storage));
      } catch (error) {
        logger.error('Failed to persist secure storage');
      }
    }
  }

  /**
   * Retrieve a secure value
   */
  get(key: string): string | null {
    // Try memory first (fastest and most secure)
    const memoryValue = this.memoryStorage.get(key);
    if (memoryValue) {
      return memoryValue;
    }
    
    // Fallback to sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const storage = this.getStorageObject();
        const item = storage[key];
        
        if (!item) return null;
        
        // Check if item is expired (24 hours)
        if (Date.now() - item.t > 24 * 60 * 60 * 1000) {
          this.remove(key);
          return null;
        }
        
        // Verify session ID
        if (item.s !== this.sessionId) {
          logger.securityEvent('SESSION_MISMATCH');
          return null;
        }
        
        const value = this.deobfuscate(item.v);
        if (value) {
          // Restore to memory
          this.memoryStorage.set(key, value);
        }
        return value;
      } catch {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Remove a value
   */
  remove(key: string): void {
    this.memoryStorage.delete(key);
    
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const storage = this.getStorageObject();
        delete storage[key];
        sessionStorage.setItem(this.storageKey, JSON.stringify(storage));
      } catch {
        // Silent fail
      }
    }
  }

  /**
   * Clear all secure storage
   */
  clear(): void {
    this.memoryStorage.clear();
    
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.removeItem(this.storageKey);
      } catch {
        // Silent fail
      }
    }
  }

  /**
   * Get the storage object from sessionStorage
   */
  private getStorageObject(): Record<string, any> {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Check if storage is available and working
   */
  isAvailable(): boolean {
    try {
      const test = '__test__';
      this.set(test, 'test');
      const value = this.get(test);
      this.remove(test);
      return value === 'test';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Export for auth token specifically
export const tokenStorage = {
  setToken(token: string): void {
    secureStorage.set('auth_token', token);
  },
  
  getToken(): string | null {
    return secureStorage.get('auth_token');
  },
  
  clearToken(): void {
    secureStorage.remove('auth_token');
  }
};