/**
 * Rust Compiler Error Parser
 *
 * Parses rustc/cargo JSON output into structured educational diagnostics.
 * Uses --message-format=json for reliable parsing instead of fragile text regex.
 */

import type {
  RustDiagnostic,
  DiagnosticLocation,
  CargoMessage,
  RustcMessage,
} from '../types/index.js';

// ============================================================================
// Educational Explanations for Common Error Codes
// ============================================================================

const ERROR_EXPLANATIONS: Record<string, string> = {
  // Type Errors
  E0308:
    "Type mismatch: The expected type doesn't match the actual type. Check your variable assignments and function return types.",
  E0277:
    "Trait not satisfied: The type doesn't implement the required trait. You may need to derive or implement it.",
  E0369:
    'Binary operation error: The operator cannot be used with these types. Check if the types support this operation.',

  // Ownership & Borrowing
  E0382:
    'Use of moved value: In Rust, values can only have one owner. Once moved, the original variable cannot be used. Consider using .clone() or references.',
  E0502:
    "Borrow conflict: You can't have a mutable reference while immutable references exist. Restructure your code to avoid overlapping borrows.",
  E0503:
    'Cannot use value because it was mutably borrowed: The value is currently borrowed mutably elsewhere.',
  E0505:
    'Cannot move out of borrowed content: You cannot move a value while it is borrowed.',
  E0507:
    'Cannot move out of a shared reference: Use .clone() if you need to take ownership, or restructure to use references.',
  E0515:
    'Cannot return reference to local variable: Local variables are dropped when the function returns. Return the value itself or use a different lifetime.',
  E0597:
    'Value does not live long enough: The reference outlives the value it points to. Check your lifetimes.',
  E0499:
    'Cannot borrow mutably more than once: Only one mutable reference is allowed at a time.',

  // Scope & Name Resolution
  E0425:
    "Unknown identifier: This variable or function hasn't been defined in the current scope. Check for typos or missing imports.",
  E0412:
    "Unknown type: This type hasn't been defined or imported. Add the appropriate use statement.",
  E0433:
    "Module not found: The specified module path doesn't exist. Check your use statements and module structure.",
  E0599:
    "Method not found: The type doesn't have this method. Check the type's documentation or if you need to import a trait.",
  E0603:
    'Private item: This item is private and cannot be accessed from here. Use pub to make it public if needed.',

  // Syntax & Structure
  E0061:
    'Wrong number of arguments: The function was called with an incorrect number of arguments.',
  E0063:
    'Missing fields: Not all struct fields were provided. Add the missing fields.',
  E0106:
    "Missing lifetime specifier: Rust needs to know how long this reference should live. Add a lifetime parameter like 'a.",
  E0107:
    'Wrong number of type arguments: The generic type has a different number of type parameters.',

  // ink! Specific
  E0432:
    'Unresolved import: The item you are trying to import does not exist. For ink!, make sure you have the correct feature flags enabled.',
  E0405:
    'Trait not found: The trait does not exist in the current scope. For ink! traits, ensure proper imports.',
};

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse Cargo/rustc JSON output into structured diagnostics.
 *
 * Expects output from `cargo contract check --message-format=json`
 * Each line is a separate JSON object.
 */
export function parseCargoJsonOutput(output: string): RustDiagnostic[] {
  const diagnostics: RustDiagnostic[] = [];
  const lines = output.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    try {
      const message = JSON.parse(line) as CargoMessage;

      // We only care about compiler-message reasons
      if (message.reason === 'compiler-message' && message.message) {
        const diagnostic = parseRustcMessage(message.message);
        if (diagnostic) {
          diagnostics.push(diagnostic);
        }
      }
    } catch {
      // Not valid JSON, skip (could be plain text output)
      continue;
    }
  }

  // Deduplicate diagnostics (rustc often repeats errors)
  return deduplicateDiagnostics(diagnostics);
}

/**
 * Parse a single rustc message into a diagnostic
 */
function parseRustcMessage(msg: RustcMessage): RustDiagnostic | null {
  // Skip notes and help that aren't primary diagnostics
  if (msg.level === 'note' || msg.level === 'help') {
    // Unless they contain important information
    if (!msg.spans.some((s) => s.is_primary)) {
      return null;
    }
  }

  // Find the primary span
  const primarySpan = msg.spans.find((s) => s.is_primary) || msg.spans[0];

  // Build location from primary span
  let location: DiagnosticLocation | null = null;
  if (primarySpan) {
    // Filter out spans from ink! macro expansions (not useful for students)
    const fileName = primarySpan.file_name;
    if (!fileName.includes('ink/') && !fileName.includes('.cargo/')) {
      location = {
        file: normalizeFileName(fileName),
        line: primarySpan.line_start,
        column: primarySpan.column_start,
        lineEnd: primarySpan.line_end,
        columnEnd: primarySpan.column_end,
      };
    }
  }

  // Build code snippet
  let snippet: string | null = null;
  if (primarySpan?.text && primarySpan.text.length > 0) {
    snippet = primarySpan.text.map((t) => t.text).join('\n');
  }

  // Find suggestion from children
  let suggestion: string | null = null;
  for (const child of msg.children) {
    if (child.level === 'help' && child.message) {
      suggestion = child.message;
      break;
    }
  }

  // Also check for suggested_replacement in spans
  if (!suggestion && primarySpan?.suggested_replacement) {
    suggestion = `Consider: ${primarySpan.suggested_replacement}`;
  }

  // Get educational explanation
  const errorCode = msg.code?.code || null;
  const explanation = errorCode ? ERROR_EXPLANATIONS[errorCode] || null : null;

  return {
    level: msg.level as 'error' | 'warning' | 'note' | 'help',
    code: errorCode,
    message: cleanMessage(msg.message),
    location,
    snippet,
    suggestion,
    explanation,
  };
}

// ============================================================================
// Utility: Strip ANSI Escape Codes
// ============================================================================

/**
 * Remove ANSI escape codes from text (color codes, cursor movement, etc.)
 */
function stripAnsiCodes(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

// ============================================================================
// Fallback: Text-based Parser
// ============================================================================

/**
 * Fallback parser for when JSON output is not available.
 * Uses text parsing (less reliable but works with any cargo output).
 */
export function parseTextOutput(stderr: string): RustDiagnostic[] {
  // Strip ANSI color codes first
  stderr = stripAnsiCodes(stderr);
  const diagnostics: RustDiagnostic[] = [];
  const lines = stderr.split('\n');

  let currentDiagnostic: Partial<RustDiagnostic> | null = null;
  let snippetLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match error/warning header: error[E0308]: mismatched types
    const headerMatch = line.match(
      /^(error|warning)(?:\[([A-Z]\d+)\])?: (.+)$/
    );
    if (headerMatch) {
      // Save previous diagnostic
      if (currentDiagnostic && currentDiagnostic.message) {
        if (snippetLines.length > 0) {
          currentDiagnostic.snippet = snippetLines.join('\n');
        }
        diagnostics.push(currentDiagnostic as RustDiagnostic);
      }

      const errorCode = headerMatch[2] || null;
      currentDiagnostic = {
        level: headerMatch[1] as 'error' | 'warning',
        code: errorCode,
        message: headerMatch[3],
        location: null,
        snippet: null,
        suggestion: null,
        explanation: errorCode ? ERROR_EXPLANATIONS[errorCode] || null : null,
      };
      snippetLines = [];
      continue;
    }

    // Match location: --> lib.rs:10:5
    const locationMatch = line.match(/^\s*-->\s*(.+):(\d+):(\d+)$/);
    if (locationMatch && currentDiagnostic) {
      currentDiagnostic.location = {
        file: normalizeFileName(locationMatch[1]),
        line: parseInt(locationMatch[2], 10),
        column: parseInt(locationMatch[3], 10),
      };
      continue;
    }

    // Match help/note lines: = help: consider using...
    const helpMatch = line.match(/^\s*=\s*(help|note):\s*(.+)$/);
    if (helpMatch && currentDiagnostic) {
      if (helpMatch[1] === 'help' && !currentDiagnostic.suggestion) {
        currentDiagnostic.suggestion = helpMatch[2];
      }
      continue;
    }

    // Collect code snippet lines (numbered lines or pointer lines)
    if (currentDiagnostic) {
      if (line.match(/^\s*\d+\s*\|/) || line.match(/^\s*\|/)) {
        snippetLines.push(line);
      }
    }
  }

  // Don't forget last diagnostic
  if (currentDiagnostic && currentDiagnostic.message) {
    if (snippetLines.length > 0) {
      currentDiagnostic.snippet = snippetLines.join('\n');
    }
    diagnostics.push(currentDiagnostic as RustDiagnostic);
  }

  return diagnostics;
}

// ============================================================================
// Combined Parser
// ============================================================================

/**
 * Parse compiler output, trying JSON first, then falling back to text.
 */
export function parseCompilerOutput(
  stdout: string,
  stderr: string
): RustDiagnostic[] {
  // Try JSON parsing first (from stdout if using --message-format=json)
  let diagnostics = parseCargoJsonOutput(stdout);

  // If no diagnostics found, try stderr as JSON
  if (diagnostics.length === 0) {
    diagnostics = parseCargoJsonOutput(stderr);
  }

  // If still no diagnostics, fall back to text parsing
  if (diagnostics.length === 0) {
    diagnostics = parseTextOutput(stderr);
  }

  return diagnostics;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize file names for display (remove temp paths)
 */
function normalizeFileName(fileName: string): string {
  // Remove temp directory paths
  const match = fileName.match(/(?:\/tmp\/|\/app\/compile_cache\/temp\/)[^/]+\/(.+)/);
  if (match) {
    return match[1];
  }

  // Remove absolute paths that start with /
  if (fileName.startsWith('/')) {
    const parts = fileName.split('/');
    return parts[parts.length - 1];
  }

  return fileName;
}

/**
 * Clean up compiler messages for display
 */
function cleanMessage(message: string): string {
  return (
    message
      // Remove backticks around types (common in rustc output)
      .replace(/`([^`]+)`/g, "'$1'")
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Remove duplicate diagnostics (same location + message)
 */
function deduplicateDiagnostics(diagnostics: RustDiagnostic[]): RustDiagnostic[] {
  const seen = new Set<string>();
  const result: RustDiagnostic[] = [];

  for (const diag of diagnostics) {
    const key = `${diag.level}:${diag.code}:${diag.message}:${diag.location?.line}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(diag);
    }
  }

  return result;
}

/**
 * Separate errors from warnings
 */
export function categorizeByLevel(diagnostics: RustDiagnostic[]): {
  errors: RustDiagnostic[];
  warnings: RustDiagnostic[];
} {
  return {
    errors: diagnostics.filter((d) => d.level === 'error'),
    warnings: diagnostics.filter((d) => d.level === 'warning'),
  };
}
