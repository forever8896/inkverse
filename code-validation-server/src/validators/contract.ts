/**
 * Input Validation for ink! Smart Contract Code
 *
 * Security Model (Railway-Compatible):
 * - Block file inclusion macros (can read server files)
 * - Block build scripts (can execute arbitrary code)
 * - Block custom proc macros (can execute arbitrary code)
 * - Require ink! contract structure
 * - Size limits to prevent resource exhaustion
 *
 * Note: Since code doesn't execute (only compiles), we don't need to block
 * std::net, std::process, etc. - those are runtime concerns.
 */

import type { ValidationResult, BlockedPattern } from '../types/index.js';

// ============================================================================
// Configuration
// ============================================================================

const MAX_CODE_SIZE = 100 * 1024; // 100KB
const MIN_CODE_SIZE = 50; // Minimum viable contract size

// ============================================================================
// Blocked Patterns - CRITICAL for Security
// ============================================================================

/**
 * Patterns that MUST be blocked for security:
 * - File inclusion macros: Can read arbitrary files from the server
 * - Build scripts: Execute arbitrary code during compilation
 * - Custom proc macros: Execute arbitrary code during compilation
 * - Path attributes: Can include files from other locations
 */
const BLOCKED_PATTERNS: BlockedPattern[] = [
  // -------------------------------------------------------------------------
  // File Inclusion - CRITICAL (can read server files at compile time)
  // -------------------------------------------------------------------------
  {
    pattern: /include_bytes!\s*\(/,
    name: 'include_bytes! macro',
    severity: 'critical',
  },
  {
    pattern: /include_str!\s*\(/,
    name: 'include_str! macro',
    severity: 'critical',
  },
  {
    pattern: /include!\s*\(/,
    name: 'include! macro',
    severity: 'critical',
  },

  // -------------------------------------------------------------------------
  // Build Scripts - CRITICAL (execute arbitrary code)
  // -------------------------------------------------------------------------
  {
    pattern: /\[build-dependencies\]/,
    name: 'build-dependencies section',
    severity: 'critical',
  },
  {
    pattern: /build\s*=\s*["']build\.rs["']/,
    name: 'build.rs script reference',
    severity: 'critical',
  },

  // -------------------------------------------------------------------------
  // Path Manipulation - HIGH (can include files from other locations)
  // -------------------------------------------------------------------------
  {
    pattern: /#\[path\s*=/,
    name: '#[path] attribute',
    severity: 'high',
  },
  {
    pattern: /#!\[path\s*=/,
    name: '#![path] inner attribute',
    severity: 'high',
  },

  // -------------------------------------------------------------------------
  // Custom Proc Macros - HIGH (definitions, not usage)
  // -------------------------------------------------------------------------
  {
    pattern: /#\[proc_macro\]/,
    name: 'proc_macro definition',
    severity: 'high',
  },
  {
    pattern: /#\[proc_macro_derive/,
    name: 'proc_macro_derive definition',
    severity: 'high',
  },
  {
    pattern: /#\[proc_macro_attribute/,
    name: 'proc_macro_attribute definition',
    severity: 'high',
  },

  // -------------------------------------------------------------------------
  // Nightly Features - MEDIUM (unpredictable behavior)
  // -------------------------------------------------------------------------
  {
    pattern: /#!\[feature\(/,
    name: 'nightly feature flags',
    severity: 'medium',
  },

  // -------------------------------------------------------------------------
  // Module Definition with External Files - MEDIUM
  // -------------------------------------------------------------------------
  {
    pattern: /mod\s+\w+\s*;/,
    name: 'external module declaration (use inline modules instead)',
    severity: 'medium',
  },
];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates ink! smart contract code for compilation.
 *
 * This is a pedagogical + security validation layer:
 * - Provides user-friendly errors for common mistakes
 * - Blocks dangerous compile-time patterns
 * - Does NOT block runtime patterns (code doesn't execute)
 */
export function validateContractCode(code: unknown): ValidationResult {
  // Type check
  if (typeof code !== 'string') {
    return {
      valid: false,
      error: 'Code must be a string',
    };
  }

  // Empty check
  if (code.trim().length === 0) {
    return {
      valid: false,
      error: 'Code cannot be empty',
    };
  }

  // Size limits
  if (code.length > MAX_CODE_SIZE) {
    return {
      valid: false,
      error: `Code exceeds maximum size of ${Math.floor(MAX_CODE_SIZE / 1024)}KB`,
    };
  }

  if (code.length < MIN_CODE_SIZE) {
    return {
      valid: false,
      error: 'Code is too short to be a valid ink! contract',
    };
  }

  // Check for blocked patterns (security-critical only)
  for (const { pattern, name, severity } of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      return {
        valid: false,
        error: getBlockedPatternError(name, severity),
      };
    }
  }

  // Check for suspicious Cargo.toml content embedded in code
  if (code.includes('[dependencies]') || code.includes('[package]')) {
    return {
      valid: false,
      error:
        'Code should not contain Cargo.toml content. Only provide the Rust source code.',
    };
  }

  return {
    valid: true,
    sanitized: code,
  };
}

/**
 * Generate user-friendly error message for blocked patterns
 */
function getBlockedPatternError(name: string, severity: string): string {
  const severityMsg =
    severity === 'critical'
      ? 'is not allowed for security reasons'
      : severity === 'high'
        ? 'is not supported in educational contracts'
        : 'is not recommended for learning';

  return `${name} ${severityMsg}. Please remove it from your code.`;
}

/**
 * Quick validation for rate limiting decisions (cheaper than full validation)
 */
export function quickValidate(code: unknown): boolean {
  if (typeof code !== 'string') return false;
  if (code.length > MAX_CODE_SIZE) return false;
  if (code.length < MIN_CODE_SIZE) return false;
  return true;
}

/**
 * Sanitize contract name for filesystem operations
 */
export function sanitizeContractName(name: string): string {
  // Only allow alphanumeric, underscore, hyphen
  // Replace any other characters with underscore
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^[^a-zA-Z]/, 'c') // Must start with letter
    .slice(0, 64); // Max 64 chars
}

/**
 * Generate a safe unique workspace name
 */
export function generateWorkspaceName(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `check_${timestamp}_${random}`;
}
