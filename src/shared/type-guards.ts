/**
 * Type guard utilities for runtime type checking
 */

/**
 * Type guard to check if a value is an Error instance
 * @param value - The value to check
 * @returns True if value is an Error, false otherwise
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Safely extracts an error message from an unknown error value
 * @param error - The error value (can be any type)
 * @returns The error message as a string
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return String(error);
}
