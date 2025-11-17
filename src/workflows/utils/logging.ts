/**
 * Structured logging utilities for Workflow steps
 * Provides consistent log format with contextual information
 */

export interface LogContext {
  jobId: string;
  stepName: string;
  attempt?: number;
  userId?: string;
}

export class WorkflowLogger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  private formatMessage(level: string, message: string, data?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const contextStr = `jobId=${this.context.jobId} step=${this.context.stepName}${
      this.context.attempt ? ` attempt=${this.context.attempt}` : ''
    }`;

    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] [Workflow] ${contextStr} - ${message}${dataStr}`;
  }

  info(message: string, data?: Record<string, any>): void {
    console.log(this.formatMessage('INFO', message, data));
  }

  warn(message: string, data?: Record<string, any>): void {
    console.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, error?: Error | any, data?: Record<string, any>): void {
    const errorData = error ? {
      ...data,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    } : data;
    console.error(this.formatMessage('ERROR', message, errorData));
  }

  success(message: string, data?: Record<string, any>): void {
    console.log(this.formatMessage('SUCCESS', message, data));
  }
}
