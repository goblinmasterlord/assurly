/**
 * Production-safe logger that only logs in development
 * In production, it silently discards all logs to prevent information leakage
 */

const isDevelopment = import.meta.env.DEV;
const isDebugEnabled = import.meta.env.VITE_DEBUG_API === 'true';

class Logger {
  private shouldLog: boolean;

  constructor() {
    this.shouldLog = isDevelopment;
  }

  log(...args: any[]): void {
    if (this.shouldLog) {
      // In development only
      console.log(...args);
    }
    // In production: no-op
  }

  error(...args: any[]): void {
    if (this.shouldLog) {
      // In development only
      console.error(...args);
    }
    // In production: Could send to error tracking service like Sentry
    // but never to console
  }

  warn(...args: any[]): void {
    if (this.shouldLog) {
      console.warn(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog && isDebugEnabled) {
      console.debug(...args);
    }
  }

  // For critical security events that should be tracked
  securityEvent(event: string, details?: any): void {
    // In production, this would send to your security monitoring service
    // Never log sensitive details to console
    if (this.shouldLog) {
      console.log(`[SECURITY] ${event}`, details);
    }
  }
}

export const logger = new Logger();