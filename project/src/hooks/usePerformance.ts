import { useEffect, useRef, useState } from 'react';
import { performanceMonitor, PerformanceMetric, ComponentRenderMetrics } from '../utils/performance';

/**
 * Hook to measure component render performance
 */
export function useComponentPerformance(componentName: string) {
  const renderStart = useRef(performance.now());
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(0);

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    performanceMonitor.recordRender(componentName, renderTime);
    setRenderCount(prev => prev + 1);
    setLastRenderTime(renderTime);
  });

  useEffect(() => {
    renderStart.current = performance.now();
  });

  return {
    renderCount,
    lastRenderTime,
    metrics: performanceMonitor.getComponentRenderMetrics(componentName),
  };
}

/**
 * Hook to measure async operations
 */
export function useAsyncPerformance() {
  const measureAsync = async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureAsync(name, fn);
  };

  return { measureAsync };
}

/**
 * Hook to measure synchronous operations
 */
export function usePerformance() {
  const measure = <T,>(name: string, fn: () => T): T => {
    return performanceMonitor.measure(name, fn);
  };

  return { measure };
}

/**
 * Hook to get performance metrics
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [renderMetrics, setRenderMetrics] = useState<ComponentRenderMetrics[]>([]);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
      setRenderMetrics(performanceMonitor.getRenderMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    renderMetrics,
    webVitals: performanceMonitor.getWebVitals(),
    pageLoadTime: performanceMonitor.getPageLoadTime(),
    memoryUsage: performanceMonitor.getMemoryUsage(),
  };
}

/**
 * Hook to debounce expensive computations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
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
 * Hook to throttle function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return ((...args: any[]) => {
    if (Date.now() - lastRun.current >= delay) {
      func(...args);
      lastRun.current = Date.now();
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        func(...args);
        lastRun.current = Date.now();
      }, delay - (Date.now() - lastRun.current));
    }
  }) as T;
}

