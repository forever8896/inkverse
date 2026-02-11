import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, LogLevel } from '../logger';

describe('createLogger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a logger with a service name', () => {
    const log = createLogger('test-service');
    expect(log).toBeDefined();
  });

  describe('log level methods', () => {
    it('logs error messages via console.error', () => {
      const log = createLogger('svc', { json: false });
      log.error('Something broke');
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      const msg = consoleSpy.error.mock.calls[0][0] as string;
      expect(msg).toContain('ERROR');
      expect(msg).toContain('Something broke');
      expect(msg).toContain('svc');
    });

    it('logs warn messages via console.warn', () => {
      const log = createLogger('svc', { json: false });
      log.warn('Watch out');
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      const msg = consoleSpy.warn.mock.calls[0][0] as string;
      expect(msg).toContain('WARN');
      expect(msg).toContain('Watch out');
    });

    it('logs info messages via console.log', () => {
      const log = createLogger('svc', { json: false });
      log.info('Started');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const msg = consoleSpy.log.mock.calls[0][0] as string;
      expect(msg).toContain('INFO');
      expect(msg).toContain('Started');
    });

    it('logs debug messages via console.log', () => {
      const log = createLogger('svc', { json: false });
      log.debug('Debug data');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const msg = consoleSpy.log.mock.calls[0][0] as string;
      expect(msg).toContain('DEBUG');
    });
  });

  describe('data parameter', () => {
    it('includes extra data in text format', () => {
      const log = createLogger('svc', { json: false });
      log.info('User login', { userId: 42 });
      const msg = consoleSpy.log.mock.calls[0][0] as string;
      expect(msg).toContain('42');
    });

    it('extracts Error properties for error method', () => {
      const log = createLogger('svc', { json: false });
      const err = new Error('DB connection lost');
      log.error('Database failure', err);
      const msg = consoleSpy.error.mock.calls[0][0] as string;
      expect(msg).toContain('DB connection lost');
    });
  });

  describe('JSON mode', () => {
    it('outputs JSON when json option is true', () => {
      const log = createLogger('api', { json: true });
      log.info('Request handled');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const output = consoleSpy.log.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.level).toBe('INFO');
      expect(parsed.message).toBe('Request handled');
      expect(parsed.service).toBe('api');
    });

    it('includes data in JSON output', () => {
      const log = createLogger('api', { json: true });
      log.info('Status', { code: 200 });
      const parsed = JSON.parse(consoleSpy.log.mock.calls[0][0] as string);
      expect(parsed.data).toEqual({ code: 200 });
    });

    it('includes timestamp in JSON output by default', () => {
      const log = createLogger('api', { json: true });
      log.info('test');
      const parsed = JSON.parse(consoleSpy.log.mock.calls[0][0] as string);
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('timestamp option', () => {
    it('includes timestamp by default in text mode', () => {
      const log = createLogger('svc', { json: false });
      log.info('test');
      const msg = consoleSpy.log.mock.calls[0][0] as string;
      // Should contain ISO timestamp pattern
      expect(msg).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });

    it('excludes timestamp when disabled', () => {
      const log = createLogger('svc', { json: false, timestamp: false });
      log.info('test');
      const msg = consoleSpy.log.mock.calls[0][0] as string;
      expect(msg).not.toMatch(/\[\d{4}-\d{2}-\d{2}T/);
      expect(msg).toMatch(/^\[svc\]/);
    });
  });

  describe('child logger', () => {
    it('creates child with combined service name', () => {
      const parent = createLogger('api', { json: false });
      const child = parent.child('auth');
      child.info('Login attempt');
      const msg = consoleSpy.log.mock.calls[0][0] as string;
      expect(msg).toContain('api:auth');
    });
  });
});

describe('LogLevel enum', () => {
  it('has correct numeric ordering', () => {
    expect(LogLevel.ERROR).toBeLessThan(LogLevel.WARN);
    expect(LogLevel.WARN).toBeLessThan(LogLevel.INFO);
    expect(LogLevel.INFO).toBeLessThan(LogLevel.DEBUG);
  });
});
