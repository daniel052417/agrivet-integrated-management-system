/**
 * Logger Utility
 * 
 * Provides conditional logging based on environment.
 * In production, only errors are logged.
 * In development, all log levels are enabled.
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!isProduction) {
      // In development, log everything
      return true;
    }
    
    // In production, only log errors and warnings
    return level === 'error' || level === 'warn';
  }

  log(...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug') && isDevelopment) {
      console.debug(...args);
    }
  }

  /**
   * Group logs together (only in development)
   */
  group(label: string): void {
    if (isDevelopment) {
      console.group(label);
    }
  }

  /**
   * End a log group (only in development)
   */
  groupEnd(): void {
    if (isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Table display (only in development)
   */
  table(data: any): void {
    if (isDevelopment) {
      console.table(data);
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export for convenience
export default logger;



