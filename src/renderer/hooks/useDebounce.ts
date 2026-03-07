import { useEffect, useRef } from 'react';

/**
 * Debounce hook for delaying function calls until user stops typing/clicking
 * @param callback Function to debounce
 * @param delay Delay in milliseconds (default: 500ms)
 * @returns Debounced version of callback
 */
export function useDebounce<Args extends unknown[], ReturnType>(
  callback: (...args: Args) => ReturnType,
  delay: number = 500,
): (...args: Args) => void {
  const timeoutRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref if callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  };
}
