'use client';

/**
 * useCodeCompilation Hook
 *
 * Calls the code validation server to compile ink! contracts
 * and returns structured compilation errors/warnings.
 */

import { useState, useCallback } from 'react';

// Types matching the code validation server response
export interface CompilationError {
  level: 'error' | 'warning' | 'note' | 'help';
  code: string | null;
  message: string;
  location: {
    file: string;
    line: number;
    column: number;
    lineEnd?: number;
    columnEnd?: number;
  } | null;
  snippet: string | null;
  suggestion: string | null;
  explanation: string | null;
}

export interface CompilationResult {
  success: boolean;
  errors: CompilationError[];
  warnings: CompilationError[];
  duration?: number;
  message?: string;
  validationError?: boolean;
  serviceUnavailable?: boolean;
}

interface UseCodeCompilationReturn {
  compile: (code: string) => Promise<CompilationResult>;
  isCompiling: boolean;
  lastResult: CompilationResult | null;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for compiling ink! smart contract code
 *
 * @returns Object with compile function, loading state, and results
 *
 * @example
 * const { compile, isCompiling, lastResult } = useCodeCompilation();
 *
 * const handleCheck = async () => {
 *   const result = await compile(userCode);
 *   if (!result.success) {
 *     // Show errors to user
 *   }
 * };
 */
export function useCodeCompilation(): UseCodeCompilationReturn {
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastResult, setLastResult] = useState<CompilationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compile = useCallback(async (code: string): Promise<CompilationResult> => {
    setIsCompiling(true);
    setError(null);

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle service unavailable
        if (response.status === 503 || errorData.serviceUnavailable) {
          const result: CompilationResult = {
            success: false,
            errors: [{
              level: 'error',
              code: null,
              message: 'Code validation service is temporarily unavailable. Please try again later.',
              location: null,
              snippet: null,
              suggestion: null,
              explanation: null,
            }],
            warnings: [],
            serviceUnavailable: true,
          };
          setLastResult(result);
          return result;
        }

        // Handle other errors
        const result: CompilationResult = {
          success: false,
          errors: [{
            level: 'error',
            code: null,
            message: errorData.error || 'Compilation failed',
            location: null,
            snippet: null,
            suggestion: null,
            explanation: null,
          }],
          warnings: [],
        };
        setLastResult(result);
        return result;
      }

      const result: CompilationResult = await response.json();
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);

      const result: CompilationResult = {
        success: false,
        errors: [{
          level: 'error',
          code: null,
          message: `Failed to connect to compilation service: ${errorMessage}`,
          location: null,
          snippet: null,
          suggestion: null,
          explanation: null,
        }],
        warnings: [],
        serviceUnavailable: true,
      };
      setLastResult(result);
      return result;
    } finally {
      setIsCompiling(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLastResult(null);
    setError(null);
    setIsCompiling(false);
  }, []);

  return {
    compile,
    isCompiling,
    lastResult,
    error,
    reset,
  };
}
