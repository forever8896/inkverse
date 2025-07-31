/**
 * Shared validation utilities for code validation across lessons and chapters
 */

interface ValidationRule {
  type: 'includes' | 'excludes' | 'regex' | 'custom';
  patterns: string[];
  message?: string;
}

// Client-side validation function
export function validateCode(code: string, rules: ValidationRule[]): boolean {
  return rules.every((rule) => {
    switch (rule.type) {
      case 'includes':
        return rule.patterns.every((pattern) => code.includes(pattern));
      case 'excludes':
        return rule.patterns.every((pattern) => !code.includes(pattern));
      case 'regex':
        return rule.patterns.every((pattern) => new RegExp(pattern).test(code));
      default:
        return true;
    }
  });
}