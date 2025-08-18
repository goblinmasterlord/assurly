/**
 * Client-side rate limiter to prevent abuse and brute force attacks
 * This works in conjunction with server-side rate limiting
 */

import { logger } from './logger';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();
  private readonly config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      maxAttempts: config?.maxAttempts || 5,
      windowMs: config?.windowMs || 15 * 60 * 1000, // 15 minutes
      blockDurationMs: config?.blockDurationMs || 30 * 60 * 1000, // 30 minutes
    };

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute
  }

  /**
   * Check if an action is allowed based on rate limiting rules
   */
  checkLimit(key: string): { allowed: boolean; retryAfter?: number; remainingAttempts?: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    // No previous attempts
    if (!record) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
      });
      return { 
        allowed: true, 
        remainingAttempts: this.config.maxAttempts - 1 
      };
    }

    // Check if blocked
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000); // in seconds
      logger.securityEvent('RATE_LIMIT_BLOCKED', { key, retryAfter });
      return { 
        allowed: false, 
        retryAfter 
      };
    }

    // Check if window has expired
    if (now - record.firstAttempt > this.config.windowMs) {
      // Reset the window
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
      });
      return { 
        allowed: true, 
        remainingAttempts: this.config.maxAttempts - 1 
      };
    }

    // Within window, increment count
    record.count++;
    
    if (record.count > this.config.maxAttempts) {
      // Block the key
      record.blockedUntil = now + this.config.blockDurationMs;
      logger.securityEvent('RATE_LIMIT_EXCEEDED', { 
        key, 
        attempts: record.count,
        blockedUntil: new Date(record.blockedUntil).toISOString() 
      });
      
      const retryAfter = Math.ceil(this.config.blockDurationMs / 1000);
      return { 
        allowed: false, 
        retryAfter 
      };
    }

    return { 
      allowed: true, 
      remainingAttempts: this.config.maxAttempts - record.count 
    };
  }

  /**
   * Reset attempts for a specific key (e.g., after successful login)
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.attempts.forEach((record, key) => {
      // Remove entries older than 2 hours
      if (now - record.firstAttempt > 2 * 60 * 60 * 1000) {
        expired.push(key);
      }
      // Remove unblocked entries that haven't been used recently
      if (!record.blockedUntil && now - record.firstAttempt > this.config.windowMs) {
        expired.push(key);
      }
    });

    expired.forEach(key => this.attempts.delete(key));
  }

  /**
   * Get current status for monitoring
   */
  getStatus(): { size: number; blocked: number } {
    const now = Date.now();
    let blocked = 0;
    
    this.attempts.forEach(record => {
      if (record.blockedUntil && record.blockedUntil > now) {
        blocked++;
      }
    });

    return {
      size: this.attempts.size,
      blocked,
    };
  }
}

// Export singleton instances for different purposes
export const loginRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
});

export const apiRateLimiter = new RateLimiter({
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 5 * 60 * 1000, // 5 minutes
});

export default RateLimiter;