"use client";

import { useState, useEffect, useCallback } from "react";

export function useSessionStorageState<T>(
  key: string,
  defaultValue: T
): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue);

  // Load from sessionStorage on mount
  useEffect(() => {
    if (!key) return;
    try {
      const item = window.sessionStorage.getItem(key);
      if (item !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key]);

  // Save to sessionStorage when state changes
  const setSessionState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        if (key) {
          try {
            window.sessionStorage.setItem(key, JSON.stringify(newValue));
          } catch (error) {
            console.warn(`Error setting sessionStorage key "${key}":`, error);
          }
        }
        return newValue;
      });
    },
    [key]
  );

  return [state, setSessionState];
}
