import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { dev } from '$app/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // Set log level based on environment
    this.isDevelopment = dev;
    this.logLevel = this.isDevelopment ? 'debug' : 'warn';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context
    };
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, message, data, context);
    
    // Only log to console in development or when explicitly enabled
    if (this.isDevelopment || env.PUBLIC_ENABLE_LOGGING === 'true') {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
      const contextStr = context ? ` [${context}]` : '';
      
      switch (level) {
        case 'debug':
          console.debug(`${prefix}${contextStr}`, message, data || '');
          break;
        case 'info':
          console.info(`${prefix}${contextStr}`, message, data || '');
          break;
        case 'warn':
          console.warn(`${prefix}${contextStr}`, message, data || '');
          break;
        case 'error':
          console.error(`${prefix}${contextStr}`, message, data || '');
          break;
      }
    }

    // In production, you might want to send logs to a logging service
    if (!this.isDevelopment && level === 'error') {
      // TODO: Send to logging service (e.g., Sentry, LogRocket, etc.)
      this.sendToLoggingService(entry);
    }
  }

  private sendToLoggingService(entry: LogEntry): void {
    // Placeholder for sending logs to external service
    // This could be implemented with services like Sentry, LogRocket, etc.
    if (browser && 'navigator' in window && 'sendBeacon' in navigator) {
      try {
        navigator.sendBeacon('/api/logs', JSON.stringify(entry));
      } catch (error) {
        // Silently fail if logging service is unavailable
      }
    }
  }

  debug(message: string, data?: any, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: any, context?: string): void {
    this.log('error', message, data, context);
  }

  // Convenience method for API errors
  apiError(endpoint: string, error: any, context?: string): void {
    this.error(`API Error on ${endpoint}`, {
      endpoint,
      error: error?.message || error,
      stack: error?.stack
    }, context);
  }

  // Convenience method for authentication events
  authEvent(event: string, data?: any): void {
    this.info(`Auth Event: ${event}`, data, 'auth');
  }

  // Convenience method for database operations
  dbOperation(operation: string, table: string, data?: any): void {
    this.debug(`DB ${operation} on ${table}`, data, 'database');
  }
}

// Create and export a singleton instance
export const logger = new Logger();

// Export the class for testing purposes
export { Logger };
