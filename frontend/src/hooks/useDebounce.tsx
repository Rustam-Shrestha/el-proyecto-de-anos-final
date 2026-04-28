// @ts-nocheck
/**
 * useDebounce Hook
 *
 * Delays invoking a callback until after `delay` milliseconds have elapsed
 * since the last time the debounced function was called.
 * Useful for search inputs, resize handlers, and other high-frequency events.
 *
 * Usage:
 *   const debouncedSearch = useDebounce((query) => fetchResults(query), 300);
 *   <input onChange={(e) => debouncedSearch(e.target.value)} />
 *
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced version of the callback
 */
import { useCallback, useRef } from "react";

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

export default useDebounce;
