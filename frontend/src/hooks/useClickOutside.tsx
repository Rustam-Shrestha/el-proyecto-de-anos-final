// @ts-nocheck
/**
 * useClickOutside Hook
 * 
 * Reusable hook to detect clicks outside a referenced element.
 * Extracted from repeated patterns in SelectField, MultiSelectField, 
 * CustomCheckboxDropdown, SelectFilter, etc.
 *
 * Uses a ref for the callback to avoid re-registering the document
 * listener on every render (stable even with inline arrow functions).
 *
 * Usage:
 *   const ref = useClickOutside(() => setIsOpen(false));
 *   <div ref={ref}>...</div>
 */
import { useEffect, useRef } from "react";

const useClickOutside = (callback, extraRefs = []) => {
  const ref = useRef(null);
  const callbackRef = useRef(callback);

  // Keep the callback ref up-to-date without re-running the effect
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Normalize extraRefs: support both DOM elements and ref objects ({current: element})
      const normalizedExtraRefs = Array.isArray(extraRefs)
        ? extraRefs.map((r) => (r && typeof r === "object" && "current" in r ? r.current : r))
        : [];
      const targets = [ref.current, ...normalizedExtraRefs].filter(Boolean);

      if (targets.length > 0 && targets.some((currentRef) => currentRef.contains(event.target))) {
        return;
      }

      if (ref.current && !ref.current.contains(event.target)) {
        callbackRef.current();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [extraRefs]); // Register once — callbackRef ensures fresh closure

  return ref;
};

export default useClickOutside;
