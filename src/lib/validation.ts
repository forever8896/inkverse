/**
 * Shared validation utilities for code validation across lessons and chapters
 */

import type { ValidationRule } from './lesson-types';

// =============================================================================
// API Parameter Validation
// =============================================================================

/**
 * Parse a string to integer with NaN check
 * Returns null if the value is empty, undefined, or not a valid integer
 *
 * @param value - String value to parse (typically from URL searchParams)
 * @returns Parsed integer or null if invalid
 *
 * @example
 * const lessonId = parseIntSafe(searchParams.get('lessonId'));
 * if (lessonId === null) {
 *   return NextResponse.json({ error: 'Invalid lessonId' }, { status: 400 });
 * }
 */
export function parseIntSafe(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * Parse multiple integer parameters at once
 * Returns null if any value is invalid
 *
 * @param values - Object with string values to parse
 * @returns Object with parsed integers, or null if any invalid
 *
 * @example
 * const params = parseIntsSafe({ lessonId, chapterId, stepId });
 * if (!params) {
 *   return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
 * }
 * // params.lessonId, params.chapterId, params.stepId are all numbers
 */
export function parseIntsSafe<T extends Record<string, string | null | undefined>>(
  values: T
): { [K in keyof T]: number } | null {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    const parsed = parseIntSafe(value);
    if (parsed === null) {
      return null;
    }
    result[key] = parsed;
  }
  return result as { [K in keyof T]: number };
}

export interface ValidationResult {
  isValid: boolean;
  feedback: string;
}

/**
 * Pattern-specific feedback messages for ink! contract validation
 * These provide helpful hints when code doesn't match expected patterns
 */
const PATTERN_FEEDBACK: Record<string, string> = {
  '#[ink(storage)]':
    'Add the #[ink(storage)] attribute above your struct. This tells ink! that this struct will store data on the blockchain.',
  'struct Creature':
    "Create a struct called 'Creature' - this will be your creature's blueprint. Use 'pub struct Creature {' syntax.",
  is_conscious:
    "Add an 'is_conscious' field inside your struct. This should be of type 'bool' to track if your creature is awake.",
  is_awake:
    "Add an 'is_awake' field inside your struct. This should be of type 'bool' to track if your creature is awake.",
  bool: "Make sure your field is of type 'bool' (true/false values).",
  'impl Creature':
    "Create an implementation block with 'impl Creature {' - this is where your creature's abilities will live.",
  '#[ink(constructor)]':
    'Add the #[ink(constructor)] attribute above your constructor function. This tells ink! this function creates new creatures.',
  birth_awake:
    "Create a constructor function called 'birth_awake' that takes a 'conscious: bool' parameter.",
  birth_sleeping:
    "Create a second constructor called 'birth_sleeping' with no parameters. It should call 'Self::birth_awake(false)'.",
  '#[ink(message)]':
    'Add the #[ink(message)] attribute above your function. This makes it callable from outside the contract.',
  'pub fn is_awake':
    "Create a public function called 'is_awake' that takes '&self' and returns 'bool'.",
  '&self':
    "Your function should take '&self' as a parameter (read-only access to the creature).",
  'self.is_conscious':
    "Return 'self.is_conscious' from your function to tell others if the creature is awake.",
  'self.is_awake':
    "Return 'self.is_awake' from your function to tell others if the creature is awake.",
  'pub fn toggle_consciousness':
    "Create a function called 'toggle_consciousness' that takes '&mut self' (mutable access).",
  '&mut self':
    "Use '&mut self' because you're changing the creature's state. The 'mut' means mutable/changeable.",
  'self.is_conscious = !self.is_conscious':
    "Flip the consciousness state using 'self.is_conscious = !self.is_conscious;' - the ! operator flips true to false and vice versa.",
  'self.is_awake = !self.is_awake':
    "Flip the awake state using 'self.is_awake = !self.is_awake;' - the ! operator flips true to false and vice versa.",
};

/**
 * Get helpful feedback for a specific pattern
 *
 * @param pattern - The code pattern that failed to match
 * @returns Human-readable feedback message
 */
export function getPatternFeedback(pattern: string): string {
  return PATTERN_FEEDBACK[pattern] || `Make sure to include "${pattern}" in your code.`;
}

/**
 * Simple validation - returns boolean only
 * Kept for backward compatibility
 *
 * @param code - The code to validate
 * @param rules - Array of validation rules
 * @returns true if all rules pass
 */
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

/**
 * Enhanced validation with detailed feedback
 *
 * @param code - The code to validate
 * @param rules - Array of validation rules
 * @returns ValidationResult with isValid boolean and feedback message
 *
 * @example
 * const result = validateCodeWithFeedback(userCode, step.validation);
 * if (!result.isValid) {
 *   showError(result.feedback);
 * }
 */
export function validateCodeWithFeedback(
  code: string,
  rules: ValidationRule[]
): ValidationResult {
  for (const rule of rules) {
    switch (rule.type) {
      case 'includes':
        for (const pattern of rule.patterns) {
          if (!code.includes(pattern)) {
            return {
              isValid: false,
              feedback: rule.message || getPatternFeedback(pattern),
            };
          }
        }
        break;
      case 'excludes':
        for (const pattern of rule.patterns) {
          if (code.includes(pattern)) {
            return {
              isValid: false,
              feedback: rule.message || `Remove "${pattern}" from your code.`,
            };
          }
        }
        break;
      case 'regex':
        for (const pattern of rule.patterns) {
          if (!new RegExp(pattern).test(code)) {
            return {
              isValid: false,
              feedback: rule.message || 'Make sure your code matches the required pattern.',
            };
          }
        }
        break;
      case 'custom':
        // Handle custom validation rules if needed
        break;
    }
  }
  return { isValid: true, feedback: '' };
}
