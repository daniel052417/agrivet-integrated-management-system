/**
 * React Optimization Utilities
 * 
 * Provides utilities and helpers for React performance optimization
 */

import React from 'react';

/**
 * Memoize a component with React.memo and custom comparison
 */
export function memoWithComparison<T extends React.ComponentType<any>>(
  Component: T,
  arePropsEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
): React.MemoExoticComponent<T> {
  return React.memo(Component, arePropsEqual);
}

/**
 * Create a memoized callback that only updates when dependencies change
 * This is a wrapper around useCallback for easier usage
 */
export function createMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return React.useCallback(callback, deps) as T;
}

/**
 * Create a memoized value that only recalculates when dependencies change
 * This is a wrapper around useMemo for easier usage
 */
export function createMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return React.useMemo(factory, deps);
}

/**
 * Shallow comparison function for React.memo
 */
export function shallowEqual<T extends Record<string, any>>(
  objA: T,
  objB: T
): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(objA[key], objB[key])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Deep comparison function for React.memo (use with caution - can be expensive)
 */
export function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  ) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Higher-order component to prevent re-renders when props haven't changed
 */
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  comparisonFn?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, comparisonFn || shallowEqual);
}

/**
 * Create a stable reference that doesn't change between renders
 */
export function useStableRef<T>(value: T): React.MutableRefObject<T> {
  const ref = React.useRef<T>(value);
  ref.current = value;
  return ref;
}

/**
 * Hook to debounce a value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to throttle a value
 */
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRun = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= delay) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, delay - (Date.now() - lastRun.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

