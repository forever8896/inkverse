/**
 * Simple logging utility with environment-based configuration
 * Replaces console.log statements throughout the application
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LoggerOptions {
  service?: string;
  timestamp?: boolean;
  json?: boolean;
}

class Logger {
  private level: LogLevel;
  private service: string;
  private timestamp: boolean;
  private json: boolean;

  constructor(options: LoggerOptions = {}) {
    this.service = options.service || 'app';
    this.timestamp = options.timestamp !== false;
    this.json = options.json === true || process.env.NODE_ENV === 'production';

    // Set log level based on environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.level = this.parseLogLevel(envLevel) ?? (
      process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
    );
  }

  private parseLogLevel(level?: string): LogLevel | undefined {
    switch (level) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return undefined;
    }
  }

  private format(level: string, message: string, data?: any): string | object {
    const timestamp = new Date().toISOString();

    if (this.json) {
      return {
        timestamp: this.timestamp ? timestamp : undefined,
        level,
        service: this.service,
        message,
        ...(data && { data }),
      };
    }

    const prefix = this.timestamp ? `[${timestamp}]` : '';
    const serviceTag = `[${this.service}]`;
    const levelTag = `[${level}]`;
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';

    return `${prefix}${serviceTag}${levelTag} ${message}${dataStr}`;
  }

  private log(level: LogLevel, levelStr: string, message: string, data?: any) {
    if (level > this.level) return;

    const formatted = this.format(levelStr, message, data);

    if (this.json) {
      console.log(JSON.stringify(formatted));
    } else {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        default:
          console.log(formatted);
      }
    }
  }

  error(message: string, error?: Error | any) {
    const data = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error;
    this.log(LogLevel.ERROR, 'ERROR', message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  // Create a child logger with a specific service name
  child(service: string): Logger {
    return new Logger({
      service: `${this.service}:${service}`,
      timestamp: this.timestamp,
      json: this.json,
    });
  }
}

// Export factory function for creating loggers
export function createLogger(service: string, options?: Omit<LoggerOptions, 'service'>): Logger {
  return new Logger({ service, ...options });
}

// Export a default logger instance
export const logger = new Logger();