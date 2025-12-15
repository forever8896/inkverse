/**
 * TypeScript types for the ink! Contract Checker Server
 */

// ============================================================================
// Job Types
// ============================================================================

export const JobStatus = {
  QUEUED: 'queued',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type JobStatusType = (typeof JobStatus)[keyof typeof JobStatus];

export interface CompilationJobData {
  code: string;
  timestamp: number;
  clientIp?: string;
}

export interface CompilationResult {
  success: boolean;
  errors: RustDiagnostic[];
  warnings: RustDiagnostic[];
  stdout: string;
  stderr: string;
  duration: number;
}

// ============================================================================
// Rust Compiler Output Types (JSON message format)
// ============================================================================

/**
 * Cargo's JSON message format for compiler diagnostics
 * Reference: https://doc.rust-lang.org/cargo/reference/external-tools.html
 */
export interface CargoMessage {
  reason: string;
  package_id?: string;
  manifest_path?: string;
  target?: CargoTarget;
  message?: RustcMessage;
  profile?: CargoProfile;
  features?: string[];
  filenames?: string[];
  executable?: string | null;
  fresh?: boolean;
}

export interface CargoTarget {
  kind: string[];
  crate_types: string[];
  name: string;
  src_path: string;
  edition: string;
}

export interface CargoProfile {
  opt_level: string;
  debuginfo: number | null;
  debug_assertions: boolean;
  overflow_checks: boolean;
  test: boolean;
}

export interface RustcMessage {
  $message_type?: string;
  message: string;
  code: RustcErrorCode | null;
  level: 'error' | 'warning' | 'note' | 'help' | 'failure-note';
  spans: RustcSpan[];
  children: RustcMessage[];
  rendered: string | null;
}

export interface RustcErrorCode {
  code: string;
  explanation: string | null;
}

export interface RustcSpan {
  file_name: string;
  byte_start: number;
  byte_end: number;
  line_start: number;
  line_end: number;
  column_start: number;
  column_end: number;
  is_primary: boolean;
  text: RustcSpanText[];
  label: string | null;
  suggested_replacement: string | null;
  suggestion_applicability: string | null;
  expansion: RustcExpansion | null;
}

export interface RustcSpanText {
  text: string;
  highlight_start: number;
  highlight_end: number;
}

export interface RustcExpansion {
  span: RustcSpan;
  macro_decl_name: string;
  def_site_span: RustcSpan | null;
}

// ============================================================================
// Processed Diagnostic Types (Educational Output)
// ============================================================================

export interface RustDiagnostic {
  level: 'error' | 'warning' | 'note' | 'help';
  code: string | null;
  message: string;
  location: DiagnosticLocation | null;
  snippet: string | null;
  suggestion: string | null;
  explanation: string | null;
}

export interface DiagnosticLocation {
  file: string;
  line: number;
  column: number;
  lineEnd?: number;
  columnEnd?: number;
}

// ============================================================================
// API Types
// ============================================================================

export interface CheckRequest {
  code: string;
}

export interface JobSubmittedResponse {
  jobId: string;
  status: 'queued';
  estimatedWait: number | null;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatusType;
  progress: number;
  result: CompilationResult | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  redis: {
    connected: boolean;
    latency?: number;
  };
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export interface BlockedPattern {
  pattern: RegExp;
  name: string;
  severity: 'critical' | 'high' | 'medium';
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ServerConfig {
  port: number;
  redisUrl: string;
  workerConcurrency: number;
  compilationTimeout: number;
  maxCodeSize: number;
  maxOutputSize: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  compileRateLimitMax: number;
  cargoHome: string;
  targetDir: string;
  tempDir: string;
  apiKey: string | null;
}

export interface SSEEvent {
  type: string;
  data: unknown;
}

// ============================================================================
// Express Extensions
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      jobId?: string;
      validatedCode?: string;
    }
  }
}
